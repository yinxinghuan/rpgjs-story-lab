import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {readFileSync,mkdtempSync,rmSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {PreflightStorage} from '../server/preflight-storage'
import {createHandler,CarriageJourneyAuthority} from '../worker/source'
import {CreatorCloudDrafts,creatorCloudTransport} from '../src/creator-cloud'
import {inspectArtCandidate,planArtDraft,type ArtDraft} from '../src/art-draft'
import {BACKGROUND_CHECKS,BACKGROUND_LAYOUT,assertPublishedBackground,backgroundReleasePath} from '../src/background-publication'
import {originalSessionHttp} from '../src/original-session-http'
import {originalBoundSceneResources,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
import {originalStoryPreviewDefinition} from '../server/original-scene-preview'
import {originalTrainSpatialPlan} from '../src/original-train-spatial-plan'
import {GAME_ID} from '../src/game-id'
const bytes=new Uint8Array(readFileSync(new URL('../doc/platform-art-candidates/20260911/environment-edit-02/candidate.png',import.meta.url))),candidate=await inspectArtCandidate(bytes)
class Memory implements Storage{v=new Map<string,string>();get length(){return this.v.size}key(i:number){return [...this.v.keys()][i]??null}getItem(k:string){return this.v.get(k)??null}setItem(k:string,v:string){this.v.set(k,v)}removeItem(k:string){this.v.delete(k)}clear(){this.v.clear()}}
// Build-time whitebox rendering must happen before the HTTP server starts;
// synchronous rendering otherwise stalls Node's keep-alive timers.
const baseResources=originalStoryPreviewDefinition()
const lock=async<T>(_n:string,w:()=>Promise<T>)=>w()
async function fixture(){
 const dir=mkdtempSync(join(tmpdir(),'published-background-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>();let calls=0,lose=''
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key),env,undefined,undefined,()=>true,undefined,undefined,async()=>{calls++;return bytes});objects.set(key,o)}return o.fetch(r)}})}}
 const handle=createHandler(true,false,true,undefined,undefined,true)
 const server=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const path=(req.url??'/').replace('/'+GAME_ID+'/api/','/api/'),r=await handle(new Request('http://localhost'+path,{method:req.method,headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env)
  if(lose&&path.endsWith(lose)&&req.method==='POST'&&r.ok){lose='';res.destroy();return}res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))
 }catch{res.writeHead(503);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 const base='http://127.0.0.1:'+(server.address() as any).port,creatorStore=new Memory(),playerStore=new Memory(),api=creatorCloudTransport(creatorStore,lock,fetch,base)
 return {base,api,cloud:new CreatorCloudDrafts(api),calls:()=>calls,lose:(suffix:string)=>{lose=suffix},player:(id?:string)=>originalSessionHttp(playerStore,lock,fetch,base,undefined,id),restart:()=>{objects.clear();pool.close()},close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}}
}
function draft():ArtDraft{const d=planArtDraft('cool');return {...d,taskId:'mt_1a1c4492493eaf68a32331d43d91c207',candidate,state:'candidate',retryable:false,review:{sha256:candidate.sha256,layout:BACKGROUND_LAYOUT,checks:[...BACKGROUND_CHECKS],visualAccepted:true}}}
test('publication requires same-image layout review; only explicit publication exposes immutable PNG',async()=>{
 const f=await fixture();try{const d=draft();await f.cloud.save(d)
  await assert.rejects(f.api('/drafts/'+d.id+'/publish',{sha256:candidate.sha256,review:{...d.review,checks:['starter']}}),/BACKGROUND_REVIEW_REQUIRED/)
  await assert.rejects(f.api('/drafts/'+d.id+'/publish',{sha256:'0'.repeat(64),review:d.review}),/ART_SOURCE_MISMATCH/)
  await assert.rejects(f.api('/drafts/'+d.id+'/publish',{sha256:candidate.sha256,review:{...d.review,visualAccepted:false}}),/BACKGROUND_REVIEW_REQUIRED/)
  assert.equal((await fetch(f.base+'/api/creator/drafts/'+d.id+'/file')).status,401)
  f.lose('/publish');await assert.rejects(f.cloud.publish(d));f.restart();const release=await f.cloud.publish(d);assertPublishedBackground(release);assert.equal(f.calls(),1)
  const r=await fetch(f.base+backgroundReleasePath(release.id));assert.equal(r.status,200);assert.deepEqual(await r.json(),release)
  const file=await fetch(f.base+backgroundReleasePath(release.id)+'/file');assert.equal(file.status,200);assert.match(file.headers.get('Cache-Control')!,/immutable/);assert.deepEqual(new Uint8Array(await file.arrayBuffer()),bytes)
  const other=draft();other.taskId='mt_2a1c4492493eaf68a32331d43d91c207';await f.cloud.save(other)
  const unknown=release.id.split('.')[0]+'.'+other.id;assert.equal((await fetch(f.base+backgroundReleasePath(unknown))).status,404);assert.equal((await fetch(f.base+backgroundReleasePath(unknown)+'/file')).status,404)
  assert.throws(()=>assertPublishedBackground({...release,path:'https://elsewhere.invalid/image.png'}),/BACKGROUND_RELEASE_INVALID/)
 }finally{await f.close()}
})
test('new journey binds published background once, recovers lost enrollment and preserves old journeys',async()=>{
 const f=await fixture();try{const normal=f.player(),old=await normal.client.enroll('zh');assert.equal(old.assets?.version,1)
  const d=draft(),release=await f.cloud.publish(d),variant=f.player(release.id)
  f.lose('/sessions');await assert.rejects(variant.client.enroll('zh'));f.restart()
  let h=await f.player(release.id).client.enroll('zh');assert.notEqual(h.id,old.id);assert.deepEqual(h.assets,{version:2,published:release})
  const entity=originalTrainSpatialPlan().entities.find(e=>e.id==='starter')!
  h=(await f.player(release.id).client.send(h,{type:'action',action:'repair-starter',target:entity.id,position:entity.approach})).head
  assert.equal(h.save.stats.condition,87);assert.deepEqual(h.assets,{version:2,published:release})
  f.restart();assert.deepEqual(await f.player(release.id).client.enroll('zh'),h);assert.deepEqual(await f.player().client.enroll('zh'),old)
  const resources=originalBoundSceneResources(baseResources,h.assets),bg=resources.scenes['train-at-dead-station'].assets.find(a=>a.kind==='background')!
  assert.equal(bg.path,backgroundReleasePath(release.id)+'/file');assert.equal(bg.sha256,candidate.sha256);assert.notEqual(bg.path,ORIGINAL_BACKGROUND_PLATFORM)
  const downloaded=await fetch(f.base+bg.path);assert.equal(downloaded.status,200);assert.deepEqual(new Uint8Array(await downloaded.arrayBuffer()),bytes)
  const enrollment=variant.client.read<any>('enrollment-request',null)
  await assert.rejects(normal.api('/sessions',enrollment),/ENROLLMENT_ID_CONFLICT/)
  const unpublished=draft();await f.cloud.save(unpublished);const bad=release.id.split('.')[0]+'.'+unpublished.id
  await assert.rejects(f.player(bad).client.enroll('zh'),/BACKGROUND_NOT_PUBLISHED/)
  assert.deepEqual(await f.player().client.enroll('zh'),old)
 }finally{await f.close()}
})
