import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {archiveEvidence,archiveLayout,archiveOrders,archiveOrderMatches,readArchiveContent,compileInquiryArchive} from '../src/old-street-archive'
import {assertOldStreetCampaign,campaignComplete,compileLinkedParcel} from '../src/old-street-campaign'
import {oldStreetSpatialPlan,oldStreetDoors,oldStreetPath,oldStreetWalkable} from '../src/old-street-space'
import {OldStreetAuthority,type OldStreetHead} from '../server/old-street-runtime'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {campaignInputKnowledge} from '../src/old-street-campaign-interaction'
import {oldStreetJournal} from '../src/old-street-journal'
import type {AuthorityStorage} from '../server/session-authority'
import {publicRecordAction,publicRecordKnowledge} from '../src/old-street-public-record'
import {oldStreetRecordBookPose} from '../src/old-street-record-book'
import {completeOldStreetEnding} from '../src/old-street-ending'
import {oldStreetCartridge} from '../src/old-street-cartridge'
const archive={title:'The footbridge work',layout:'west-index',cards:[{id:'a',label:'The new boards were fitted'},{id:'b',label:'Replacement boards were cut'},{id:'c',label:'The footbridge reopened'},{id:'d',label:'The damaged boards were surveyed'}],sources:{index:[{before:'d',after:'b'},{before:'a',after:'c'}],ledger:[{before:'b',after:'a'}]},discovery:'Neighbors measured the damage before cutting replacement boards. The path reopened only after the boards were fitted.'}
const trace={title:'Filed packets',clue:{mark:'two notches',wrapping:'linen cord'},records:[{label:'Bridge repairs',mark:'two notches',wrapping:'linen cord'},{label:'Roof repairs',mark:'two notches',wrapping:'folded flap'},{label:'Workshop repairs',mark:'one notch',wrapping:'linen cord'}]}
const parcel={title:'A repaired path',fragment:'A note records three new boards on the old footbridge.',question:'Was the damage measured before replacement boards were cut?'}

test('generated ordering evidence has a unique answer requiring both sources; variants change the answer',()=>{
 const c=readArchiveContent(archive)
 assert.deepEqual(archiveOrders([...c.sources.index,...c.sources.ledger]),[['d','b','a','c']])
 assert.ok(archiveOrders(c.sources.index).length>1);assert.ok(archiveOrders(c.sources.ledger).length>1)
 assert.equal(archiveOrderMatches(c,['a','b','c','d']),false)
 const alternate=readArchiveContent({...archive,layout:'east-index',sources:{index:[{before:'c',after:'a'}],ledger:[{before:'a',after:'d'},{before:'d',after:'b'}]}})
 assert.equal(archiveOrderMatches(alternate,['c','a','d','b']),true)
 assert.equal(archiveOrderMatches(alternate,['d','b','a','c']),false)
 assert.throws(()=>readArchiveContent({...archive,sources:{index:[{before:'a',after:'b'}],ledger:[{before:'b',after:'a'},{before:'c',after:'d'}]}}),/AMBIGUOUS/)
 assert.throws(()=>readArchiveContent({...archive,sources:{index:[{before:'a',after:'b'},{before:'a',after:'c'}],ledger:[{before:'a',after:'d'}]}}),/AMBIGUOUS/)
 assert.throws(()=>readArchiveContent({...archive,answer:['d','b','a','c']}),/INVALID/)
 assert.ok(archiveEvidence(c,'index','en')[0].includes('surveyed'))
})

for(const layout of ['west-index','east-index'] as const)test(`archive ${layout}: the real collision projection connects entry, both sources, desk and exit`,()=>{
 const save={facts:{'archive-ready':true,'archive-layout':layout}},plan=archiveLayout(layout),doors=oldStreetDoors().filter(d=>d.room==='archive')
 for(const target of [...plan.props,...doors]){
  assert.equal(oldStreetWalkable('archive',target.approach,save),true,target.id)
  assert.ok(oldStreetPath('archive',plan.arrival,target.approach,save),target.id)
  assert.ok(oldStreetPath('archive',target.approach,plan.arrival,save),target.id+' return')
 }
 assert.equal(oldStreetWalkable('archive',{x:plan.props[0].body.x+4,y:plan.props[0].body.y+4},save),false,'furniture blocks passage')
})

test('new campaign enters its generated archive through the real door, gathers evidence and persists the reconstructed ending',async()=>{
 const parcelDraft={title:'The footbridge note',fragment:'The undated note mentions bridge repairs and the reopening.',otherEvent:'The footbridge reopened'}
 const parcel=compileLinkedParcel(parcelDraft,trace.records[0],'en'),archiveDraft={title:'The footbridge work',layout:'west-index',room:['I...L','.....','.SS..','.....','...S.','.Tt..','.....','.....','.....'],middleEvents:['Replacement boards were cut','The new boards were fitted'],earlier:'first'}
 const archive=compileInquiryArchive(archiveDraft,parcel.inquiry!,'en')
 const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN IMMEDIATE');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 let jobs:OldStreetCampaignJobs,calls=0
 const planner=createOldStreetCampaignPlanner(async(_system,user)=>{
  calls++;const context=JSON.parse(user)
  if(context.stage==='trace')return trace
  if(context.stage==='parcel')return parcelDraft
  assert.deepEqual(context.previous,trace.records[0]);assert.deepEqual(context.papers,parcel)
  return archiveDraft
 })
 const authority=()=>new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,undefined,undefined,(h,stage)=>jobs.candidateFor(h,stage))
 let s=authority();jobs=new OldStreetCampaignJobs(db,(o,id)=>s.get(o,id),planner)
 let h=s.create('synthetic',randomUUID(),'en',{campaign:'letter-trail-v2'})
 const input=(target:string,extra:any)=>({action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.id===target)!.approach,target,...extra})
 const send=async(target:string,extra:any)=>{const b=input(target,extra),r=await s.action('synthetic',h.id,b);h=r.head;return {b,r}}
 const steps=async(route:string[])=>{for(const step of route){const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId;const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;await send(e.id,{type:'action',action})}}
 const prepare=async(stage:'trace'|'parcel'|'archive')=>{jobs.enqueue('synthetic',h.id,stage);await jobs.run('synthetic',h.id,stage)}
 try{
  await steps(['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  await prepare('trace');await send('record-book',{type:'campaign-read',stage:'trace'});await send('record-book',{type:'campaign-decide',stage:'trace',selection:0})
  await assert.rejects(s.action('synthetic',h.id,input('record-book',{type:'campaign-decide',stage:'trace',selection:'share'})),/OBSERVATION_REQUIRED/)
  await steps(['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar'])
  await prepare('parcel')
  assert.ok(!campaignInputKnowledge(h).some(k=>k.id==='learned:campaign-question'),'a prepared draft is not player knowledge')
  await send('photo-folder',{type:'campaign-read',stage:'parcel'})
  assert.equal(campaignInputKnowledge(h).find(k=>k.id==='learned:campaign-question')?.text,parcel.question)
  assert.equal(oldStreetJournal(h.save,h.campaign).notes.find(n=>n.id==='campaign-question')?.text,parcel.question)
  await send('photo-folder',{type:'campaign-decide',stage:'parcel',selection:'leave'})
  assert.equal(campaignComplete(h.campaign!),false,'v2 cannot finish at the former short ending')
  await prepare('archive');assert.equal(h.save.facts['archive-ready'],undefined,'background generation does not open a room')
  const admitted=await send('photo-folder',{type:'campaign-plan',stage:'archive'})
  assert.equal(h.sceneId,'cellar','admission never teleports the player')
  assert.equal(h.save.facts['archive-room'],JSON.stringify(archiveDraft.room))
  s=authority();assert.deepEqual(await s.action('synthetic',h.id,admitted.b),admitted.r)
  await steps(['archive'])
  await assert.rejects(s.action('synthetic',h.id,input('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','c','d','b']})),/EVIDENCE_REQUIRED/)
  assert.ok(!JSON.stringify(campaignInputKnowledge(h)).includes(archive.discovery))
  await send('archive-index',{type:'free-input',text:'Examine the work index',mode:'local'})
  assert.equal(campaignInputKnowledge(h).filter(k=>k.id.startsWith('learned:archive-')).length,1)
  await steps(['cellar','archive'])
  await send('archive-ledger',{type:'campaign-observe',stage:'archive'})
  await assert.rejects(s.action('synthetic',h.id,input('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','b','c','d']})),/ORDER_MISMATCH/)
  const completed=await send('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','c','d','b']})
  assert.deepEqual(await s.action('synthetic',h.id,completed.b),completed.r)
  assert.equal(campaignComplete(h.campaign!),true);assertOldStreetCampaign(h.campaign)
  assert.ok(oldStreetJournal(h.save,h.campaign).notes.some(n=>n.text===archive.discovery))
  await steps(['cellar','yard','shop'])
  const inventory=structuredClone(h.save.inventory),relationships=structuredClone(h.save.relationships)
  assert.deepEqual(publicRecordKnowledge(h),[],'private discovery is not an NPC public record')
  const published=await send('record-book',{type:'free-input',text:publicRecordAction(false,'en'),mode:'local'})
  assert.equal(h.save.facts['archive-published'],true)
  assert.equal(oldStreetRecordBookPose(h.save),'stand-summary')
  assert.ok(publicRecordKnowledge(h)[0].text.includes(archive.discovery))
  assert.deepEqual(await s.action('synthetic',h.id,published.b),published.r,'lost receipt replay does not publish twice')
  await steps(['street','shop']);s=authority();h=s.get('synthetic',h.id)
  assert.equal(h.save.facts['archive-published'],true)
  await send('record-book',{type:'campaign-decide',stage:'trace',selection:'withdraw'})
  assert.equal(oldStreetRecordBookPose(h.save),'stand')
  assert.ok(publicRecordKnowledge(h)[0].text.includes('no longer public'))
  assert.ok(campaignInputKnowledge(h).some(n=>n.text===archive.discovery),'withdrawal does not erase the discovery')
  assert.deepEqual(h.save.inventory,inventory);assert.deepEqual(h.save.relationships,relationships)
  assert.equal(campaignComplete(h.campaign!),true,'publishing is optional')
  const privateEnding=structuredClone(h.save);privateEnding.facts.departed=true;completeOldStreetEnding(privateEnding,oldStreetCartridge('en'))
  assert.ok(!privateEnding.finale.ending?.preserved.some(p=>p.includes('public record book')),'withdrawn summary is absent from ending')
  await send('record-book',{type:'campaign-decide',stage:'trace',selection:'share'})
  assert.ok(oldStreetJournal(h.save,h.campaign).notes.find(n=>n.id==='campaign-public-summary')?.text.includes('public record book'))
  await steps(['street','oldstreet:leave'])
  assert.equal(h.save.finale.status,'complete');assert.ok(h.save.finale.ending?.preserved.includes(archive.discovery))
  assert.equal(h.save.finale.ending?.title,'A letter and an answer')
  assert.ok(h.save.finale.ending?.preserved.some(line=>line.includes('family’s request')))
  assert.ok(h.save.finale.ending?.preserved.some(line=>line.includes('public record book')))
  s=authority();assert.deepEqual(s.get('synthetic',h.id),h);assert.equal(calls,3)
 }finally{raw.close()}
})
