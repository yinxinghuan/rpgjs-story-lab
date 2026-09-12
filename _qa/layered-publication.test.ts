import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {mkdtempSync,rmSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomUUID} from 'node:crypto'
import {PreflightStorage} from '../server/preflight-storage'
import {createHandler,CarriageJourneyAuthority} from '../worker/source'
import {creatorCloudTransport} from '../src/creator-cloud'
import {LayeredCloudArchive} from '../src/layered-cloud'
import {inspectSpritePng} from '../src/sprite-draft'
import {fanPartsSpec,LAYER_CHECKS} from '../src/layered-device'
import {newLayeredSource,layerSignature,type LayeredDraft} from '../src/layered-draft'
import {layerManifest,assertLayerManifest,assertPublishedLayer,layerReleasePath} from '../src/layered-archive-contract'
import {originalSessionHttp} from '../src/original-session-http'
import {originalFanRelease,originalEnrollmentAssets,assertOriginalAssetBindings} from '../src/original-asset-releases'
import {originalEquipmentBodies,originalEquipmentAnimation,originalFanResources,originalBoundFanSheets} from '../src/original-equipment-art'
import {originalWorldWalkable} from '../src/original-world-space'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalVisualContext} from '../server/original-visual-context'
import {GAME_ID} from '../src/game-id'
const png=async(path:string)=>inspectSpritePng(new Uint8Array(readFileSync(path)))
async function draft(){const d:LayeredDraft={...newLayeredSource(await png('doc/platform-art-candidates/20260912/tunnel-fan-parts-01/candidate.png'),'platform-fan-test',fanPartsSpec),state:'candidate',result:{housing:await png('public/art/fan-housing-v1.png'),rotor:await png('public/art/fan-rotor-v1.png')}};d.review={signature:await layerSignature(d),layout:'layered-north-river-1',checks:[...LAYER_CHECKS],visualAccepted:true};return d}
class Memory implements Storage{v=new Map<string,string>();get length(){return this.v.size}key(i:number){return [...this.v.keys()][i]??null}getItem(k:string){return this.v.get(k)??null}setItem(k:string,v:string){this.v.set(k,v)}removeItem(k:string){this.v.delete(k)}clear(){this.v.clear()}}
const lock=async<T>(_n:string,w:()=>Promise<T>)=>w()
async function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'published-layer-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>();let lose=''
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key),env,undefined,undefined,undefined);objects.set(key,o)}return o.fetch(r)}})}}
 const handle=createHandler(true,false,true,undefined,undefined,true)
 const server=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const path=(req.url??'/').replace('/'+GAME_ID+'/api/','/api/'),r=await handle(new Request('http://localhost'+path,{method:req.method,headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env)
  if(lose&&path.endsWith(lose)&&req.method==='POST'&&r.ok){lose='';res.destroy();return}res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))
 }catch{res.writeHead(503);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 const base='http://127.0.0.1:'+(server.address() as any).port,creatorStore=new Memory(),playerStore=new Memory(),api=creatorCloudTransport(creatorStore,lock,fetch,base)
 return {base,api,cloud:new LayeredCloudArchive(api),lose:(s:string)=>{lose=s},player:(fan?:string)=>originalSessionHttp(playerStore,lock,fetch,base,undefined,undefined,undefined,undefined,fan),restart:()=>{objects.clear();pool.close()},close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}}
}
test('layer archive resumes chunks and publication after response loss; source private, outputs immutable, review identity preserved',async()=>{
 const f=await fixture();try{
 const d=await draft(),unreviewed=structuredClone(d);delete unreviewed.review
 f.lose('/parts');await assert.rejects(f.cloud.save(unreviewed));f.restart();await f.cloud.save(unreviewed)
 assert.equal(await f.cloud.publication(d.id),null);await assert.rejects(f.api('/layers/'+d.id+'/publish',{review:d.review}),/REVIEW_REQUIRED/)
 const before=await f.cloud.list();assert.equal(before.length,1);assert.equal((await f.cloud.restore(before[0])).review,undefined)
 f.lose('/review');await assert.rejects(f.cloud.save(d));f.restart();await f.cloud.save(d)
 const restored=await f.cloud.restore((await f.cloud.list())[0]);assert.deepEqual(restored.review,d.review);assert.deepEqual(restored.source,d.source);assert.deepEqual(restored.result,d.result)
 f.lose('/publish');await assert.rejects(f.cloud.publish(d));f.restart();const r=await f.cloud.publish(d);assertPublishedLayer(r);assert.deepEqual(await f.cloud.publication(d.id),r);assert.equal((await f.cloud.list()).length,1)
 const url=f.base+layerReleasePath(r.id);assert.deepEqual(await (await fetch(url)).json(),r)
 for(const part of ['housing','rotor']as const){const response=await fetch(url+'/'+part);assert.match(response.headers.get('cache-control')!,/immutable/);assert.deepEqual(new Uint8Array(await response.arrayBuffer()),d.result![part].bytes)}
 assert.equal((await fetch(url+'/source')).status,401);assert.equal((await fetch(f.base+'/api/creator/layers/'+d.id+'/file/source')).status,401)
 const outsider=new LayeredCloudArchive(creatorCloudTransport(new Memory(),lock,fetch,f.base));assert.deepEqual(await outsider.list(),[]);await assert.rejects(outsider.restore(before[0]),/NOT_FOUND/)
 const modified=structuredClone(d);modified.spec.periodMs=1600;modified.review!.signature=await layerSignature(modified);await assert.rejects(f.cloud.publish(modified),/CONFLICT/)
 const bad=layerManifest(d).manifest;bad.spec.housingScale=NaN;assert.throws(()=>assertLayerManifest(bad));assert.deepEqual(await f.cloud.publication(d.id),r)
 }finally{await f.close()}
})
for(const locale of ['zh','en']as const)test('published fan binds one '+locale+' journey through full story and lost enrollment/action/ending replies, preserving old journey',async()=>{
 const f=await fixture();try{
 const old=await f.player().client.enroll(locale),d=await draft();d.spec.periodMs=1600;d.spec.body.width=30;d.review!.signature=await layerSignature(d);const release=await f.cloud.publish(d)
 let connection=f.player(release.id);f.lose('/sessions');await assert.rejects(connection.client.enroll(locale));f.restart();connection=f.player(release.id);let h=await connection.client.enroll(locale)
 assert.notEqual(h.id,old.id);assert.deepEqual(originalFanRelease(h.assets),release);const assets=structuredClone(h.assets),world=originalTrainChapterSpatialPlan()
 const steps=['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led',locale==='zh'?'tunnel-ventilate':'tunnel-discard','tunnel-depart','yard-meet','yard-medical-pact','yard-route-brief','yard-invite','yard-depart','pass-inspect','pass-player-watch','pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart','town-inspect','town-grid-aid','town-public-rules','town-refuel','town-repair','town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange','bridge-rail-crossing','junction-review','junction-settle-basic']
 for(const [i,action]of steps.entries()){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!,intent={target:e.id,position:e.approach,type:'action',action};if(i===8){const fuel=h.save.stats.fuel;f.lose('/actions');await assert.rejects(connection.client.send(h,intent));f.restart();connection=f.player(release.id);h=(await connection.client.recover()).head;assert.equal(h.save.stats.fuel,fuel-(locale==='zh'?8:0));assert.equal(originalEquipmentAnimation(h.save,'rotor',400,h.assets),locale==='zh'?'spin-9':'stopped');assert.equal(originalEquipmentBodies(h.sceneId,h.assets).find(b=>b.id==='tunnel-fan')?.w,30);assert.equal(originalWorldWalkable(h,{x:104,y:150}),false);assert.deepEqual(originalVisualContext(h,'ada-mechanic').equipment[0].appearance,{})}else h=(await connection.client.send(h,intent)).head;assert.equal(h.version,i+1);assert.deepEqual(h.assets,assets)}
 f.lose('/ending');await assert.rejects(connection.client.sendEnding(h));f.restart();h=(await f.player(release.id).client.recover()).head;assert.equal(h.save.finale.status,'complete');assert.deepEqual(h.assets,assets);assert.deepEqual(await f.player().client.enroll(locale),old);assert.equal(originalFanRelease(old.assets),undefined)
 const newAssets=originalEnrollmentAssets({fan:release});assertOriginalAssetBindings(newAssets);assert.ok(originalFanResources(newAssets).every(([part,r])=>r.path.endsWith('/'+part)));assert.equal(originalBoundFanSheets('h','r',newAssets)[1].id,'original-fan-rotor-v1')
 await assert.rejects(f.player(release.id.split('.')[0]+'.'+randomUUID()).client.enroll(locale),/LAYER_NOT_PUBLISHED/)
 }finally{await f.close()}
})
