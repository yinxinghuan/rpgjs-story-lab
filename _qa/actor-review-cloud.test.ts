import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,mkdtempSync,rmSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {tmpdir} from 'node:os'
import {createServer} from 'node:http'
import {PreflightStorage} from '../server/preflight-storage'
import {CreatorSpriteArchive} from '../server/creator-sprites'
import {CarriageJourneyAuthority,createHandler} from '../worker/source'
import {creatorCloudTransport} from '../src/creator-cloud'
import {SpriteCloudArchive} from '../src/sprite-cloud'
import {spriteManifest,spriteManifestSignature,spritePartText,SPRITE_ARCHIVE_PART} from '../src/sprite-archive-contract'
import {inspectSpritePng,newSpriteSource,type SpriteDraft} from '../src/sprite-draft'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {emptyActorAnswers,saveActorSheetReview,type ActorSheetReview} from '../src/actor-sheet-review'
import {actorReviewId,ACTOR_REVIEW_LIMIT} from '../src/actor-review-archive'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=await inspectSpritePng(new Uint8Array(readFileSync('doc/platform-art-candidates/20260911/actor-edit-03/candidate.png'))),decoded=PNG.sync.read(Buffer.from(source.bytes))
const spec={kind:'actor' as const,columns:3,rows:4,cellWidth:320,cellHeight:320,foot:{x:160,y:300},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
const prepared=prepareSpritePixels({width:decoded.width,height:decoded.height,rgba:new Uint8ClampedArray(decoded.data)},spec)
const base:SpriteDraft={...newSpriteSource(source,'synthetic-review-test-on-retained-Ada','actor'),spec,state:'candidate',result:{png:await inspectSpritePng(PNG.sync.write({width:prepared.raster.width,height:prepared.raster.height,data:Buffer.from(prepared.raster.rgba)})),algorithm:prepared.algorithm,frames:prepared.frames,metrics:prepared.metrics}}
async function draft(){let d:SpriteDraft={...structuredClone(base),id:crypto.randomUUID()};const answers=emptyActorAnswers();answers.up.alternatingSteps='fail';return saveActorSheetReview({get:async()=>d,list:async()=>[d],save:async n=>{d=n}},d,answers)}
const input=async(review:ActorSheetReview)=>({id:await actorReviewId(review),review})
function fixture(){const dir=mkdtempSync(join(tmpdir(),'actor-review-cloud-')),pool=new PreflightStorage(dir)
 const db=()=>{const ctx=pool.context('synthetic-actor-review');return {all:<T>(s:string,...b:any[])=>ctx.storage.sql.exec(s,...b).toArray() as T[],run:(s:string,...b:any[])=>{ctx.storage.sql.exec(s,...b)},transaction:<T>(w:()=>T)=>ctx.storage.transactionSync(w)}}
 let archive=new CreatorSpriteArchive(db());return {get archive(){return archive},restart:()=>{pool.close();archive=new CreatorSpriteArchive(db())},close:()=>{pool.close();rmSync(dir,{recursive:true,force:true})}}
}
async function upload(a:CreatorSpriteArchive,d:SpriteDraft,finish=true){const {manifest,payload}=spriteManifest(d);a.begin('alice',manifest)
 for(const f of manifest.files){const bytes=payload.get(f.role)!.bytes;for(let offset=0,part=0;offset<bytes.length;offset+=SPRITE_ARCHIVE_PART,part++)a.part('alice',d.id,{role:f.role,part,data:spritePartText(bytes.subarray(offset,offset+SPRITE_ARCHIVE_PART))})}
 if(finish)await a.finish('alice',d.id);return manifest
}
test('actor review history is private, append-only and restart-safe; late replay cannot make an old rejection latest again',async()=>{
 const f=fixture();try{const d=await draft(),m=await upload(f.archive,d,false),first=await input(d.actorReview!)
  assert.throws(()=>f.archive.actorReviews('alice',d.id),/NOT_READY/);await assert.rejects(f.archive.saveActorReview('alice',d.id,first),/NOT_READY/)
  await f.archive.finish('alice',d.id);const one=await f.archive.saveActorReview('alice',d.id,first);assert.equal(one.revision,1)
  const revised=structuredClone(d.actorReview!);revised.recordedAt++;revised.answers.right.facing='fail';const two=await f.archive.saveActorReview('alice',d.id,await input(revised));assert.equal(two.revision,2)
  assert.deepEqual(await f.archive.saveActorReview('alice',d.id,first),one);f.restart()
  assert.deepEqual(f.archive.actorReviews('alice',d.id),[two,one]);assert.equal(spriteManifestSignature(f.archive.get('alice',d.id).manifest),spriteManifestSignature(m))
  assert.throws(()=>f.archive.actorReviews('bob',d.id),/NOT_FOUND/);await assert.rejects(f.archive.saveActorReview('bob',d.id,first),/NOT_FOUND/)
  assert.equal(f.archive.publication('alice',d.id),null)
 }finally{f.close()}
})
test('mismatched candidate, preparation, content identity and unknown fields are refused; async validation snapshots the input',async()=>{
 const f=fixture();try{const d=await draft();await upload(f.archive,d)
  for(const change of [(r:any)=>r.review.draftId=crypto.randomUUID(),(r:any)=>r.review.candidateSha256='0'.repeat(64),(r:any)=>r.review.preparation+=' ',(r:any)=>r.id='0'.repeat(64),(r:any)=>r.extra=true]){const v=await input(structuredClone(d.actorReview!));change(v);await assert.rejects(f.archive.saveActorReview('alice',d.id,v),/INVALID/)}
  assert.equal(f.archive.actorReviews('alice',d.id).length,0)
  const v=await input(structuredClone(d.actorReview!)),saving=f.archive.saveActorReview('alice',d.id,v);v.review.answers.up.alternatingSteps='pass'
  assert.equal((await saving).review.answers.up.alternatingSteps,'fail')
  const other=await draft();await upload(f.archive,other);await assert.rejects(f.archive.saveActorReview('alice',other.id,await input(d.actorReview!)),/INVALID/)
 }finally{f.close()}
})
test('review history is bounded per asset; at capacity idempotent replay still succeeds and no prior review is deleted',async()=>{
 const f=fixture();try{const d=await draft();await upload(f.archive,d);let first:any
  for(let i=0;i<ACTOR_REVIEW_LIMIT;i++){const v=await input({...structuredClone(d.actorReview!),recordedAt:i});const saved=await f.archive.saveActorReview('alice',d.id,v);if(!i)first={v,saved}}
  await assert.rejects(f.archive.saveActorReview('alice',d.id,await input({...d.actorReview!,recordedAt:ACTOR_REVIEW_LIMIT})),/LIMIT/)
  assert.deepEqual(await f.archive.saveActorReview('alice',d.id,first.v),first.saved);assert.equal(f.archive.actorReviews('alice',d.id).length,64)
 }finally{f.close()}
})
class Memory implements Storage{values=new Map<string,string>();get length(){return this.values.size}key(i:number){return [...this.values.keys()][i]??null}getItem(k:string){return this.values.get(k)??null}setItem(k:string,v:string){this.values.set(k,v)}removeItem(k:string){this.values.delete(k)}clear(){this.values.clear()}}
test('real HTTP lost review response recovers after restart without another version; restoration loads newest review and outsiders cannot read it',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'actor-review-http-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>();let lose=true
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key));objects.set(key,o)}return o.fetch(r)}})}}
 const handler=createHandler(true,false,false,undefined,undefined,true),server=createServer(async(req,res)=>{try{
  const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const bytes=Buffer.concat(chunks),r=await handler(new Request('http://localhost'+req.url,{method:req.method,headers,body:req.method==='GET'?undefined:bytes}),env)
  if(lose&&req.method==='POST'&&req.url?.endsWith('/actor-reviews')&&r.ok){lose=false;res.destroy();return}
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))
 }catch{res.writeHead(500);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 try{const origin='http://127.0.0.1:'+(server.address() as any).port,storage=new Memory(),lock=async<T>(_n:string,w:()=>Promise<T>)=>w(),make=(s=storage)=>new SpriteCloudArchive(creatorCloudTransport(s,lock,fetch,origin)),d=await draft()
  assert.ok(Buffer.byteLength(JSON.stringify(await input(d.actorReview!)))<6000)
  const progress:{done:number;total:number}[]=[]
  await assert.rejects(make().saveWithReview(d,(done,total)=>progress.push({done,total})),/SAVE_FAILED/)
  assert.ok(progress.length>0);assert.equal(progress.at(-1)!.done,progress.at(-1)!.total)
  assert.equal((await make().list())[0].state,'ready');objects.clear();pool.close()
  const ready=await make().saveWithReview(d);assert.equal((await make().reviews(ready)).length,1)
  const revised=structuredClone(d);revised.actorReview!.recordedAt++;revised.actorReview!.answers.right.facing='fail';await make().saveWithReview(revised)
  await make().saveWithReview(d);assert.equal((await make().reviews(ready)).length,2)
  assert.deepEqual((await make().restore(ready)).actorReview,revised.actorReview)
  assert.equal((await fetch(origin+'/api/creator/sprites/'+d.id+'/actor-reviews')).status,401)
  await assert.rejects(make(new Memory()).reviews(ready),/NOT_FOUND/)
  assert.equal(await make().publication(d.id),null)
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}
})
test('client rejects forged, reordered and duplicated review history before restoration',async()=>{
 const f=fixture();try{const d=await draft();await upload(f.archive,d);const record=f.archive.get('alice',d.id),one=await f.archive.saveActorReview('alice',d.id,await input(d.actorReview!)),two=await f.archive.saveActorReview('alice',d.id,await input({...d.actorReview!,recordedAt:d.actorReview!.recordedAt+1}))
  for(const reviews of [[one,two],[two,two],[{...one,id:'0'.repeat(64)}],[{...one,review:{...one.review,draftId:crypto.randomUUID()}}]]){
   const cloud=new SpriteCloudArchive(async()=>({reviews}));await assert.rejects(cloud.reviews(record),/INVALID/)
  }
 }finally{f.close()}
})
