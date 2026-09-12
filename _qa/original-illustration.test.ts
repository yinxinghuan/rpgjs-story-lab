import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {mkdtempSync,rmSync,readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {OriginalTrainAuthority,originalTrainRuntime,type OriginalHead} from '../server/original-train-runtime'
import {originalReleasedPresentation} from '../server/original-presentation'
import {OriginalIllustrations,originalIllustrationPlan,originalIllustrationProducer} from '../server/original-illustration'
import {originalBackgroundReleases} from '../src/original-asset-releases'
import {originalBackgroundSourcePaths} from '../src/original-background-sources'
import {MediaServiceError} from '../src/vendor/media/client'
import {originalGameEntities} from '../src/original-game-projection'
import {handleOriginalSession} from '../server/original-http'
import {ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from '../src/original-runtime-contract'
import type {AuthorityStorage} from '../server/session-authority'
import {CarriageJourneyAuthority,handleApi} from '../worker/source'
import {PreflightStorage} from '../server/preflight-storage'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
import {newCapability} from '../src/cloud-session'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const fixture=new Uint8Array(PNG.sync.write({width:768,height:1024,data:Buffer.alloc(768*1024*4,80)}))
const owner='a'.repeat(64)
function setup(path=':memory:',now:()=>number=Date.now){const raw=new DatabaseSync(path),db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const result=work();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}},authority=new OriginalTrainAuthority(db,originalReleasedPresentation);return {raw,db,authority,images:new OriginalIllustrations(db,(o,id)=>authority.get(o,id),now)}}
const body=(h:OriginalHead,retry=false)=>({scene:h.sceneId,expected_version:h.version,retry})
test('plans use exact packaged repository sources, not generated dist URLs or private story text',()=>{
 for(const [id,path]of Object.entries(originalBackgroundSourcePaths))assert.equal(createHash('sha256').update(readFileSync(path)).digest('hex'),originalBackgroundReleases[id].sha256)
 const h=originalTrainRuntime(()=>true).initial('zh',crypto.randomUUID()),plan=originalIllustrationPlan(h)
 assert.equal(plan.referenceVersion,Object.entries(originalBackgroundReleases).find(([,r])=>r.sha256===plan.referenceSha256)![0]);assert.match(plan.request.referenceUrls![0],/\/doc\/platform-art-candidates\//)
 assert.equal(plan.request.referenceUrls!.length,1);assert.doesNotMatch(JSON.stringify(plan),/阿达|Ada|blocks|characters|stats|dialogue/)
 assert.throws(()=>originalIllustrationPlan({...h,sceneId:'unmade-dining-car'}),/BACKGROUND_UNAVAILABLE/)
})
test('task records and immutable PNG survive restart, lost responses and source-scene departure without touching story',async()=>{
 const dir=mkdtempSync('/private/tmp/original-illustration-'),path=join(dir,'test.sqlite');let s=setup(path)
 try{
  const h=s.authority.create(owner,crypto.randomUUID(),'zh'),first=s.images.start(owner,h.id,body(h));let finish!:(bytes:Uint8Array)=>void,calls=0
  const pending=s.images.run(owner,h.id,h.sceneId,async(_j,onTask)=>{calls++;onTask('synthetic-task');return new Promise(r=>finish=r)})
  await s.images.run(owner,h.id,h.sceneId,async()=>{calls++;return fixture});assert.equal(calls,1)
  let moved=h
  for(const id of ['repair-starter','commit-valley-route']){const e=originalGameEntities(moved).find(e=>e.actions.some(a=>a.id===id))!;moved=(await s.authority.action(owner,h.id,{action_id:crypto.randomUUID(),expected_version:moved.version,sceneId:moved.sceneId,target:e.id,position:e.approach,type:'action',action:id})).head}
  const before=JSON.stringify(s.authority.get(owner,h.id)),events=JSON.stringify(s.authority.events(owner,h.id,0))
  assert.equal(s.images.start(owner,h.id,body(h)).id,first.id);finish(fixture);await pending
  assert.equal(JSON.stringify(s.authority.get(owner,h.id)),before);assert.equal(JSON.stringify(s.authority.events(owner,h.id,0)),events)
  s.raw.close();s=setup(path);assert.equal(s.images.list(owner,h.id)[0].state,'active');assert.equal(s.images.list(owner,h.id)[0].scene,h.sceneId);assert.deepEqual(await s.images.file(owner,h.id,h.sceneId),fixture)
  assert.equal(s.images.start(owner,h.id,body(h)).id,first.id);assert.throws(()=>s.images.list('b'.repeat(64),h.id),/SESSION_NOT_FOUND/);await assert.rejects(s.images.file('b'.repeat(64),h.id,h.sceneId),/SESSION_NOT_FOUND/)
  assert.doesNotMatch(JSON.stringify(s.images.list(owner,h.id)),/requestId|taskId|referenceUrls|synthetic-task|lease/)
 }finally{s.raw.close();rmSync(dir,{recursive:true,force:true})}
})
test('lease expiry fences late results; persisted task resumes without creating a new media intention',async()=>{
 let time=1000;const s=setup(':memory:',()=>time)
 try{const h=s.authority.create(owner,crypto.randomUUID(),'en');s.images.start(owner,h.id,body(h));let finish!:(bytes:Uint8Array)=>void,requestId=''
 const old=s.images.run(owner,h.id,h.sceneId,async(j,onTask)=>{requestId=j.requestId;onTask('stable-task');return new Promise(r=>finish=r)})
 time+=120001
 await s.images.run(owner,h.id,h.sceneId,async(j)=>{assert.equal(j.requestId,requestId);assert.equal(j.taskId,'stable-task');return fixture})
 finish(new Uint8Array([1,2,3]));await old;assert.equal(s.images.list(owner,h.id)[0].state,'active');assert.deepEqual(await s.images.file(owner,h.id,h.sceneId),fixture)
 }finally{s.raw.close()}
})
test('terminal retry budget, rate-limit cooldown and per-owner daily quota survive service recreation',async()=>{
 let time=1000;const s=setup(':memory:',()=>time)
 try{const h=s.authority.create(owner,crypto.randomUUID(),'zh');s.images.start(owner,h.id,body(h));let calls=0
 await s.images.run(owner,h.id,h.sceneId,async()=>{calls++;throw new MediaServiceError('RATE_LIMITED','limit',429,true,60)})
 await s.images.run(owner,h.id,h.sceneId,async()=>{calls++;return fixture});assert.equal(calls,1);time+=60000
 const ids:string[]=[];const fail=async(j:any)=>{ids.push(j.requestId);throw new MediaServiceError('PROVIDER_REJECTED','terminal',400,false)}
 await s.images.run(owner,h.id,h.sceneId,fail);assert.throws(()=>s.images.start(owner,h.id,body(h,true)),/RETRY_LATER/);time+=8001
 s.images.start(owner,h.id,body(h,true));await s.images.run(owner,h.id,h.sceneId,fail);assert.notEqual(ids[0],ids[1]);time+=8001
 assert.throws(()=>s.images.start(owner,h.id,body(h,true)),/ATTEMPT_LIMIT/)
 for(let n=0;n<16;n++){const another=s.authority.create(owner,crypto.randomUUID(),'zh');s.images.start(owner,another.id,body(another))}
 const recreated=new OriginalIllustrations(s.db,(o,id)=>s.authority.get(o,id),()=>time),extra=s.authority.create(owner,crypto.randomUUID(),'zh')
 assert.throws(()=>recreated.start(owner,extra.id,body(extra)),/DAILY_LIMIT/);time+=86400000;recreated.start(owner,extra.id,body(extra))
 }finally{s.raw.close()}
})
test('current scene/version required for new intentions, HTTP gate closed by default, injected path preserves headers',async()=>{
 const s=setup();try{const h=s.authority.create(owner,crypto.randomUUID(),'en');assert.throws(()=>s.images.start(owner,h.id,{...body(h),expected_version:20}),/SCENE_CHANGED/);assert.throws(()=>s.images.start(owner,h.id,{...body(h),prompt:'untrusted'}),/INVALID_ILLUSTRATION_REQUEST/)
 const url='https://authority.invalid/api/original/sessions/'+h.id+'/illustrations',headers={[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT},read=(r:Request)=>r.json()
 assert.equal((await handleOriginalSession(new Request(url,{headers}),owner,s.authority,read)).status,404)
 const response=await handleOriginalSession(new Request(url,{headers,method:'POST',body:JSON.stringify(body(h))}),owner,s.authority,read,undefined,undefined,undefined,undefined,{store:s.images,produce:async()=>fixture})
 assert.equal(response.status,200);assert.equal((await response.json()).illustrations[0].state,'active')
 const file=await handleOriginalSession(new Request(url+'/'+h.sceneId+'/file',{headers}),owner,s.authority,read,undefined,undefined,undefined,undefined,{store:s.images,produce:async()=>{throw Error('NO_SECOND_CALL')}})
 assert.equal(file.headers.get(ORIGINAL_RUNTIME_HEADER),ORIGINAL_RUNTIME_CONTRACT);assert.deepEqual(new Uint8Array(await file.arrayBuffer()),fixture)
 }finally{s.raw.close()}
})
test('platform producer rejects foreign task identity and preserves original task after a download failure',async()=>{
 const s=setup();try{const h=s.authority.create(owner,crypto.randomUUID(),'en');s.images.start(owner,h.id,body(h));let submissions=0,downloads=0,lastRequest=''
 const producer=originalIllustrationProducer(async(input,init)=>{const u=String(input);if(u.includes('/v1/')){if(u.endsWith('generations')){submissions++;lastRequest=JSON.parse(String(init!.body)).request_id}return Response.json({request_id:lastRequest,task_id:'retained-task',status:'succeeded',type:'image',media:{type:'image',url:'https://cdn.aiwaves.tech/synthetic.png',format:'png',width:768,height:1024}})}downloads++;return downloads===1?new Response('',{status:503}):new Response(fixture)})
 await s.images.run(owner,h.id,h.sceneId,producer);assert.equal(s.images.list(owner,h.id)[0].state,'failed')
 s.db.run('UPDATE original_illustrations SET data=json_set(data,\'$.nextAt\',0)')
 await s.images.run(owner,h.id,h.sceneId,producer);assert.equal(submissions,1);assert.equal(downloads,2);assert.equal(s.images.list(owner,h.id)[0].state,'active')
 const j={...s.images.list(owner,h.id)[0],plan:originalIllustrationPlan(h),requestId:crypto.randomUUID(),taskId:'expected',leaseUntil:0} as any
 await assert.rejects(originalIllustrationProducer(async()=>Response.json({request_id:'wrong',task_id:'foreign',status:'succeeded'}))(j,()=>{}),/TASK_MISMATCH/)
 }finally{s.raw.close()}
})
test('real media PNG round-trips through the Worker route; default gate and capability isolation remain',async()=>{
 const bytes=new Uint8Array(readFileSync('doc/platform-art-candidates/20260912/original-journal-01/candidate.png'))
 const decoded=PNG.sync.read(Buffer.from(bytes));assert.equal(decoded.width,768);assert.equal(decoded.height,1024)
 assert.equal(createHash('sha256').update(bytes).digest('hex'),'ef122477079498a7215a0b83afe761d975b8e704e97f3d52a06f9437f7f1b8f5')
 const storage=new PreflightStorage(),objects=new Map<string,CarriageJourneyAuthority>();let enabled=false,calls=0
 const env={CARRIAGE_JOURNEYS:{idFromName:(v:string)=>v,get:(key:unknown)=>({fetch:(r:Request)=>{const id=String(key);let object=objects.get(id);if(!object){object=new CarriageJourneyAuthority(storage.context(id),undefined,undefined,undefined,undefined,undefined,undefined,undefined,enabled?async()=>{calls++;return bytes}:undefined);objects.set(id,object)}return object.fetch(r)}})}}
 const headers={Authorization:'Bearer '+newCapability(),[RUNTIME_HEADER]:RUNTIME_CONTRACT,[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT}
 const call=(path:string,data?:unknown,auth=headers)=>handleApi(new Request('https://authority.invalid/api/original'+path,{headers:auth,method:data===undefined?'GET':'POST',body:data===undefined?undefined:JSON.stringify(data)}),env)
 try{
  const h=await(await call('/sessions',{enrollment_id:crypto.randomUUID(),locale:'zh'})).json() as OriginalHead
  assert.equal((await call('/sessions/'+h.id+'/illustrations')).status,404)
  enabled=true;objects.clear()
  const path='/sessions/'+h.id+'/illustrations',r=await call(path,body(h));assert.equal(r.status,200);assert.equal((await r.json()).illustrations[0].state,'active')
  const file=await call(path+'/'+h.sceneId+'/file');assert.deepEqual(new Uint8Array(await file.arrayBuffer()),bytes)
  await call(path,body(h));assert.equal(calls,1);assert.deepEqual(await(await call('/sessions/'+h.id)).json(),h)
  assert.equal((await call(path,undefined,{...headers,Authorization:'Bearer '+newCapability()})).status,404)
  assert.equal((await call(path,undefined,{...headers,Authorization:''})).status,401)
 }finally{storage.close()}
})
