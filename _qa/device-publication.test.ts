import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {readFileSync,mkdtempSync,rmSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomUUID} from 'node:crypto'
import {PreflightStorage} from '../server/preflight-storage'
import {createHandler,CarriageJourneyAuthority,handleApi} from '../worker/source'
import {creatorCloudTransport} from '../src/creator-cloud'
import {SpriteCloudArchive} from '../src/sprite-cloud'
import {inspectSpritePng,newSpriteSource,type SpritePng,type SpriteDraft} from '../src/sprite-draft'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {inspectDeviceMapCandidate,verifyPublishedDevicePixels,deviceCandidateBlocks,deviceCandidatePlacement} from '../src/device-map-candidate'
import {DEVICE_CHECKS,DEVICE_LAYOUT,deviceGeometry,assertPublishedDevice,deviceReleasePath} from '../src/device-publication'
import {originalSessionHttp} from '../src/original-session-http'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalEquipmentResource,originalEquipmentBodies,originalStarterState} from '../src/original-equipment-art'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalWorldWalkable} from '../src/original-world-space'
import {GAME_ID} from '../src/game-id'
import {BACKGROUND_CHECKS,BACKGROUND_LAYOUT,type PublishedBackground} from '../src/background-publication'
import {originalBackgroundVersion,originalBoundSceneResources,originalBackgroundReleases,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
const encode=async(r:any)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
// Retained platform-derived transparent sheet is enough for this publication
// fixture; two-source provenance is independently covered by sprite-cloud tests.
const source=await inspectSpritePng(new Uint8Array(readFileSync(new URL('../public/art/starter-states-v1.png',import.meta.url))))
async function draft(){const spec={kind:'states' as const,columns:2,rows:1,cellWidth:320,cellHeight:640,foot:{x:160,y:544},backgroundMode:'alpha' as const,neutralMin:200,chromaMax:20,sourceAnchors:[{x:160,y:544},{x:160,y:544}]},p=prepareSpritePixels(await decode(source),spec)
 const d:SpriteDraft={...newSpriteSource(source,'platform repair states','states'),deviceStateSet:'repair',spec,state:'candidate',result:{png:await encode(p.raster),frames:p.frames,metrics:p.metrics,algorithm:p.algorithm}}
 const c=await inspectDeviceMapCandidate(d,d.id,decode);d.deviceReview={sha256:c.png.sha256,layout:DEVICE_LAYOUT,geometry:deviceGeometry(c.cellWidth,c.cellHeight,c.foot,c.bounds),checks:[...DEVICE_CHECKS],visualAccepted:true};return d
}
class Memory implements Storage{v=new Map<string,string>();get length(){return this.v.size}key(i:number){return [...this.v.keys()][i]??null}getItem(k:string){return this.v.get(k)??null}setItem(k:string,v:string){this.v.set(k,v)}removeItem(k:string){this.v.delete(k)}clear(){this.v.clear()}}
const lock=async<T>(_n:string,w:()=>Promise<T>)=>w()
async function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'published-device-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>();let lose=''
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key),env,undefined,undefined,()=>true);objects.set(key,o)}return o.fetch(r)}})}}
 const handle=createHandler(true,false,true,undefined,undefined,true)
 const server=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const path=(req.url??'/').replace('/'+GAME_ID+'/api/','/api/'),r=await handle(new Request('http://localhost'+path,{method:req.method,headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env)
  if(lose&&path.endsWith(lose)&&req.method==='POST'&&r.ok){lose='';res.destroy();return}res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))
 }catch{res.writeHead(503);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 const base='http://127.0.0.1:'+(server.address() as any).port,creatorStore=new Memory(),playerStore=new Memory(),api=creatorCloudTransport(creatorStore,lock,fetch,base)
 return {base,api,cloud:new SpriteCloudArchive(api),lose:(s:string)=>{lose=s},player:(device?:string)=>originalSessionHttp(playerStore,lock,fetch,base,undefined,undefined,device),restart:()=>{objects.clear();pool.close()},close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}}
}
test('device publication is explicit, reviewed, immutable and exposes only the candidate PNG',async()=>{
 const f=await fixture();try{const d=await draft();await f.cloud.save(d)
  assert.equal(await f.cloud.publication(d.id),null)
  for(const review of [{...d.deviceReview,checks:['broken']},{...d.deviceReview,visualAccepted:false},{...d.deviceReview,sha256:'0'.repeat(64)}])await assert.rejects(f.api('/sprites/'+d.id+'/publish',{review}),/DEVICE_REVIEW_REQUIRED/)
  f.lose('/publish');await assert.rejects(f.cloud.publish(d));f.restart();const release=await f.cloud.publish(d);assertPublishedDevice(release)
  assert.deepEqual(await f.cloud.publication(d.id),release);assert.deepEqual(await (await fetch(f.base+deviceReleasePath(release.id))).json(),release)
  const file=await fetch(f.base+deviceReleasePath(release.id)+'/file');assert.equal(file.status,200);assert.match(file.headers.get('Cache-Control')!,/immutable/);assert.deepEqual(new Uint8Array(await file.arrayBuffer()),d.result!.png.bytes)
  assert.equal((await fetch(f.base+'/api/creator/sprites/'+d.id+'/file/source')).status,401)
  assert.equal((await fetch(f.base+deviceReleasePath(release.id)+'/input-0')).status,401)
  const another=await draft();await f.cloud.save(another);const missing=release.id.split('.')[0]+'.'+another.id
  assert.equal((await fetch(f.base+deviceReleasePath(missing))).status,404)
  const altered=structuredClone(release);altered.review.geometry.bounds[0][0]++
  const g=altered.review.geometry;altered.review.geometry=deviceGeometry(g.cellWidth,g.cellHeight,g.foot,g.bounds)
  await assert.rejects(f.api('/sprites/'+d.id+'/publish',{review:altered.review}),/DEVICE_RELEASE_CONFLICT/)
  await verifyPublishedDevicePixels(release,d.result!.png,decode)
  await assert.rejects(verifyPublishedDevicePixels(altered,d.result!.png,decode),/GEOMETRY_MISMATCH/)
  assert.equal((await handleApi(new Request('https://local/api/creator/device-releases/'+release.id),{})).status,404)
 }finally{await f.close()}
})
test('published geometry uses the same placement and collision in preview, authority and renderer',async()=>{
 const f=await fixture();try{const d=await draft(),release=await f.cloud.publish(d),r=originalTrainRuntime(()=>true),h=r.initial('zh',randomUUID(),{starter:release}),c=await inspectDeviceMapCandidate(d,d.id,decode)
  const b=originalEquipmentBodies(h.sceneId,h.assets)[0],at=deviceCandidatePlacement(h.sceneId,c);assert.deepEqual(at,{x:110,y:160})
  for(let y=125;y<185;y+=2)for(let x=75;x<145;x+=2){const point={x,y},overlap=x+9>b.x&&x<b.x+b.w&&y+15>b.y&&y<b.y+b.h;assert.equal(deviceCandidateBlocks(c,h.sceneId,point),overlap)}
  const inside={x:b.x+2,y:b.y+2};assert.equal(originalWorldWalkable(h,inside),false);assert.throws(()=>r.position(h,inside),/INVALID_POSITION/)
  const recovered=r.upgrade({...h,position:inside});assert.deepEqual(recovered.save,h.save);assert.ok(originalWorldWalkable(recovered,recovered.position))
  const old=r.initial('zh',randomUUID());assert.equal(old.assets?.version,1);assert.notEqual(originalEquipmentResource(old.assets).path,originalEquipmentResource(h.assets).path)
  const bg=originalBackgroundReleases[ORIGINAL_BACKGROUND_PLATFORM],background:PublishedBackground={version:1,id:'a'.repeat(64)+'.'+randomUUID(),scene:'train-at-dead-station',sha256:bg.sha256,bytes:bg.bytes,width:1024,height:1536,review:{sha256:bg.sha256,layout:BACKGROUND_LAYOUT,checks:[...BACKGROUND_CHECKS],visualAccepted:true}}
  const combined=r.initial('zh',randomUUID(),{starter:release,background});assert.equal(originalBackgroundVersion(combined.assets),background.id);assert.equal((combined.assets as any).starter.id,release.id)
  const resources=originalBoundSceneResources({scenes:{[h.sceneId]:{version:'synthetic-layout',assets:[bg]}}} as any,combined.assets)
  assert.ok(resources.scenes[h.sceneId].assets[0].path.endsWith('/releases/'+background.id+'/file'))
 }finally{await f.close()}
})
for(const locale of ['zh','en'] as const)test('published device stays bound through a complete '+locale+' journey and lost responses',async()=>{
 const f=await fixture();try{const old=await f.player().client.enroll(locale),d=await draft(),release=await f.cloud.publish(d);let connection=f.player(release.id)
  f.lose('/sessions');await assert.rejects(connection.client.enroll(locale));f.restart();connection=f.player(release.id);let h=await connection.client.enroll(locale)
  assert.notEqual(h.id,old.id);assert.equal(h.assets?.version,3);const assets=structuredClone(h.assets);assert.deepEqual((assets as any).starter,release)
  const world=originalTrainChapterSpatialPlan(),steps=['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led','tunnel-ventilate','tunnel-depart','yard-meet','yard-medical-pact','yard-route-brief','yard-invite','yard-depart','pass-inspect','pass-player-watch','pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart','town-inspect','town-grid-aid','town-public-rules','town-refuel','town-repair','town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange','bridge-rail-crossing','junction-review','junction-settle-basic']
  for(const [i,action]of steps.entries()){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!,intent={target:e.id,position:e.approach,type:'action',action}
   if(i===0){f.lose('/actions');await assert.rejects(connection.client.send(h,intent));f.restart();connection=f.player(release.id);h=(await connection.client.recover()).head;assert.equal(originalStarterState(h.save),'repaired');assert.equal(h.save.stats.condition,87)}else h=(await connection.client.send(h,intent)).head
   assert.deepEqual(h.assets,assets);assert.equal(h.version,i+1)
  }
  h=(await connection.client.sendEnding(h)).head;assert.equal(h.save.finale.status,'complete');f.restart();assert.deepEqual(await f.player(release.id).client.enroll(locale),h);assert.deepEqual(await f.player().client.enroll(locale),old)
  const pending=connection.client.read<any>('enrollment-request',null);await assert.rejects(f.player().api('/sessions',pending),/ENROLLMENT_ID_CONFLICT/)
  const missing=release.id.split('.')[0]+'.'+randomUUID();await assert.rejects(f.player(missing).client.enroll(locale),/DEVICE_NOT_PUBLISHED/)
 }finally{await f.close()}
})
