import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {createServer} from 'node:http'
import {PreflightStorage} from '../server/preflight-storage'
import {OriginalTrainAuthority,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import {createOriginalActionInterpreter} from '../server/original-action-interpreter'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalSessionHttp} from '../src/original-session-http'
import {originalJson} from '../server/original-http'
import {createHandler,CarriageJourneyAuthority} from '../worker/source'
import {LabError} from '../src/journey-runtime'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-preparation-owner',lock=async<T>(_n:string,w:()=>Promise<T>)=>w()
class Memory implements Storage{values=new Map<string,string>();get length(){return this.values.size}key(i:number){return [...this.values.keys()][i]??null}getItem(k:string){return this.values.get(k)??null}setItem(k:string,v:string){this.values.set(k,v)}removeItem(k:string){this.values.delete(k)}clear(){this.values.clear()}}
function intent(h:OriginalHead,id:string){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!;return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,type:'action',action:id,target:e.id,position:e.approach}}
function route(h:OriginalHead){return {...intent(h,'commit-valley-route'),action:undefined,type:'free-input',mode:'live',text:'现在把列车开上河谷支线。'}}
function fixture(gate:OriginalPresentationGate=()=>true,pause?:()=>Promise<void>){
 const dir=mkdtempSync(join(tmpdir(),'original-prepared-')),pool=new PreflightStorage(dir);let calls=0
 const interpreter=createOriginalActionInterpreter(async s=>{calls++;if(s.startsWith('Interpret'))await pause?.();return s.startsWith('Interpret')?{kind:'action',actionId:'commit-valley-route'}:{valid:true,issues:[]}})
 const make=()=>{const c=pool.context(owner);return new OriginalTrainAuthority({all:<T>(q:string,...b:any[])=>c.storage.sql.exec(q,...b).toArray() as T[],run:(q,...b)=>{c.storage.sql.exec(q,...b)},transaction:w=>c.storage.transactionSync(w)},gate,undefined,undefined,interpreter)}
 let service=make()
 return {get service(){return service},calls:()=>calls,reopen:()=>{pool.close();service=make();return service},close:()=>{pool.close();rmSync(dir,{recursive:true,force:true})}}
}
test('prepared original action survives restart without spending resources or repeating interpretation',async()=>{
 const f=fixture();try{
  let h=f.service.create(owner,randomUUID(),'zh');h=(await f.service.action(owner,h.id,intent(h,'repair-starter'))).head
  const body=route(h),[a,b]=await Promise.all([f.service.prepareAction(owner,h.id,body),f.service.prepareAction(owner,h.id,body)])
  assert.deepEqual(a,b);assert.equal(f.calls(),2);assert.equal(a.status,'prepared');assert.equal(a.result.head.sceneId,'train-at-river-valley')
  assert.deepEqual(f.service.get(owner,h.id),h);assert.equal(f.service.events(owner,h.id,0).length,1)
  f.reopen();assert.deepEqual(await f.service.prepareAction(owner,h.id,body),a);assert.equal(f.calls(),2)
  await assert.rejects(f.service.commitPreparedAction(owner,h.id,{...body,text:'changed request'}),/ACTION_ID_CONFLICT/)
  const r=await f.service.commitPreparedAction(owner,h.id,body);assert.equal(r.head.version,h.version+1);assert.equal(r.head.save.stats.fuel,h.save.stats.fuel-6)
  assert.deepEqual(await f.reopen().commitPreparedAction(owner,h.id,body),r);assert.equal((await f.service.prepareAction(owner,h.id,body)).status,'committed');assert.equal(f.calls(),2)
 }finally{f.close()}
})
test('stale or no-longer-admitted prepared actions cannot commit',async()=>{
 let allowed=true;const f=fixture(()=>{if(!allowed)throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409);return true})
 try{let h=f.service.create(owner,randomUUID(),'zh');h=(await f.service.action(owner,h.id,intent(h,'repair-starter'))).head;const body=route(h)
  await f.service.prepareAction(owner,h.id,body);allowed=false
  await assert.rejects(f.service.commitPreparedAction(owner,h.id,body),/ORIGINAL_PRESENTATION_NOT_READY/);assert.deepEqual(f.service.get(owner,h.id),h)
  allowed=true;const latest=(await f.service.action(owner,h.id,intent(h,'inspect-brakes'))).head
  await assert.rejects(f.service.commitPreparedAction(owner,h.id,body),/ACTION_NOT_PREPARED|VERSION_CONFLICT/);assert.deepEqual(f.service.get(owner,h.id),latest);assert.equal(f.calls(),2)
  await assert.rejects(f.service.prepareAction(owner,h.id,body),/VERSION_CONFLICT/);assert.equal(f.calls(),2)
 }finally{f.close()}
})
async function httpFixture(){
 const dir=mkdtempSync(join(tmpdir(),'original-prepared-http-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>(),storage=new Memory()
 let calls=0,lose='',plans=0,commits=0
 const interpreter=createOriginalActionInterpreter(async s=>{calls++;return s.startsWith('Interpret')?{kind:'action',actionId:'commit-valley-route'}:{valid:true,issues:[]}})
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(req:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key),undefined,undefined,undefined,()=>true,interpreter);objects.set(key,o)}return o.fetch(req)}})}}
 const handler=createHandler(true,false,true,()=>false,()=>true)
 const server=createServer(async(req,res)=>{try{
  const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const path=req.url??'/',suffix=path.split('/').at(-1)!;if(suffix==='prepare-action')plans++;if(suffix==='commit-action')commits++
  const response=await handler(new Request('http://localhost'+path,{method:req.method,headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env)
  if(lose===suffix&&response.ok){lose='';res.destroy();return}
  res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))
 }catch{res.writeHead(500);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 const base='http://127.0.0.1:'+(server.address() as any).port
 const make=(ready:(plan:any)=>Promise<void>,fetcher:typeof fetch=fetch)=>originalSessionHttp(storage,lock,fetcher,base,ready)
 return {make,storage,calls:()=>calls,counts:()=>({plans,commits}),lose:(s:string)=>{lose=s},reopen:()=>{objects.clear();pool.close()},close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}}
}
test('HTTP recovery reuses one prepared intent across lost plan, asset failure, restart and lost commit',async()=>{
 const f=await httpFixture();let readyCalls=0,assetsReady=false
 const ready=async(plan:any)=>{readyCalls++;assert.equal(plan.destinationScene,'train-at-river-valley');assert.equal(plan.resolvedActionId,'commit-valley-route');if(!assetsReady)throw Error('SCENE_NOT_READY:river')}
 try{let c=f.make(ready),h=await c.client.enroll('zh');h=(await c.client.send(h,intent(h,'repair-starter'))).head
  f.lose('prepare-action');await assert.rejects(c.client.sendPrepared(h,route(h)));assert.equal(c.client.hasPending(),true);assert.equal(f.calls(),2);assert.equal(readyCalls,0);assert.deepEqual(await c.api('/sessions/'+h.id),h)
  const original=c.client.pending()[0];f.reopen();c=f.make(ready)
  await assert.rejects(c.client.recover(),/SCENE_NOT_READY/);assert.equal(f.calls(),2);assert.equal(f.counts().commits,0);assert.deepEqual(c.client.pending()[0],original);assert.deepEqual(await c.api('/sessions/'+h.id),h)
  assetsReady=true;f.lose('commit-action');await assert.rejects(c.client.recover());assert.equal(c.client.hasPending(),true);assert.equal(f.calls(),2)
  const committed=await c.api('/sessions/'+h.id);assert.equal(committed.version,h.version+1);assert.equal(committed.save.stats.fuel,h.save.stats.fuel-6)
  f.reopen();c=f.make(async()=>{throw Error('COMMITTED_PLAN_MUST_NOT_RELOAD_OLD_ASSETS')});const r=await c.client.recover()
  assert.deepEqual(r.head,committed);assert.equal(c.client.hasPending(),false);assert.equal(f.calls(),2)
  const events=await c.api('/sessions/'+h.id+'/events?after=0');assert.equal(events.events.length,2)
 }finally{await f.close()}
})
test('bad preparation metadata cannot load a different map or commit',async()=>{
 const f=await httpFixture();let loads=0
 try{const corrupt:typeof fetch=async(input,init)=>{const r=await fetch(input,init);if(String(input).endsWith('/prepare-action')&&r.ok){const plan=await r.json() as any;return originalJson({...plan,destinationScene:'train-at-pine-line'})}return r}
  const c=f.make(async()=>{loads++},corrupt);let h=await c.client.enroll('zh');h=(await c.client.send(h,intent(h,'repair-starter'))).head
  await assert.rejects(c.client.sendPrepared(h,route(h)),/PREPARATION_RESPONSE_MISMATCH/);assert.equal(loads,0);assert.equal(f.counts().commits,0);assert.equal(c.client.hasPending(),true);assert.deepEqual(await c.api('/sessions/'+h.id),h)
  const good=f.make(async()=>{loads++});await good.client.recover();assert.equal(loads,1);assert.equal(f.calls(),2)
 }finally{await f.close()}
})

test('a concurrent committed action invalidates an interpretation still awaiting its provider',async()=>{
 let start!:()=>void,finish!:()=>void
 const started=new Promise<void>(r=>{start=r}),waiting=new Promise<void>(r=>{finish=r})
 const f=fixture(()=>true,async()=>{start();await waiting})
 try{let h=f.service.create(owner,randomUUID(),'zh');h=(await f.service.action(owner,h.id,intent(h,'repair-starter'))).head
  const body=route(h),pending=f.service.prepareAction(owner,h.id,body);await started
  const newer=(await f.service.action(owner,h.id,intent(h,'inspect-brakes'))).head
  finish();await assert.rejects(pending,/VERSION_CONFLICT/);assert.deepEqual(f.service.get(owner,h.id),newer)
  await assert.rejects(f.service.commitPreparedAction(owner,h.id,body),/ACTION_NOT_PREPARED/)
 }finally{finish();f.close()}
})
