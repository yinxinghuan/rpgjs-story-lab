import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import type {AuthorityStorage} from '../server/session-authority'
import {OldStreetAuthority} from '../server/old-street-runtime'
import {OldStreetRoomMedia} from '../server/old-street-room-media'
import {inspectRoomPixels} from '../src/old-street-room-image'
import {handleOldStreetSession} from '../server/old-street-http'
import {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from '../src/old-street-runtime-contract'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const png=new Uint8Array(PNG.sync.write({width:512,height:512,data:Buffer.alloc(512*512*4,255)}))
function fixture(){
 const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN IMMEDIATE');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 const head=new OldStreetAuthority(db,()=>true).create('owner',crypto.randomUUID(),'en')
 head.save.facts['darkroom-ready']=true;head.expansions=[{version:1,id:crypto.randomUUID(),template:'photo-darkroom-v1',sourceScene:'photo',input:'darkroom',status:'requested',requestedAtVersion:0}]
 const get=(o:string)=>{assert.equal(o,'owner');return head}
 return {raw,db,head,get}
}
test('room is already admitted; slots finish independently, resume without regeneration and never change world',async()=>{
 const {raw,db,head,get}=fixture(),before=JSON.stringify(head),media=new OldStreetRoomMedia(db,get)
 try{
  media.sync('owner',head.id)
  let release!:()=>void;const held=new Promise<void>(r=>release=r),started:string[]=[]
  const work=media.run('owner',head.id,async(j,onTask)=>{started.push(j.id);onTask('task_'+j.id);if(j.id==='bench')await held;return png})
  for(let i=0;i<20&&media.list('owner',head.id)[0].state!=='ready';i++)await new Promise(r=>setTimeout(r,5))
  assert.deepEqual(started.sort(),['bench','floor']);assert.equal(media.list('owner',head.id)[0].state,'ready');assert.equal(media.list('owner',head.id)[1].state,'preparing')
  await media.run('owner',head.id,async()=>{throw Error('live lease must prevent duplicate generation')})
  assert.equal(media.list('owner',head.id)[1].state,'preparing')
  release();await work
  const recovered=new OldStreetRoomMedia(db,get);recovered.sync('owner',head.id)
  await recovered.run('owner',head.id,async()=>{throw Error('must not generate completed assets')})
  assert.ok(recovered.list('owner',head.id).every(j=>j.state==='ready'))
  assert.deepEqual(await recovered.file('owner',head.id,'bench'),png);assert.equal(JSON.stringify(head),before)
  assert.throws(()=>recovered.list('intruder',head.id));head.save.facts['darkroom-ready']=false;assert.throws(()=>recovered.list('owner',head.id))
 }finally{raw.close()}
})
test('ambiguous failure preserves task/request, concurrent run is fenced and corrupt image affects one slot only',async()=>{
 const {raw,db,head,get}=fixture();let now=1000,seen='';const media=new OldStreetRoomMedia(db,get,()=>now)
 try{
  media.sync('owner',head.id)
  await media.run('owner',head.id,async(j,task)=>{task('task_'+j.id);if(j.id==='floor'){seen=j.requestId;throw Error('network')}return new Uint8Array([1,2])})
  const states=media.list('owner',head.id);assert.equal(states[0].recoverable,true);assert.equal(states[1].recoverable,false)
  now+=9000
  await media.run('owner',head.id,async(j)=>{assert.equal(j.requestId,seen);assert.equal(j.taskId,'task_floor');return png})
  assert.equal(media.list('owner',head.id)[0].state,'ready');assert.equal(media.list('owner',head.id)[1].state,'failed')
 }finally{raw.close()}
})
test('matte removal leaves object geometry unchanged and rejects opaque or cropped furniture',()=>{
 const pixels=new Uint8ClampedArray(512*512*4)
 for(let i=0;i<pixels.length;i+=4)pixels.set([255,0,255,255],i)
 for(let y=150;y<350;y++)for(let x=56;x<456;x++)pixels.set([80,65,40,255],(y*512+x)*4)
 assert.deepEqual(inspectRoomPixels('bench',pixels,512,512),{x:56,y:150,width:400,height:200})
 assert.equal(pixels[(150*512+56)*4],80);assert.equal(pixels[3],0)
 assert.throws(()=>inspectRoomPixels('bench',new Uint8ClampedArray(512*512*4).fill(255),512,512))
 assert.throws(()=>inspectRoomPixels('floor',pixels,512,512))
})
test('room HTTP validates the request, schedules without awaiting media and serves matching private bytes',async()=>{
 const {raw,db,head,get}=fixture(),media=new OldStreetRoomMedia(db,get),pending:Promise<unknown>[]=[]
 const authority={} as OldStreetAuthority
 const request=(suffix:string,body?:unknown,method=body===undefined?'GET':'POST')=>new Request('https://worker.invalid'+OLD_STREET_API_PATH+'/sessions/'+head.id+'/'+suffix,{method,headers:{[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
 const route=(r:Request)=>handleOldStreetSession(r,'owner',authority,r=>r.json(),undefined,undefined,undefined,{media,produce:async()=>png,background:p=>pending.push(p)})
 try{
  for(const body of [1,[],{retryId:''},{retryId:'other'},{prompt:'new geometry'}])assert.equal((await route(request('room-art',body))).status,400)
  assert.equal((await route(request('room-art',undefined,'DELETE'))).status,405)
  const response=await route(request('room-art',{}));assert.equal(response.status,200);assert.equal((await response.json()).jobs.length,2)
  await Promise.all(pending)
  const image=await route(request('room-art-file?asset=bench'));assert.equal(image.status,200);assert.equal(image.headers.get('cache-control'),'private, no-store');assert.deepEqual(new Uint8Array(await image.arrayBuffer()),png)
  assert.equal((await route(request('room-art-file?asset=unknown'))).status,404)
  assert.equal((await handleOldStreetSession(request('room-art'),'owner',authority,r=>r.json())).status,503)
 }finally{raw.close()}
})
