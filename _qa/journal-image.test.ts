import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {DatabaseSync} from 'node:sqlite'
import {initialStory} from '../src/story'
import {MAP_VERSION,localReply} from '../src/contract'
import {startJournalImage,runJournalImage,publicImageJob,createJournalImageProducer,inspectJournalPng,type ImageJobStore} from '../server/journal-image'
import {MediaServiceError} from '../src/vendor/media/client'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {restoreJourneyToEmptyDatabase} from '../server/journey-backup'
import type {Head,Narrator} from '../src/journey-runtime'
import {createHandler,CarriageJourneyAuthority} from '../worker/source'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
import {journalImageAvailable} from '../src/journal-image-release'
import {journalImageError} from '../src/journal-image-errors'
const asset={url:'https://cdn.aiwaves.tech/synthetic.png',sha256:'a'.repeat(64),bytes:200,width:768,height:1024} as const
function memory(){
 let head:Head={id:randomUUID(),version:0,mapVersion:MAP_VERSION,save:initialStory('zh'),position:{x:186,y:500}}
 const store:ImageJobStore={get:()=>structuredClone(head),update:fn=>{const next=structuredClone(head);fn(next);head=next}}
 return {store,complete:()=>store.update(h=>{h.save.facts.journey_complete=true})}
}
const narrator:Narrator=async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'local'}})
function database(narrate=narrator){
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(q,...p)=>raw.prepare(q).all(...p) as any,run:(q,...p)=>{raw.prepare(q).run(...p)},transaction:work=>{raw.exec('BEGIN');try{const value=work();raw.exec('COMMIT');return value}catch(e){raw.exec('ROLLBACK');throw e}}}
 const service=new ProductionAuthority(db,narrate)
 return {raw,db,service}
}
test('only complete journey can request image; duplicate starts preserve seed and request',()=>{
 const {store,complete}=memory();assert.throws(()=>startJournalImage(store),/NOT_ELIGIBLE/);complete()
 const first=startJournalImage(store);assert.deepEqual(startJournalImage(store),first)
 assert.equal(publicImageJob(first)?.asset,undefined);assert.equal('requestId' in publicImageJob(first)!,false)
})
test('timeout retains same request and task; restart waits for persisted lease, late result fenced',async()=>{
 const {store,complete}=memory();complete();let time=1000,release!:()=>void,calls=0
 startJournalImage(store,false,time)
 const first=runJournalImage(store,async(_j,onTask)=>{calls++;onTask('service-task');await new Promise<void>(r=>release=r);return asset},()=>time)
 await runJournalImage(store,async()=>{calls++;return asset},()=>time);assert.equal(calls,1)
 const id=store.get().journalImage!.requestId
 time+=120001
 await runJournalImage(store,async j=>{assert.equal(j.requestId,id);assert.equal(j.taskId,'service-task');return {...asset,sha256:'b'.repeat(64)}},()=>time)
 release();await first
 assert.equal(store.get().journalImage!.asset!.sha256,'b'.repeat(64))
})
test('unknown transport failure resumes identical request; terminal failure permits only one new attempt',async()=>{
 const {store,complete}=memory();complete();let time=1
 const original=startJournalImage(store,false,time).requestId
 await runJournalImage(store,async()=>{throw Error('private details')},()=>time)
 assert.equal(store.get().journalImage!.error,'IMAGE_UNAVAILABLE')
 assert.equal(store.get().journalImage!.recoverable,true)
 assert.equal(startJournalImage(store,true,time).requestId,original)
 time+=9000;await runJournalImage(store,async j=>{assert.equal(j.requestId,original);throw new MediaServiceError('PROVIDER_REJECTED','rejected',400,false)},()=>time)
 assert.throws(()=>startJournalImage(store,true,time),/RETRY_LATER/)
 time+=9000;const second=startJournalImage(store,true,time);assert.notEqual(second.requestId,original);assert.equal(second.attempt,2)
 await runJournalImage(store,async()=>{throw new MediaServiceError('PROVIDER_REJECTED','rejected',400,false)},()=>time)
 time+=9000;assert.throws(()=>startJournalImage(store,true,time),/ATTEMPT_LIMIT/)
})
test('invalid generated descriptor cannot activate content or change narrative',async()=>{
 const {store,complete}=memory();complete();startJournalImage(store)
 const before=store.get()
 await runJournalImage(store,async()=>({...asset,url:'https://127.0.0.1/private'}))
 const after=store.get();assert.equal(after.journalImage!.state,'failed');assert.equal(after.journalImage!.recoverable,false);assert.equal(after.journalImage!.asset,undefined)
 assert.deepEqual(after.save,before.save);assert.equal(after.version,before.version)
})
test('rate limit honors service delay and never starts a second request early',async()=>{
 const {store,complete}=memory();complete();let time=0,calls=0
 startJournalImage(store,false,time)
 await runJournalImage(store,async()=>{calls++;throw new MediaServiceError('RATE_LIMITED','later',429,true,60)},()=>time)
 time=59000;await runJournalImage(store,async()=>{calls++;return asset},()=>time);assert.equal(calls,1)
 time=60000;await runJournalImage(store,async()=>{calls++;return asset},()=>time);assert.equal(calls,2);assert.equal(store.get().journalImage!.state,'active')
})
test('PNG metadata admission rejects truncated, wrong-size and non-PNG responses',async()=>{
 const bytes=new Uint8Array(50),v=new DataView(bytes.buffer);bytes.set([137,80,78,71,13,10,26,10]);v.setUint32(8,13);bytes.set([73,72,68,82],12);v.setUint32(16,768);v.setUint32(20,1024)
 await assert.rejects(inspectJournalPng(bytes),/IMAGE_INVALID/)
 await assert.rejects(inspectJournalPng(new TextEncoder().encode('<html>error</html>')),/IMAGE_INVALID/)
})
test('producer resumes known service task without posting a new generation',async()=>{
 const {store,complete}=memory();complete();const j=startJournalImage(store);j.taskId='stable-task'
 const urls:string[]=[]
 const produce=createJournalImageProducer(async(input)=>{urls.push(String(input));return Response.json({task_id:'stable-task',request_id:j.requestId,status:'failed',error:{code:'PROVIDER_REJECTED',retryable:false}})})
 await assert.rejects(produce(j,()=>{}),/Media generation failed/)
 assert.equal(urls.length,1);assert.ok(urls[0].endsWith('/v1/tasks/stable-task'))
})
test('resubmission uses the entire persisted request rather than current generation defaults',async()=>{
 const {store,complete}=memory();complete();const j=startJournalImage(store)
 j.plan.request.prompt='Frozen earlier approved environment prompt'
 j.plan.request.referenceUrls=['https://example.com/frozen-approved-reference.png']
 let posted:any
 const produce=createJournalImageProducer(async(_input,init)=>{posted=JSON.parse(String(init?.body));return Response.json({error:{code:'PROVIDER_REJECTED',retryable:false}},{status:400})})
 await assert.rejects(produce(j,()=>{}))
 assert.equal(posted.prompt,j.plan.request.prompt);assert.deepEqual(posted.reference_urls,j.plan.request.referenceUrls)
 assert.equal(posted.session_id,j.plan.request.sessionId);assert.equal(posted.request_id,j.requestId);assert.deepEqual(posted.size,j.plan.request.size)
 assert.equal('plan' in publicImageJob(j)!,false)
})
test('late narrative commit preserves completed image and owner isolation; backup restores attachment',async()=>{
 let release!:()=>void,entered!:()=>void
 const gate=new Promise<void>(r=>release=r),ready=new Promise<void>(r=>entered=r)
 const source=database(async(...args)=>{entered();await gate;return narrator(...args)}),target=database(),owner='a'.repeat(64)
 try{
  const h=source.service.create(owner,randomUUID(),'zh')
  h.save.facts.journey_complete=true // synthetic completed fixture only
  source.db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
  source.service.startImage(owner,h.id)
  assert.throws(()=>source.service.image('b'.repeat(64),h.id),/SESSION_NOT_FOUND/)
  const turn=source.service.action(owner,h.id,{action_id:randomUUID(),expected_version:0,sceneId:'carriage',target:'cabinet',position:{x:158,y:132},type:'free-input',text:'柜子是什么',mode:'local'})
  await ready;await source.service.runImage(owner,h.id,async()=>asset);release();await turn
  assert.equal(source.service.get(owner,h.id).journalImage!.state,'active')
  const backup=await source.service.backup(owner,h.id);await restoreJourneyToEmptyDatabase(target.db,backup)
  assert.deepEqual(target.service.get(owner,h.id),source.service.get(owner,h.id))
 }finally{source.raw.close();target.raw.close()}
})
test('unverified image feature is unavailable in production UI and HTTP; errors expose no upstream text',async()=>{
 assert.equal(journalImageAvailable('cloud'),false);assert.equal(journalImageAvailable('pages'),false);assert.equal(journalImageAvailable('cloud-preflight'),true)
 const r=await createHandler(true)(new Request('https://game.example/api/lab/sessions/synthetic-session/image',{method:'POST',body:'{}'}),{})
 assert.equal(r.status,404)
 assert.doesNotMatch(journalImageError('secret-token-and-private-url','zh'),/secret|private/)
 assert.match(journalImageError('PROVIDER_REJECTED','en'),/not accept/)
})
test('worker image route validates owner and input; returns immediately while one background task runs',async()=>{
 const raw=new DatabaseSync(':memory:');let release!:()=>void,started=0
 const pending:Promise<unknown>[]=[],owner='a'.repeat(64),other='b'.repeat(64)
 const ctx={
  waitUntil:(p:Promise<unknown>)=>{pending.push(p)},
  storage:{
   sql:{exec:(q:string,...b:any[])=>{const stmt=raw.prepare(q),rows=stmt.columns().length?stmt.all(...b):(stmt.run(...b),[]);return {toArray:()=>rows}}},
   transactionSync:<T>(f:()=>T)=>{raw.exec('BEGIN');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}},
  },
 }
 const object=new CarriageJourneyAuthority(ctx,undefined,undefined,async()=>{started++;await new Promise<void>(r=>release=r);return asset})
 async function call(path:string,body?:unknown,who=owner){return object.fetch(new Request('http://localhost/api/lab'+path,{method:body===undefined?'GET':'POST',headers:{'X-Authority-Owner':who,[RUNTIME_HEADER]:RUNTIME_CONTRACT},body:body===undefined?undefined:JSON.stringify(body)}))}
 try{
  const h=await (await call('/sessions',{enrollment_id:randomUUID()})).json() as Head
  assert.equal((await call('/sessions/'+h.id+'/image',{})).status,409)
  h.save.facts.journey_complete=true // route eligibility fixture; not end-to-end gameplay evidence
  raw.prepare('UPDATE journeys SET data=? WHERE id=?').run(JSON.stringify(h),h.id)
  const path='/sessions/'+h.id+'/image'
  assert.equal((await call(path,{prompt:'caller cannot replace authored prompt'})).status,400)
  assert.equal((await call(path,{},other)).status,404)
  assert.equal((await call(path,{})).status,200);assert.equal(started,1)
  assert.equal((await call(path,{})).status,200);assert.equal(started,1)
  release();await Promise.all(pending)
  const result=await (await call(path)).json() as any
  assert.equal(result.job.state,'active');assert.equal(result.job.attempt,1)
  assert.equal('url' in result.job.asset,false);assert.equal('requestId' in result.job,false)
  assert.equal((await call(path+'/file',undefined,other)).status,404)
 }finally{raw.close()}
})
