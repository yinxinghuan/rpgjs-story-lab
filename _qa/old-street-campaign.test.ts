import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {readTraceContent,readParcelContent,campaignComplete,type CampaignContext} from '../src/old-street-campaign'
import {createOldStreetCampaignPlanner,type OldStreetCampaignGenerator} from '../server/old-street-campaign-planner'
import {OldStreetAuthority,type OldStreetHead} from '../server/old-street-runtime'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import type {AuthorityStorage} from '../server/session-authority'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {campaignInputActions,campaignInputKnowledge,campaignPropTitle} from '../src/old-street-campaign-interaction'
import {createOldStreetAttemptGenerator,oldStreetAttemptContext,type OldStreetAttemptGenerator} from '../server/old-street-attempt'
import {oldStreetTurn,oldStreetRecoveredTurn} from '../src/old-street-turn'
import {oldStreetJournal} from '../src/old-street-journal'
import {oldStreetPhotoShelfPose} from '../src/old-street-photo-shelf'
const trace={title:'The paper packets',clue:{mark:'two notches',wrapping:'linen cord'},records:[
 {label:'Workshop repairs',mark:'two notches',wrapping:'folded flap'},
 {label:'Roof measurements',mark:'one notch',wrapping:'linen cord'},
 {label:'Street repairs',mark:'two notches',wrapping:'linen cord'},
]}
const parcel={title:'The repaired footbridge',fragment:'A repair note records three replaced boards on the footbridge beside the old street.'}
function storage(db:DatabaseSync):AuthorityStorage{return {all:(sql,...b)=>db.prepare(sql).all(...b) as any,run:(sql,...b)=>{db.prepare(sql).run(...b)},transaction:work=>{db.exec('BEGIN IMMEDIATE');try{const r=work();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}}}

test('background preparation allows exploration, reuses its draft on reopen and admits only at the paper anchor',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw)
 let jobs:OldStreetCampaignJobs,calls=0,finish!:(value:unknown)=>void
 const produce:OldStreetCampaignGenerator=async()=>{calls++;return new Promise(resolve=>{finish=resolve})}
 const s=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,undefined,undefined,(h,stage)=>jobs.candidateFor(h,stage))
 jobs=new OldStreetCampaignJobs(db,(owner,id)=>s.get(owner,id),produce)
 try{
  let h=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v1'})
  h=await steps(s,h,['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  const initial=structuredClone(h)
  jobs.enqueue('synthetic',h.id,'trace');const running=jobs.run('synthetic',h.id,'trace')
  assert.equal(jobs.get('synthetic',h.id,'trace')?.state,'planning')
  jobs.enqueue('synthetic',h.id,'trace');await jobs.run('synthetic',h.id,'trace')
  assert.equal(calls,1)
  await assert.rejects(s.action('synthetic',h.id,body(h,'record-book',{type:'campaign-plan',stage:'trace'})),/CAMPAIGN_NOT_PREPARED/)
  assert.deepEqual(s.get('synthetic',h.id),initial)
  h=await steps(s,h,['street']);const exploring=structuredClone(h)
  finish(trace);await running
  assert.deepEqual(s.get('synthetic',h.id),exploring,'preparation cannot advance, relocate or overwrite an exploring journey')
  jobs=new OldStreetCampaignJobs(db,(owner,id)=>s.get(owner,id),produce)
  assert.equal(jobs.get('synthetic',h.id,'trace')?.state,'ready')
  jobs.enqueue('synthetic',h.id,'trace');await jobs.run('synthetic',h.id,'trace');assert.equal(calls,1)
  h=await steps(s,h,['shop'])
  const request=body(h,'record-book',{type:'campaign-plan',stage:'trace'}),result=await s.action('synthetic',h.id,request)
  assert.deepEqual(result.head.campaign?.trace?.content,trace)
  assert.equal(result.head.campaign?.trace?.observed,false)
  assert.deepEqual(await s.action('synthetic',h.id,request),result)
  assert.equal(calls,1)
 }finally{raw.close()}
})

test('expired background attempt can retry; late completion cannot replace the new ready draft',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw)
 let now=1000,calls=0,finishOld!:(value:unknown)=>void
 const s=create(raw,async()=>trace)
 try{
  let h=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v1'})
  h=await steps(s,h,['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  const newer={...trace,title:'Recovered filing records'}
  const jobs=new OldStreetCampaignJobs(db,(owner,id)=>s.get(owner,id),async()=>{calls++;return calls===1?new Promise(resolve=>{finishOld=resolve}):newer},()=>now)
  jobs.enqueue('synthetic',h.id,'trace');const old=jobs.run('synthetic',h.id,'trace')
  now+=26000;assert.equal(jobs.get('synthetic',h.id,'trace')?.state,'failed')
  assert.equal(jobs.enqueue('synthetic',h.id,'trace').state,'failed','only explicit retry starts another attempt')
  assert.equal(jobs.enqueue('synthetic',h.id,'trace',true).attempt,2)
  await jobs.run('synthetic',h.id,'trace')
  finishOld(trace);await old
  assert.deepEqual(jobs.candidateFor(h,'trace'),newer)
  assert.deepEqual(s.get('synthetic',h.id),h)
  // A server stop between enqueue and run must not leave the UI waiting forever.
  const second=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v1'})
  const ready=await steps(s,second,['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  jobs.enqueue('synthetic',ready.id,'trace');now+=26000
  assert.equal(jobs.get('synthetic',ready.id,'trace')?.state,'failed')
  assert.equal(calls,2,'polling an expired queued job does not silently regenerate')
 }finally{raw.close()}
})
const create=(db:DatabaseSync,g:OldStreetCampaignGenerator)=>new OldStreetAuthority(storage(db),()=>true,undefined,undefined,undefined,undefined,undefined,g)
function body(h:OldStreetHead,target:string,extra:Record<string,unknown>){const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.id===target)!;assert.ok(e,target);return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target,...extra}}
async function steps(s:OldStreetAuthority,h:OldStreetHead,route:string[]){for(const step of route){const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId;const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;h=(await s.action('synthetic',h.id,body(h,e.id,{type:'action',action}))).head}return h}
test('generated records need two useful clues and one mechanically supported solution',()=>{
 assert.deepEqual(readTraceContent(trace),trace)
 assert.throws(()=>readTraceContent({...trace,records:[trace.records[2],trace.records[1],trace.records[2]]}),/AMBIGUOUS/)
 assert.throws(()=>readTraceContent({...trace,clue:{mark:'missing',wrapping:'missing'}}),/AMBIGUOUS/)
 assert.throws(()=>readTraceContent({...trace,records:trace.records.map((r,i)=>i===0?{...r,mark:'no match'}:r)}),/TRIVIAL/)
 assert.throws(()=>readParcelContent({...parcel,effects:[{departed:true}]}),/CONTENT_INVALID/)
})
test('planner passes only the committed matching record into the second generation',async()=>{
 const seen:CampaignContext[]=[]
 const planner=createOldStreetCampaignPlanner(async(_,input)=>{const context=JSON.parse(input);seen.push(context);return context.stage==='trace'?trace:parcel})
 await planner({stage:'trace',locale:'en'},new AbortController().signal)
 await planner({stage:'parcel',locale:'en',previous:trace.records[2]},new AbortController().signal)
 assert.deepEqual(seen[1],{stage:'parcel',locale:'en',previous:trace.records[2]})
})
for(const decision of ['take','leave'] as const)test(`campaign ${decision}: linked content, evidence before choice, ending gate and receipt recovery`,async()=>{
 const directory=mkdtempSync(join(tmpdir(),'campaign-synthetic-')),file=join(directory,'test.sqlite');let db=new DatabaseSync(file)
 const contexts:CampaignContext[]=[],g:OldStreetCampaignGenerator=async c=>{contexts.push(structuredClone(c));return c.stage==='trace'?structuredClone(trace):structuredClone(parcel)}
 let s=create(db,g)
 try{
  let h=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v1'})
  h=await steps(s,h,['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter','street'])
  await assert.rejects(s.action('synthetic',h.id,body(h,'street-exit',{type:'action',action:'oldstreet:leave'})),/CAMPAIGN_UNFINISHED/)
  assert.equal(h.save.facts.departed,false)
  h=await steps(s,h,['shop'])
  const planned=body(h,'record-book',{type:'campaign-plan',stage:'trace'})
  const response=await s.action('synthetic',h.id,planned);h=response.head
  assert.equal(h.campaign?.trace?.observed,false)
  db.close();db=new DatabaseSync(file);s=create(db,g)
  assert.deepEqual(await s.action('synthetic',h.id,planned),response)
  assert.equal(contexts.length,1,'reload/lost receipt does not regenerate the instance')
  await assert.rejects(s.action('synthetic',h.id,body(h,'record-book',{type:'campaign-decide',stage:'trace',selection:2})),/OBSERVATION_REQUIRED/)
  h=(await s.action('synthetic',h.id,body(h,'record-book',{type:'campaign-observe',stage:'trace'}))).head
  await assert.rejects(s.action('synthetic',h.id,body(h,'record-book',{type:'campaign-decide',stage:'trace',selection:0})),/RECORD_MISMATCH/)
  h=(await s.action('synthetic',h.id,body(h,'record-book',{type:'campaign-decide',stage:'trace',selection:2}))).head
  h=await steps(s,h,['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar'])
  h=(await s.action('synthetic',h.id,body(h,'photo-folder',{type:'campaign-plan',stage:'parcel'}))).head
  assert.deepEqual(contexts[1],{stage:'parcel',locale:'en',previous:trace.records[2]})
  assert.equal(campaignComplete(h.campaign!),false)
  await assert.rejects(s.action('synthetic',h.id,body(h,'photo-folder',{type:'campaign-decide',stage:'parcel',selection:decision})),/OBSERVATION_REQUIRED/)
  h=(await s.action('synthetic',h.id,body(h,'photo-folder',{type:'campaign-observe',stage:'parcel'}))).head
  assert.equal(oldStreetPhotoShelfPose(h.save,h.campaign),'both','uncollected photo folder and archived papers coexist')
  const choose=body(h,'photo-folder',{type:'campaign-decide',stage:'parcel',selection:decision}),chosen=await s.action('synthetic',h.id,choose);h=chosen.head
  assert.deepEqual(await s.action('synthetic',h.id,choose),chosen)
  assert.equal(h.save.inventory.filter(i=>i.id==='letter-enclosure').length,decision==='take'?1:0)
  assert.equal(oldStreetPhotoShelfPose(h.save,h.campaign),decision==='take'?'stand':'both','original disposition does not remove the photograph folder')
  h=await steps(s,h,['yard','street','oldstreet:leave'])
  assert.equal(h.save.finale.status,'complete');assert.ok(campaignComplete(h.campaign!))
  const saved=s.get('synthetic',h.id);assert.deepEqual(saved,h)
  assert.ok(h.save.finale.ending?.preserved.some(p=>p.includes(decision==='take'?'brought home the archived papers':'original remains')))
  assert.equal(contexts.length,2)
 }finally{db.close();rmSync(directory,{recursive:true,force:true})}
})
test('failed generation commits neither a content instance nor story progress',async()=>{
 const db=new DatabaseSync(':memory:'),s=create(db,async()=>{throw Error('TEST_MODEL_FAILURE')})
 try{
  let h=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v1'})
  h=await steps(s,h,['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  await assert.rejects(s.action('synthetic',h.id,body(h,'record-book',{type:'campaign-plan',stage:'trace'})),/OLD_STREET_MODEL_UNAVAILABLE/)
  assert.deepEqual(s.get('synthetic',h.id),h)
 }finally{db.close()}
})

test('free input reads the same generated records, commits the chosen record and preserves packet consequences on replay',async()=>{
 const db=new DatabaseSync(':memory:');let generations=0,understandings=0
 const seen:Parameters<OldStreetAttemptGenerator>[1][]=[]
 const understand:OldStreetAttemptGenerator=async(input,context)=>{
  understandings++;seen.push(structuredClone(context))
  const id=({
   'Let me look through those filing records.':'campaign:read-trace',
   'I choose the workshop repair entry.':'campaign:select-record-0',
   'I select the street repairs entry with two notches and linen cord.':'campaign:select-record-2',
   'Let me read what is in the packet.':'campaign:read-parcel',
   'I will carry these original papers home.':'campaign:take-parcel',
  } as Record<string,string>)[input]
  assert.ok(context.actions.some(a=>a.id===id),'model can select only a currently offered action')
  return {kind:'action',actionId:id}
 }
 const s=new class extends OldStreetAuthority{advanceMinute(){const time=this.now();this.now=()=>time+60001}}(storage(db),()=>true,undefined,undefined,undefined,undefined,understand,async c=>{generations++;return c.stage==='trace'?trace:parcel})
 try{
  let h=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v1'})
  h=await steps(s,h,['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  const initial=structuredClone(h),version=h.version
  const read=body(h,'record-book',{type:'free-input',text:'Let me look through those filing records.'})
  const result=await s.action('synthetic',h.id,read);h=result.head
  assert.equal(h.version,version+1,'admission and reading are one authoritative action')
  assert.equal(h.campaign?.trace?.observed,true)
  assert.equal(seen[0].actions.filter(a=>a.id.startsWith('campaign:select')).length,0)
  assert.ok(!oldStreetJournal(initial.save,initial.campaign).purpose.includes('Go home'))
  assert.ok(!JSON.stringify(oldStreetJournal(initial.save,initial.campaign).notes).includes('two notches'))
  assert.ok(!JSON.stringify(seen[0]).includes('two notches'),'unseen generated contents are not model context')
  assert.ok(result.text.includes('two notches'))
  assert.ok(oldStreetTurn(initial,h,true).some(b=>b.text.includes('two notches')),'read results use persistent dialogue pages, not an expiring toast')
  assert.ok(oldStreetRecoveredTurn({id:h.id,body:read},h,true).length)
  assert.deepEqual(await s.action('synthetic',h.id,read),result)
  assert.equal(generations,1);assert.equal(understandings,1)
  const before=structuredClone(h)
  await assert.rejects(s.action('synthetic',h.id,body(h,'record-book',{type:'free-input',text:'I choose the workshop repair entry.'})),/CAMPAIGN_RECORD_MISMATCH/)
  assert.deepEqual(s.get('synthetic',h.id),before,'a wrong comparison does not alter the journey')
  h=(await s.action('synthetic',h.id,body(h,'record-book',{type:'free-input',text:'I select the street repairs entry with two notches and linen cord.'}))).head
  assert.equal(h.campaign?.trace?.selected,2)
  assert.equal(seen[1].actions.filter(a=>a.id.startsWith('campaign:select')).length,3,'wrong records are genuine choices, not filtered from the model')
  assert.ok(JSON.stringify(seen[1].knowledge).includes('two notches'))
  const context=seen[1],proposal={kind:'action',actionId:'campaign:select-record-2'}
  // Exercise the real resolver's veto/review path with scripted transport, not
  // just a final interpreter result. One reference can contain two descriptors.
  let requests=0
  const generator=createOldStreetAttemptGenerator(async()=>++requests%2?proposal:{valid:true,issues:[]})
  assert.equal((await generator('I select the street repairs entry with two notches and linen cord.',context)).kind,'action')
  for(const input of ['Do not select the street repairs entry with two notches and linen cord.','I select the street repairs entry with two notches and linen cord and take the papers.']){
   const vetoed=await createOldStreetAttemptGenerator(async()=>proposal)(input,context)
   assert.equal(vetoed.kind,'attempt','negation and a second action outside the record description remain vetoed')
  }
  assert.equal(oldStreetJournal(h.save,h.campaign).notes.filter(n=>n.id.startsWith('campaign-record-')).length,3)
  assert.ok(oldStreetJournal(h.save,h.campaign).purpose.includes('cellar'))
  h=await steps(s,h,['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar','oldstreet:take-photos'])
  s.advanceMinute() // Walking the real route takes time; no production quota changes.
  assert.equal(campaignPropTitle(h,'photo-folder')?.[1],'Old paper shelf')
  assert.equal(oldStreetPhotoShelfPose(h.save,h.campaign),'papers','collecting photographs does not hide archived papers')
  const unread=oldStreetAttemptContext(h,'photo-folder',campaignInputActions(h,'photo-folder'))
  assert.ok(!JSON.stringify(unread).includes('Empty shelf'))
  assert.ok(!JSON.stringify(unread).includes(parcel.fragment))
  assert.ok(!unread.actions.some(a=>a.id==='campaign:take-parcel'))
  h=(await s.action('synthetic',h.id,body(h,'photo-folder',{type:'free-input',text:'Let me read what is in the packet.'}))).head
  const taking=body(h,'photo-folder',{type:'free-input',text:'I will carry these original papers home.'})
  const taken=await s.action('synthetic',h.id,taking);h=taken.head
  assert.deepEqual(await s.action('synthetic',h.id,taking),taken)
  assert.equal(h.save.inventory.filter(i=>i.id==='letter-enclosure').length,1)
  assert.equal(oldStreetPhotoShelfPose(h.save,h.campaign),'empty','both physical items are now carried')
  assert.ok(campaignComplete(h.campaign!));assert.equal(generations,2)
  assert.ok(!campaignInputActions(h,'photo-folder').some(a=>a.id==='campaign:take-parcel'))
  assert.ok(campaignInputKnowledge(h).some(k=>k.text.includes('no longer on the shelf')))
  const journal=oldStreetJournal(h.save,h.campaign)
  assert.ok(journal.notes.some(n=>n.text===parcel.fragment))
  assert.ok(journal.notes.some(n=>n.id==='campaign-disposition'&&n.text.includes('in your bag')))
  assert.ok(journal.purpose.includes('Go home'))
 }finally{db.close()}
})

test('free-input questions can use examined papers without committing a choice; legacy journeys retain their own actions',async()=>{
 const db=new DatabaseSync(':memory:')
 const s=new OldStreetAuthority(storage(db),()=>true,undefined,undefined,undefined,undefined,async(_,context)=>{
  assert.ok(context.knowledge.some(k=>k.id==='learned:campaign-records'))
  return {kind:'attempt',outcome:'observed',discoveryIds:[],text:'The filing slip lists two notches and linen cord. You have not selected a record.'}
 },async()=>trace)
 try{
  const old=s.create('synthetic',randomUUID(),'en')
  assert.deepEqual(campaignInputActions(old,'record-book'),[])
  assert.deepEqual(campaignInputKnowledge(old),[])
  assert.equal(campaignPropTitle(old,'record-book'),undefined)
  let h=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v1'})
  h=await steps(s,h,['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  h=(await s.action('synthetic',h.id,body(h,'record-book',{type:'free-input',text:'Read the filing records',mode:'local'}))).head
  assert.equal(h.campaign?.trace?.observed,true,'visible exact action remains available offline')
  const campaign=structuredClone(h.campaign)
  const response=await s.action('synthetic',h.id,body(h,'record-book',{type:'free-input',text:'What did the slip say again?'}))
  assert.equal(response.kind,'attempt')
  assert.deepEqual(response.head.campaign,campaign)
  assert.equal(response.head.version,h.version+1,'only the short attempt history is committed')
 }finally{db.close()}
})
