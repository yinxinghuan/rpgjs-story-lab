import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {propose} from '../server/model'
import {localReply,actionTarget,currentScene,sceneContract,validateProposal} from '../src/contract'
import {initialStory,type Locale} from '../src/story'
import {approachPoints,scenes} from '../src/scene-layout'
import {activeRelay,readRelay,relayAction,relayLabels,RELAY_KEY,proposeRelay,prepareRelay,relayActions,assertRelayProjection,type RelayPerson} from '../src/relay-content'
import type {Head,Narrator} from '../src/journey-runtime'
const narrator:Narrator=async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'authored'}})
function setup(){const raw=new DatabaseSync(':memory:');const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:f=>{raw.exec('BEGIN');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db}}
const body=(h:Head,id:string,free=false)=>({action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),target:actionTarget[id],position:approachPoints[actionTarget[id]],type:free?'free-input':'action',...(free?{text:relayLabels[id][h.save.locale==='zh'?0:1]}:{action:id})})
for(const locale of ['zh','en'] as Locale[])for(const source of ['lin','zhou-yu'] as RelayPerson[])test(`generated relay ${locale}/${source}: accepted, delivered, finished, replayed and restored`,async()=>{
 const {raw,db}=setup();let service=new ProductionAuthority(db,narrator),h=service.create('relay-owner',randomUUID(),locale)
 async function act(id:string,free=false){const request=body(h,id,free),r=await service.action('relay-owner',h.id,request);h=r.head;assert.deepEqual(await service.action('relay-owner',h.id,request),r);return r}
 try{
  for(const id of ['open-cabinet','take-fuse','meet-lin','repair','leave','meet-attendant'])assert.equal((await act(id)).accepted,true,id)
  if(source==='lin')await act('back-carriage')
  const before=structuredClone(h.save),offer=relayAction('offer',source)
  assert.equal((await act(offer,true)).accepted,true)
  const request=activeRelay(h.save)!;assert.ok(request);assert.deepEqual(request.stages,['proposed','preparing','validated','active']);assert.equal(request.plan.seed,h.id)
  const skipped=structuredClone(h.save);skipped.facts[RELAY_KEY]=JSON.stringify({...request,phase:'completed'});assert.throws(()=>assertRelayProjection(h.save,skipped,relayAction('accept',source)),/UNADMITTED_CONTENT_PHASE/)
  assert.equal(request.phase,'offered');assert.deepEqual(h.save.relationships,before.relationships);assert.deepEqual(h.save.inventory,before.inventory)
  service=new ProductionAuthority(db,narrator);h=service.get('relay-owner',h.id);assert.deepEqual(activeRelay(h.save),request)
  assert.equal((await act(offer)).accepted,false)
  assert.equal((await act(relayAction('accept',source),true)).accepted,true)
  assert.equal((await act(relayAction('accept',source))).accepted,false)
  const recipient=request.plan.recipient
  await assert.rejects(service.action('relay-owner',h.id,body(h,relayAction('deliver',recipient))),/OFF_SCENE_ENTITY/)
  await act(source==='lin'?'go-baggage':'back-carriage')
  const deliveryBody=body(h,relayAction('deliver',recipient)),first=service.action('relay-owner',h.id,deliveryBody),duplicate=service.action('relay-owner',h.id,deliveryBody)
  const results=await Promise.all([first,duplicate]);assert.deepEqual(results[0],results[1]);h=results[0].head
  assert.equal(activeRelay(h.save)?.phase,'delivered');assert.equal(h.save.relationships.filter(r=>r.axis==='message-received').length,1)
  assert.equal((await act(relayAction('deliver',recipient))).accepted,false)
  await act(source==='lin'?'back-carriage':'go-baggage')
  assert.equal((await act(relayAction('finish',source),true)).accepted,true)
  assert.equal(activeRelay(h.save)?.phase,'completed');assert.equal((await act(relayAction('finish',source))).accepted,false)
  assert.equal(h.save.relationships.filter(r=>r.axis==='message-promise-kept').length,1)
  assert.deepEqual(activeRelay(h.save)?.plan,request.plan);assert.equal(h.save.facts.repaired,true);assert.ok(!h.save.facts.rescue_sent)
  assert.deepEqual(h.save.inventory,before.inventory);assert.deepEqual(service.get('relay-owner',h.id),h)
 }finally{raw.close()}
})
test('decline is durable, optional, and cannot farm another offer or relationship',async()=>{
 const {raw,db}=setup(),service=new ProductionAuthority(db,narrator);let h=service.create('decline-owner',randomUUID(),'zh')
 try{for(const id of ['open-cabinet','take-fuse','meet-lin','repair','leave','meet-attendant',relayAction('offer','zhou-yu'),relayAction('decline','zhou-yu')])h=(await service.action('decline-owner',h.id,body(h,id))).head
  assert.equal(activeRelay(h.save)?.phase,'declined');assert.deepEqual(relayActions(h.save,'zhou-yu'),[]);assert.deepEqual(relayActions(h.save,'lin'),[])
  assert.equal(h.save.relationships.filter(r=>r.axis.startsWith('message-')).length,0)
  const result=await service.action('decline-owner',h.id,body(h,'open-supply'));assert.equal(result.accepted,true);assert.equal(activeRelay(result.head.save)?.phase,'declined')
 }finally{raw.close()}
})
test('unintroduced people are not candidate content; invalid assets fail closed and preserve seed on retry',async()=>{
 const {raw,db}=setup(),service=new ProductionAuthority(db,narrator);let h=service.create('preparation-owner',randomUUID(),'zh')
 const resident=scenes.baggage.resident
 try{
  assert.equal(sceneContract(h.save,'lin').contentOptions,null);assert.deepEqual(relayActions(h.save,'lin'),[])
  for(const id of ['open-cabinet','take-fuse','meet-lin','repair','leave','meet-attendant'])h=(await service.action('preparation-owner',h.id,body(h,id))).head
  const blocked={x:144,y:350,w:96,h:20};scenes.baggage.fixtures.push(blocked)
  try{assert.ok(prepareRelay(proposeRelay('zhou-yu',h.id),h.save).issues.includes('RELAY_UNREACHABLE_PERSON'))}finally{scenes.baggage.fixtures.pop()}
  scenes.baggage.resident=undefined
  h=(await service.action('preparation-owner',h.id,body(h,relayAction('offer','zhou-yu')))).head
  const failed=readRelay(h.save)!;assert.equal(failed.state,'failed');assert.ok(failed.issues.includes('RELAY_MISSING_PRESENTATION'));assert.equal(activeRelay(h.save),null);assert.equal(sceneContract(h.save,'zhou-yu').personalRequest,null)
  scenes.baggage.resident=resident
  h=(await service.action('preparation-owner',h.id,body(h,relayAction('offer','zhou-yu')))).head
  assert.deepEqual(activeRelay(h.save)?.plan,failed.plan);assert.equal(activeRelay(h.save)?.phase,'offered')
 }finally{scenes.baggage.resident=resident;raw.close()}
})
test('model selects only admitted template parameters; questions never accept a promise',async()=>{
 const {raw,db}=setup(),service=new ProductionAuthority(db,narrator);let h=service.create('model-template-owner',randomUUID(),'zh')
 try{
  for(const id of ['open-cabinet','take-fuse','meet-lin','repair','leave','meet-attendant'])h=(await service.action('model-template-owner',h.id,body(h,id))).head
  let calls=0
  const generated=await propose('聊聊一路上的牵挂',h.save,'zhou-yu',true,async()=>++calls%2?{kind:'action',actionId:relayAction('offer','zhou-yu'),content:{templateId:'relay-message-v1',theme:'reassurance'}}:{valid:true,issues:[]})
  assert.equal(generated.proposal.content?.theme,'reassurance');assert.equal(generated.trace.fallback,false)
  const model:Narrator=async()=>generated,online=new ProductionAuthority(db,model)
  const r=await online.action('model-template-owner',h.id,{...body(h,relayAction('offer','zhou-yu'),true),mode:'live'});h=r.head
  assert.equal(activeRelay(h.save)?.plan.theme,'reassurance')
  const malicious={kind:'action',actionId:relayAction('accept','zhou-yu'),entityIds:['zhou-yu'],claims:[],text:'',content:{templateId:'new-person',theme:'weapon'}}
  assert.ok(validateProposal(malicious,h.save,'zhou-yu').includes('UNEXPECTED_CONTENT_PROPOSAL'))
  const questionService=new ProductionAuthority(db,async()=>({proposal:{...generated.proposal,content:undefined,actionId:relayAction('accept','zhou-yu')},trace:{}}))
  const question=await questionService.action('model-template-owner',h.id,{...body(h,relayAction('accept','zhou-yu'),true),text:'我可以替你传话吗？'})
  assert.equal(activeRelay(question.head.save)?.phase,'offered');assert.equal(question.accepted,false)
 }finally{raw.close()}
})
test('candidate versions and activation cannot be forged by observation or reseeded after activation',()=>{
 const save=initialStory('en'),plan=proposeRelay('lin','fixed-seed'),record=prepareRelay(plan,save)
 assert.equal(record.state,'failed');assert.deepEqual(record.stages,['proposed','preparing'])
 const after=structuredClone(save);after.facts[RELAY_KEY]=JSON.stringify(record)
 assert.throws(()=>assertRelayProjection(save,after,null),/UNADMITTED_CONTENT_CHANGE/)
 after.facts[RELAY_KEY]=JSON.stringify({...record,state:'active'})
 assert.throws(()=>assertRelayProjection(save,after,relayAction('offer','lin')),/UNVALIDATED_CONTENT_ACTIVATION/)
 assert.deepEqual(proposeRelay('lin','fixed-seed'),plan)
 assert.notEqual(proposeRelay('lin','another-seed').id,plan.id)
})
test('an unfinished promise never blocks the complete main ending and can be finished afterwards',async()=>{
 const {raw,db}=setup(),service=new ProductionAuthority(db,narrator);let h=service.create('ending-owner',randomUUID(),'en')
 const act=async(id:string)=>{const r=await service.action('ending-owner',h.id,body(h,id));assert.equal(r.accepted,true,id);h=r.head}
 try{
  for(const id of ['open-cabinet','take-fuse','meet-lin','repair','leave','meet-attendant',relayAction('offer','zhou-yu'),relayAction('accept','zhou-yu'),'open-supply','take-battery','read-record','enter-cab','install-battery','route-radio','send-signal','begin-reception','back-baggage','check-aisle','read-arrival-code','back-carriage','check-circuit','go-baggage','enter-cab','confirm-arrival','back-baggage','back-carriage','complete-handover','go-baggage','enter-cab','receive-clearance','back-baggage','back-carriage','release-guidance','enter-walkway','report-safe-arrival'])await act(id)
  assert.equal(h.save.facts.journey_complete,true);assert.equal(activeRelay(h.save)?.phase,'accepted')
  for(const id of ['return-carriage',relayAction('deliver','lin'),'go-baggage',relayAction('finish','zhou-yu')])await act(id)
  assert.equal(activeRelay(h.save)?.phase,'completed');assert.equal(h.save.facts.journey_complete,true)
 }finally{raw.close()}
})
