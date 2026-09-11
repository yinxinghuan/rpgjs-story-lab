import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {PreflightStorage} from '../server/preflight-storage'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import {createOriginalActionInterpreter,type OriginalActionInterpreter} from '../server/original-action-interpreter'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalActionDestinations} from '../src/original-game-projection'
import {resolveDomainAction} from '../src/vendor/original-train/engine/domainRules'
import {LabError} from '../src/journey-runtime'
const world=originalTrainChapterSpatialPlan()
function setup(interpreter?:OriginalActionInterpreter,gate:OriginalPresentationGate=()=>true){
 const pool=new PreflightStorage(),ctx=pool.context('synthetic-original-interpretation')
 const db={all:<T>(sql:string,...v:any[])=>ctx.storage.sql.exec(sql,...v).toArray() as T[],run:(sql:string,...v:any[])=>{ctx.storage.sql.exec(sql,...v)},transaction:<T>(work:()=>T)=>ctx.storage.transactionSync(work)}
 const make=()=>new OriginalTrainAuthority(db,gate,undefined,undefined,interpreter)
 return {pool,make,service:make()}
}
function input(h:OriginalHead,text:string,mode='live',id='repair-starter'){
 const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!
 return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,type:'free-input',text,mode}
}
function button(h:OriginalHead,id='repair-starter'){
 const {text,...b}=input(h,'','local',id);return {...b,type:'action',action:id}
}
test('questions, refusals, future, past and compound input never become a local source action',async()=>{
 const t=setup()
 try{for(const locale of ['zh','en'] as const){
  const h=t.service.create('owner',randomUUID(),locale)
  if(locale==='zh')assert.equal(resolveDomainAction(h.save,originalCartridge(locale),'不要检修启动机')?.status,'accepted','regression: frozen fuzzy matcher would execute the refusal')
  for(const text of locale==='zh'?['不要检修启动机','别检修启动机','能否检修启动机？','我已经检修启动机','明天检修启动机','检修启动机然后去搜油']:['Do not repair the starter','Can I repair the starter?','I already repaired the starter','Repair the starter later','Repair the starter and search for fuel']){
   await assert.rejects(t.service.action('owner',h.id,input(h,text,'local')),/ORIGINAL_ACTION_REQUIRES_COMMITMENT/)
   assert.deepEqual(t.service.get('owner',h.id),h);assert.equal(t.service.events('owner',h.id,0).length,0)
  }
  const next=(await t.service.action('owner',h.id,button(h))).head
  const b=input(next,'不要选择河谷线路','local','commit-valley-route')
  assert.deepEqual(originalActionDestinations(next,b.target,{text:b.text}),[])
 }}finally{t.pool.close()}
})
test('semantic paraphrase uses author consequences, preserves the input receipt and rejects cross-target IDs',async()=>{
 let calls=0
 const t=setup(createOriginalActionInterpreter(async(_system,user)=>{
  calls++;const data=JSON.parse(user);assert.ok(data.context.actions.every((a:any)=>world.entities.find(e=>e.id===data.context.target)!.actions.includes(a.id)))
  return calls%2?{kind:'action',actionId:'repair-starter'}:{valid:true,issues:[]}
 }))
 try{
  const h=t.service.create('owner',randomUUID(),'zh'),b=input(h,'我来把这台坏掉的机器修好')
  const result=await t.service.action('owner',h.id,b);assert.equal(result.accepted,true);assert.equal(result.head.save.stats.condition,87);assert.equal(result.head.save.stats.fuel,68)
  assert.deepEqual(result.interpretation,{input:b.text,actionId:'repair-starter'});assert.equal(calls,2)
  assert.deepEqual(await t.make().action('owner',h.id,b),result);assert.equal(calls,2)
  const other=t.service.create('owner',randomUUID(),'zh')
  await assert.rejects(t.service.action('owner',other.id,input(other,'我来解决眼前的问题','live','salvage-fuel-shed')),/ORIGINAL_INTENT_UNSUPPORTED/)
  assert.deepEqual(t.service.get('owner',other.id),other)
 }finally{t.pool.close()}
})
test('malformed decisions, invented effects and a failed semantic review do not write',async()=>{
 for(const answer of [{kind:'action',actionId:'teleport-to-dining-car'},{kind:'action',actionId:'repair-starter',effects:{fuel:100}},{kind:'unsupported'},['repair-starter'],'repair-starter',null]){
  let calls=0;const t=setup(createOriginalActionInterpreter(async()=>{calls++;return answer}))
  try{const h=t.service.create('owner',randomUUID(),'en');await assert.rejects(t.service.action('owner',h.id,input(h,'I fix this broken machine')),/ORIGINAL_INTENT_UNSUPPORTED/);assert.equal(calls,1);assert.deepEqual(t.service.get('owner',h.id),h)}finally{t.pool.close()}
 }
 const t=setup(createOriginalActionInterpreter(async(system)=>system.startsWith('Interpret')?{kind:'action',actionId:'repair-starter'}:{valid:false,issues:['WRONG_INTENT']}))
 try{const h=t.service.create('owner',randomUUID(),'en');await assert.rejects(t.service.action('owner',h.id,input(h,'I fix this broken machine')),/ORIGINAL_INTENT_UNSUPPORTED/);assert.deepEqual(t.service.get('owner',h.id),h)}finally{t.pool.close()}
})
test('provider deadline and a newer committed action cannot be overwritten by a late result',async()=>{
 let release!:(value:unknown)=>void,signal:AbortSignal|undefined
 const t=setup(createOriginalActionInterpreter(async(_s,_u,options)=>{signal=options?.signal;return new Promise(r=>{release=r})},15))
 try{const h=t.service.create('owner',randomUUID(),'en');await assert.rejects(t.service.action('owner',h.id,input(h,'I fix this broken machine')),/ORIGINAL_INTERPRETER_TIMEOUT/);assert.equal(signal?.aborted,true);release({kind:'action',actionId:'repair-starter'});await new Promise(r=>setImmediate(r));assert.deepEqual(t.service.get('owner',h.id),h)}finally{t.pool.close()}
 let ready!:()=>void,finish!:(id:string)=>void
 const started=new Promise<void>(r=>{ready=r}),r=setup(async()=>{ready();return new Promise<string>(resolve=>{finish=resolve})})
 try{const h=r.service.create('owner',randomUUID(),'en'),pending=r.service.action('owner',h.id,input(h,'I fix this broken machine'));await started
  const committed=await r.make().action('owner',h.id,button(h));finish('repair-starter');await assert.rejects(pending,/VERSION_CONFLICT/);assert.deepEqual(r.service.get('owner',h.id),committed.head);assert.equal(r.service.events('owner',h.id,0).length,1)
 }finally{r.pool.close()}
})
test('no configured interpreter stays closed; current-state and next-state presentation remain mandatory',async()=>{
 const disabled=setup()
 try{const h=disabled.service.create('owner',randomUUID(),'zh');await assert.rejects(disabled.service.action('owner',h.id,input(h,'我来修好它')),/ORIGINAL_NARRATION_NOT_READY/);assert.deepEqual(disabled.service.get('owner',h.id),h)}finally{disabled.pool.close()}
 let calls=0
 const t=setup(async()=>{calls++;return 'repair-starter'},h=>{if(h.version!==0)throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409);return true})
 try{const h=t.service.create('owner',randomUUID(),'zh');await assert.rejects(t.service.action('owner',h.id,input(h,'我来修好它')),/ORIGINAL_PRESENTATION_NOT_READY/);assert.equal(calls,1);assert.deepEqual(t.service.get('owner',h.id),h)}finally{t.pool.close()}
})
