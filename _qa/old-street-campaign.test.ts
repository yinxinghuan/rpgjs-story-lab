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
const trace={title:'The paper packets',clue:{mark:'two notches',wrapping:'linen cord'},records:[
 {label:'Workshop repairs',mark:'two notches',wrapping:'folded flap'},
 {label:'Roof measurements',mark:'one notch',wrapping:'linen cord'},
 {label:'Street repairs',mark:'two notches',wrapping:'linen cord'},
]}
const parcel={title:'The repaired footbridge',fragment:'A repair note records three replaced boards on the footbridge beside the old street.'}
function storage(db:DatabaseSync):AuthorityStorage{return {all:(sql,...b)=>db.prepare(sql).all(...b) as any,run:(sql,...b)=>{db.prepare(sql).run(...b)},transaction:work=>{db.exec('BEGIN IMMEDIATE');try{const r=work();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}}}
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
  const choose=body(h,'photo-folder',{type:'campaign-decide',stage:'parcel',selection:decision}),chosen=await s.action('synthetic',h.id,choose);h=chosen.head
  assert.deepEqual(await s.action('synthetic',h.id,choose),chosen)
  assert.equal(h.save.inventory.filter(i=>i.id==='letter-enclosure').length,decision==='take'?1:0)
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
