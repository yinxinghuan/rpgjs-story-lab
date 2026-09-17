import {chooseInvestigationRoute} from '../src/old-street-investigation-route'
import {archiveLoanAt,archiveLoanLead} from '../src/old-street-archive-loan'
import {archivePaperPose} from '../src/old-street-archive-reading'
import {developingTarget} from '../src/old-street-developing-puzzle'
import {assertOldStreetHead} from '../src/old-street-head'
import {fieldChoices,fieldKnowledge} from '../src/old-street-field-inquiry'
import {evidenceChoices,sharedEvidence,sharedEvidenceKnowledge} from '../src/old-street-shared-evidence'
import {oldStreetAuthoredTalkReply,oldStreetTalkTopics} from '../src/old-street-conversation'
import {oldStreetDialogueContext} from '../server/old-street-dialogue'
import {archivePhotoSource,archivePhotoSuggestion} from '../src/old-street-archive-photo'
import {compileExpansionPlan,type ExpansionPlan} from '../src/old-street-expansion-plan'
import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {writeFileSync} from 'node:fs'
import {archiveEvidence,archiveLayout,archiveOrders,archiveOrderMatches,readArchiveContent,archiveRackLabel} from '../src/old-street-archive'
import {assertOldStreetCampaign,campaignComplete} from '../src/old-street-campaign'
import {oldStreetSpatialPlan,oldStreetDoors,oldStreetPath,oldStreetWalkable} from '../src/old-street-space'
import {OldStreetAuthority,oldStreetRuntime,type OldStreetHead} from '../server/old-street-runtime'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {compilePreparedInvestigation} from '../server/old-street-investigation-draft'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {campaignInputKnowledge} from '../src/old-street-campaign-interaction'
import {oldStreetJournal,oldStreetCurrentPurpose} from '../src/old-street-journal'
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

for(const readingMode of ['direct','lens','table','commission','photo-loan','laundry-loan'] as const)test(`campaign ${readingMode}: doors, evidence actions and reconstructed ending persist`,async(t)=>{
 const loanSite=readingMode==='photo-loan'?'photo':readingMode==='laundry-loan'?'laundry':undefined
 const fullCommission=readingMode==='commission'||!!loanSite,direct=readingMode==='direct'||fullCommission
 const parcelDraft={title:'The footbridge note',fragment:'The undated note mentions bridge repairs and the reopening.',recordAt:'start',events:['Replacement boards were cut','The new boards were fitted','The footbridge reopened'],roomPlan:{indexSide:'left',storageShelves:0,rack:'left'},...(loanSite?{ledgerSite:loanSite}:{}),...(direct&&!loanSite?{}:{denseSource:'index'})}
 const {parcel,archive}=compilePreparedInvestigation(parcelDraft,trace.records[0],'en',42)
 const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN IMMEDIATE');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 let jobs:OldStreetCampaignJobs,calls=0,interpretationCalls=0,photoPlan:ExpansionPlan|undefined
 const planner=createOldStreetCampaignPlanner(async(_system,user)=>{
  calls++;const context=JSON.parse(user)
  if('candidate' in context||'chronologicalEvents' in context||context.context?.stage==='field')return {valid:true,issues:[]}
  if(context.stage==='field')return {title:'The saved boards',target:readingMode==='table'?'drawer':'viewing-table',finding:'Sound boards were kept for later patching instead of replacing the whole bridge. The reopened route still had uneven sections.'}
  if(context.stage==='trace')return trace
  if(context.stage==='parcel')return parcelDraft
  throw Error('Archive must reuse the prepared episode, not generate another history')
 })
 const authority=()=>new OldStreetAuthority(db,()=>true,async(text,context)=>{interpretationCalls++;assert.equal(text,'Tell her what I learned from the records');assert.ok(context.actions.some(a=>a.id==='evidence:share-account'));return 'evidence:share-account'},undefined,()=>photoPlan,()=>photoPlan?'synthetic-photo-hash':undefined,undefined,undefined,(h,stage)=>jobs.candidateFor(h,stage))
 let s=authority();jobs=new OldStreetCampaignJobs(db,(o,id)=>s.get(o,id),planner)
 let journeyId=randomUUID()
 const expectedRoute=loanSite==='photo'?'studio-loan-v1':loanSite==='laundry'?'laundry-loan-v1':'on-site-v1'
 while(chooseInvestigationRoute(journeyId)!==expectedRoute)journeyId=randomUUID()
 const uuidMock=t.mock.method(globalThis.crypto,'randomUUID',()=>journeyId)
 let h=s.create('synthetic',randomUUID(),'en',{campaign:fullCommission?'letter-trail-v3':'letter-trail-v2'})
 uuidMock.mock.restore()
 const input=(target:string,extra:any)=>({action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.id===target)!.approach,target,...extra})
 const send=async(target:string,extra:any)=>{const b=input(target,extra),r=await s.action('synthetic',h.id,b);h=r.head;return {b,r}}
 const steps=async(route:string[])=>{for(const step of route){const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId;const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;await send(e.id,{type:'action',action})}}
 const prepare=async(stage:'trace'|'parcel'|'archive'|'field')=>{jobs.enqueue('synthetic',h.id,stage);await jobs.run('synthetic',h.id,stage)}
 try{
  if(fullCommission){
   await steps(['photo'])
   await assert.rejects(s.action('synthetic',h.id,input('viewing-table',{type:'expansion-request',template:'photo-darkroom-v1',text:'An unrelated place'})),/EXPANSION_UNAVAILABLE/)
   assert.equal(s.get('synthetic',h.id).expansions,undefined,'early unrelated request cannot occupy the only darkroom')
   await steps(['street'])
  }
  await steps(['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
  if(readingMode==='lens')await steps(['oldstreet:move-box','oldstreet:take-lens'])
  await prepare('trace');await send('record-book',{type:'campaign-read',stage:'trace'});await send('record-book',{type:'campaign-decide',stage:'trace',selection:0})
  await assert.rejects(s.action('synthetic',h.id,input('record-book',{type:'campaign-decide',stage:'trace',selection:'share'})),/OBSERVATION_REQUIRED/)
  await steps(['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar'])
  const beforePreparation=structuredClone(h)
  await prepare('parcel')
  assert.deepEqual(s.get('synthetic',h.id),beforePreparation,'preparing an episode never observes clues or moves the player')
  assert.deepEqual(jobs.get('synthetic',h.id,'parcel')?.content,parcel,'public job exposes only the opening clue')
  assert.throws(()=>jobs.get('synthetic',h.id,'archive'),/PAPERS_REQUIRED/)
  jobs=new OldStreetCampaignJobs(db,(o,id)=>s.get(o,id),planner)
  assert.deepEqual(jobs.get('synthetic',h.id,'parcel')?.content,parcel,'restart preserves the opening')
  assert.ok(!campaignInputKnowledge(h).some(k=>k.id==='learned:campaign-question'),'a prepared draft is not player knowledge')
  await send('photo-folder',{type:'campaign-read',stage:'parcel'})
  assert.equal(campaignInputKnowledge(h).find(k=>k.id==='learned:campaign-question')?.text,parcel.question)
  assert.equal(oldStreetJournal(h.save,h.campaign).notes.find(n=>n.id==='campaign-question')?.text,parcel.question)
  await send('photo-folder',{type:'campaign-decide',stage:'parcel',selection:'leave'})
  assert.equal(campaignComplete(h.campaign!),false,'v2 cannot finish at the former short ending')
  await prepare('archive');assert.equal(h.save.facts['archive-ready'],undefined,'background generation does not open a room')
  const admitted=await send('photo-folder',{type:'campaign-plan',stage:'archive'})
  assert.equal(h.sceneId,'cellar','admission never teleports the player')
  assert.equal(h.save.facts['archive-room'],JSON.stringify(readArchiveContent(jobs.get('synthetic',h.id,'archive')!.content).room))
  s=authority();assert.deepEqual(await s.action('synthetic',h.id,admitted.b),admitted.r)
  await steps(['archive'])
  assert.ok(!oldStreetSpatialPlan(h.save).entities.some(e=>e.id==='archive-index'),'blocked source is not an available remote read')
  const shifted=await send('archive-rack',{type:'free-input',text:archiveRackLabel(h.save.facts,'en'),mode:'local'})
  assert.equal(h.save.facts['archive-rack-shifted'],true)
  assert.equal(h.save.facts['archive-reconstructed'],undefined,'moving furniture is not solving the investigation')
  assert.equal(h.save.blocks.at(-1)?.data?.archiveReconstructed,0,'ending cannot cite a movement as the reconstruction')
  assert.deepEqual(await s.action('synthetic',h.id,shifted.b),shifted.r,'lost response replays without moving twice')
  await assert.rejects(s.action('synthetic',h.id,input('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','c','d','b']})),/EVIDENCE_REQUIRED/)
  assert.ok(!JSON.stringify(campaignInputKnowledge(h)).includes(archive.discovery))
  if(!direct||loanSite){
   await assert.rejects(s.action('synthetic',h.id,input('archive-index',{type:'campaign-observe',stage:'archive'})),/READING_AID_REQUIRED/)
   const initialEvidence=[...h.campaign!.archive!.examined]
   if(readingMode==='lens'){
    await send('archive-index',{type:'free-input',text:'Read with the magnifying glass',mode:'local'})
    assert.equal(h.save.facts['archive-reading-position'],undefined)
    assert.ok(h.save.inventory.some(i=>i.id==='lens'))
   }else{
    await assert.rejects(s.action('synthetic',h.id,input('archive-index',{type:'campaign-decide',stage:'archive',selection:'read-lens'})),/ACTION_UNAVAILABLE/)
    const taken=await send('archive-index',{type:'free-input',text:'Carry the insert to the table',mode:'local'})
    assert.deepEqual(await s.action('synthetic',h.id,taken.b),taken.r)
    assert.deepEqual(h.campaign!.archive!.examined,initialEvidence,'carrying does not read evidence')
    assert.equal(h.save.inventory.find(i=>i.id==='archive-reading-sheet')?.count,1)
    s=authority();h=s.get('synthetic',h.id)
    assert.equal(h.save.facts['archive-reading-position'],'carried')
    await send('archive-desk',{type:'free-input',text:'Spread out and examine the insert',mode:'local'})
    assert.equal(h.save.facts['archive-reading-position'],'desk')
    assert.equal(h.save.inventory.some(i=>i.id==='archive-reading-sheet'),false)
    assert.equal(h.save.blocks.at(-1)?.data?.archiveReconstructed,0)
    await send('archive-desk',{type:'campaign-decide',stage:'archive',selection:'carry-sheet'})
    await send('archive-index',{type:'campaign-decide',stage:'archive',selection:'return-sheet'})
    assert.equal(h.save.facts['archive-reading-position'],undefined)
    assert.deepEqual(h.campaign!.archive!.examined,['index'],'returning never erases evidence')
   }
  }else await send('archive-index',{type:'free-input',text:'Examine the work index',mode:'local'})
  assert.equal(campaignInputKnowledge(h).filter(k=>k.id.startsWith('learned:archive-')).length,1)
  await send('archive-rack',{type:'campaign-decide',stage:'archive',selection:'restore'})
  assert.equal(h.save.facts['archive-rack-shifted'],false)
  assert.deepEqual(h.campaign?.archive?.examined,['index'],'putting it back never erases learned evidence')
  await send('archive-rack',{type:'campaign-decide',stage:'archive',selection:'slide'})
  await steps(['cellar','archive'])
  await send('archive-ledger',{type:'campaign-observe',stage:'archive'})
  if(loanSite){
   assert.deepEqual(h.campaign!.archive!.examined,['index'],'loan slip does not grant the missing evidence')
   assert.equal(archivePaperPose('archive-ledger',h.save.facts),'without-paper')
   assert.equal(h.save.facts['archive-ledger-site'],loanSite)
   assert.equal(oldStreetCurrentPurpose(h.save,h.campaign),archiveLoanLead(archive,'en'))
   await assert.rejects(s.action('synthetic',h.id,input('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','c','d','b']})),/EVIDENCE_REQUIRED/)
   const target=loanSite==='photo'?'viewing-table':'clock-display',route=loanSite==='photo'?['cellar','yard','street','photo']:['cellar','yard','laundry']
   await steps(route)
   assert.ok(archiveLoanAt(h.campaign!.archive!.content,target))
   const entry=oldStreetDoors().find(d=>d.room===h.sceneId)!.approach,table=oldStreetSpatialPlan(h.save).entities.find(e=>e.id===target)!
   assert.ok(oldStreetPath(h.sceneId as any,entry,table.approach,h.save).length,'the loaned source is physically reachable')
   const observed=await send(target,{type:'free-input',text:'Read the work log on loan',mode:'local'})
   assert.deepEqual(h.campaign!.archive!.examined,['index','ledger'])
   assert.deepEqual(await s.action('synthetic',h.id,observed.b),observed.r)
   s=authority();h=s.get('synthetic',h.id)
   assert.equal(h.campaign!.archive!.content.ledgerSite,loanSite)
   await steps(loanSite==='photo'?['street','yard','cellar','archive']:['yard','cellar','archive'])
  }
  await assert.rejects(s.action('synthetic',h.id,input('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','b','c','d']})),/ORDER_MISMATCH/)
  assert.throws(()=>jobs.enqueue('synthetic',h.id,'field'),/OBSERVATION_REQUIRED/)
  const completed=await send('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','c','d','b']})
  assert.deepEqual(await s.action('synthetic',h.id,completed.b),completed.r)
  assert.equal(campaignComplete(h.campaign!,h.save.facts),!fullCommission);assertOldStreetCampaign(h.campaign)
  assert.ok(oldStreetJournal(h.save,h.campaign).notes.some(n=>n.text===archive.discovery))
  if(!direct){
   await prepare('field')
   assert.equal(h.campaign?.field,undefined,'background work does not discover or place a note')
   const planned=await send('archive-desk',{type:'campaign-plan',stage:'field'})
   assert.deepEqual(await s.action('synthetic',h.id,planned.b),planned.r)
   const f=h.campaign!.field!,original=structuredClone(f.content)
   assert.equal(fieldKnowledge(h).length,1,'a cross-reference does not reveal the note contents')
   assert.ok(!JSON.stringify(campaignInputKnowledge(h)).includes(f.content.finding))
   await steps(['cellar','yard','shop'])
   if(readingMode==='lens')await steps(['street','photo'])
   else{
    assert.deepEqual(fieldChoices(h,'drawer'),[],'a closed drawer remains a real obstacle')
    await assert.rejects(s.action('synthetic',h.id,input('drawer',{type:'campaign-observe',stage:'field'})),/ACTION_UNAVAILABLE/)
    await steps(['oldstreet:move-box'])
   }
   await send(f.content.target,{type:'free-input',text:fieldChoices(h,f.content.target)[0].label,mode:'local'})
   assert.equal(h.save.facts['field-note-finding'],original.finding)
   assert.ok(!h.save.inventory.some(i=>i.id==='field-note'),'looking does not take the original')
   const decision=readingMode==='table'?'take':'leave'
   const settled=await send(f.content.target,{type:'free-input',text:fieldChoices(h,f.content.target).find(a=>a.selection===decision)!.label,mode:'local'})
   assert.deepEqual(await s.action('synthetic',h.id,settled.b),settled.r)
   assert.equal(h.save.inventory.some(i=>i.id==='field-note'),decision==='take')
   assert.ok(!fieldChoices(h,f.content.target).some(a=>a.selection===decision),'the same decision is not offered twice')
   s=authority();h=s.get('synthetic',h.id)
   assert.deepEqual(h.campaign!.field!.content,original)
   assert.ok(oldStreetJournal(h.save,h.campaign).notes.some(n=>n.id==='field-finding'&&n.text===original.finding))
   if(readingMode==='table'){
    await assert.rejects(s.action('synthetic',h.id,input('drawer',{type:'campaign-decide',stage:'field',selection:'copy'})),/ACTION_UNAVAILABLE/)
    await steps(['street','photo'])
   }
   const copyAction=fieldChoices(h,'viewing-table').find(a=>a.selection==='copy')!
   assert.ok(copyAction,'the held original or the original on this table can be copied')
   const copied=await send('viewing-table',{type:'free-input',text:copyAction.label,mode:'local',finding:'a fabricated copy'})
   assert.deepEqual(h.campaign?.field?.copy,{title:original.title,finding:original.finding})
   assert.equal(h.save.facts['field-note-copy'],original.finding)
   assert.equal(h.save.inventory.filter(i=>i.id==='field-note-copy').length,1)
   assert.equal(h.campaign?.field?.disposition,decision,'copying does not return or take the original')
   assert.deepEqual(await s.action('synthetic',h.id,copied.b),copied.r)
   await assert.rejects(s.action('synthetic',h.id,input('viewing-table',{type:'campaign-decide',stage:'field',selection:'copy'})),/ACTION_UNAVAILABLE/)
   s=authority();h=s.get('synthetic',h.id)
   assert.equal(h.save.inventory.find(i=>i.id==='field-note-copy')?.count,1)
   assert.ok(oldStreetJournal(h.save,h.campaign).notes.some(n=>n.id==='field-copy'))
   if(readingMode==='table'){
    await assert.rejects(s.action('synthetic',h.id,input('viewing-table',{type:'campaign-decide',stage:'field',selection:'return'})),/ACTION_UNAVAILABLE/)
    await steps(['street','shop'])
    const returned=await send('drawer',{type:'free-input',text:fieldChoices(h,'drawer').find(a=>a.selection==='return')!.label,mode:'local'})
    assert.deepEqual(await s.action('synthetic',h.id,returned.b),returned.r)
    assert.equal(h.campaign?.field?.disposition,'leave')
    assert.ok(!h.save.inventory.some(i=>i.id==='field-note'))
    assert.equal(h.save.inventory.find(i=>i.id==='field-note-copy')?.count,1)
    s=authority();h=s.get('synthetic',h.id)
    assert.equal(h.campaign?.field?.disposition,'leave')
   }
   if(readingMode==='lens'){
    await steps(['oldstreet:greet-photographer'])
    const noteChoice=evidenceChoices(h,'photographer').find(a=>a.kind==='field-note')!
    const shared=await send('photographer',{type:'free-input',text:noteChoice.label,mode:'local'})
    assert.deepEqual(await s.action('synthetic',h.id,shared.b),shared.r)
    assert.equal(sharedEvidence(h.save,'photographer').find(e=>e.kind==='field-note')?.text,original.finding)
    assert.ok(sharedEvidenceKnowledge(h.save,'photographer').some(k=>k.id==='received:field-note'&&k.text.includes('not read the original')))
    assert.deepEqual(sharedEvidence(h.save,'watchmaker'),[])
    s=authority();h=s.get('synthetic',h.id)
    const recall=oldStreetTalkTopics(h.save,'photographer').find(t=>t.id==='shared-note')!
    assert.ok(oldStreetAuthoredTalkReply(h.save,'photographer',recall.text)?.includes(original.finding))
    assert.ok(!h.save.inventory.some(i=>i.id==='field-note'),'sharing a left note does not take it')
    await steps(['street','shop'])
   }
  }else await steps(['cellar','yard','shop'])
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
  assert.equal(campaignComplete(h.campaign!,h.save.facts),!fullCommission,'publishing is optional; related photograph is not yet observed')
  if(fullCommission){
   assert.match(oldStreetCurrentPurpose(h.save,h.campaign),/photograph/)
   await steps(['street'])
   await assert.rejects(s.action('synthetic',h.id,input('street-exit',{type:'action',action:'oldstreet:leave'})),/CAMPAIGN_UNFINISHED/)
   const premature=structuredClone(h);premature.save.facts.departed=true;assert.throws(()=>assertOldStreetHead(premature),/SAVE_UNSUPPORTED/)
   await steps(['shop'])
  }
  if(!fullCommission){const privateEnding=structuredClone(h.save);privateEnding.facts.departed=true;completeOldStreetEnding(privateEnding,oldStreetCartridge('en'));assert.ok(!privateEnding.finale.ending?.preserved.some(p=>p.includes('public record book')),'withdrawn summary is absent from ending')}
  await send('record-book',{type:'campaign-decide',stage:'trace',selection:'share'})
  assert.ok(oldStreetJournal(h.save,h.campaign).notes.find(n=>n.id==='campaign-public-summary')?.text.includes('public record book'))
  if(direct){
   await steps(['street','photo'])
   const source=archivePhotoSource(h.campaign)!
   const request=await send('viewing-table',{type:'expansion-request',template:'photo-darkroom-v1',text:'Find a photograph of the bridge repairs',followArchive:true,archiveSource:{account:'client must not invent history'}})
   assert.deepEqual(h.expansions![0].archiveSource,source)
   if(fullCommission)assert.equal(h.expansions![0].input,archivePhotoSuggestion('en'))
   assert.deepEqual(await s.action('synthetic',h.id,request.b),request.r)
   s=authority();h=s.get('synthetic',h.id);assert.deepEqual(h.expansions![0].archiveSource,source)
   if(fullCommission){
    assert.equal(campaignComplete(h.campaign!,h.save.facts),false)
    await assert.rejects(s.action('synthetic',h.id,input('viewing-table',{type:'expansion-activate'})),/EXPANSION_UNAVAILABLE/)
    assert.equal(h.save.facts['darkroom-ready'],undefined,'missing preparation preserves an unfinished, retryable journey')
   }
   photoPlan=compileExpansionPlan(h.expansions![0],{title:'The bridge boards',discovery:'Three newer boards interrupt the worn planks of the footbridge.',photograph:'Monochrome pixel art of a footbridge with three replacement boards.'},'en')
   await send('viewing-table',{type:'expansion-activate'})
   assert.equal(oldStreetJournal(h.save,h.campaign).notes.some(n=>n.id==='darkroom-photo-discovery'),false,'preparation does not reveal the photograph')
   await steps(['darkroom'])
   const proof=fullCommission?{version:'synthetic-photo-hash',method:'develop-v1',...developingTarget('synthetic-photo-hash')}:{version:'synthetic-photo-hash',piece:'piece-river',rotation:0}
   if(fullCommission){
    assert.equal(h.expansions![0].photoMethod,'develop-v1')
    await assert.rejects(s.action('synthetic',h.id,input('developing-bench',{type:'expansion-photo-match',photoMatch:{version:'synthetic-photo-hash',piece:'piece-river',rotation:0}})),/PHOTO_ALIGNMENT_REQUIRED/)
    assert.equal(s.get('synthetic',h.id).save.facts['darkroom-photo-matched'],undefined)
   }
   const matched=await send('developing-bench',{type:'expansion-photo-match',photoMatch:proof})
   if(fullCommission){
    assert.equal(h.save.facts['campaign-photo-archive'],source.archiveId)
    assert.equal(campaignComplete(h.campaign!,h.save.facts),false,'observing the image does not choose its destination')
    assert.match(oldStreetCurrentPurpose(h.save,h.campaign),/Decide whether/)
    const left=await oldStreetRuntime(()=>true).prepare(h,input('developing-bench',{type:'expansion-photo-decision',decision:'leave'}),()=>true)
    assert.equal(campaignComplete(left.head.campaign!,left.head.save.facts),true,'leaving the original is equally valid')
    assert.equal(left.head.save.inventory.some(i=>i.id==='darkroom-print'),false)
    assertOldStreetHead(left.head)
   }
   assert.equal(matched.r.text,photoPlan.content.discovery)
   assert.deepEqual(await s.action('synthetic',h.id,matched.b),matched.r)
   await send('developing-bench',{type:'expansion-photo-decision',decision:'keep'})
   s=authority();h=s.get('synthetic',h.id)
   if(fullCommission){assert.equal(campaignComplete(h.campaign!,h.save.facts),true);assert.match(oldStreetCurrentPurpose(h.save,h.campaign),/Go home/)}
   assert.equal(oldStreetJournal(h.save,h.campaign).notes.find(n=>n.id==='darkroom-photo-discovery')?.text,photoPlan.content.discovery)
   assert.equal(h.save.inventory.some(i=>i.id==='darkroom-print'),true)
   if(readingMode==='commission'){
    // Explicit local renderer fixture: normal authority produced this head.
    // No browser state injection; no credentials or player saves are included.
    if(process.env.OLDSTREET_ROOF_QA_HEAD)writeFileSync(process.env.OLDSTREET_ROOF_QA_HEAD,JSON.stringify(h))
    await send('developing-bench',{type:'free-input',text:'Read the filing mark on the back',mode:'local'})
    assert.equal(h.save.facts['roof-index-read'],true)
    await steps(['photo','roof'])
    const start={x:184,y:292},cache=oldStreetSpatialPlan(h.save).entities.find(e=>e.id==='roof-cache')!
    assert.equal(oldStreetPath('roof',start,cache.approach,h.save).length,0,'the real gap blocks the north cabinet')
    const attempted=await send('roof-planks',{type:'action',action:'oldstreet:try-short-plank'})
    assert.equal(h.save.facts['roof-bridge-laid'],false)
    assert.match(attempted.r.text,/cannot reach/)
    const laid=await send('roof-planks',{type:'free-input',text:'Lay the long plank',mode:'local'})
    assert.equal(h.save.facts['roof-bridge-laid'],true)
    assert.ok(oldStreetPath('roof',start,cache.approach,h.save).length>0,'bridge opens an actual walkable route')
    assert.equal(oldStreetWalkable('roof',{x:240,y:384},h.save),true,'carried plank no longer blocks its former place')
    assert.equal(oldStreetWalkable('roof',{x:96,y:224},h.save),false,'remaining gap still blocks walking')
    await steps(['oldstreet:open-roof-box','oldstreet:take-roof-negative'])
    assert.equal(h.save.inventory.find(i=>i.id==='street-negative')?.count,1)
    const family=structuredClone(h.save);family.facts.departed=true;completeOldStreetEnding(family,oldStreetCartridge('en'))
    assert.ok(family.finale.ending?.preserved.some(p=>p.includes('brought home the negative')))
    s=authority();h=s.get('synthetic',h.id)
    assert.equal(h.save.facts['roof-box-open'],true)
    assert.deepEqual(await s.action('synthetic',h.id,laid.b),laid.r,'lost bridge receipt does not apply again')
    await steps(['photo','oldstreet:return-roof-negative'])
    assert.equal(h.save.inventory.some(i=>i.id==='street-negative'),false)
    assert.ok(h.save.relationships.some(r=>r.axis==='recovered-negative'))
    assert.ok(oldStreetJournal(h.save,h.campaign).notes.some(n=>n.id==='roof-negative-returned'))
    const studio=structuredClone(h.save);studio.facts.departed=true;completeOldStreetEnding(studio,oldStreetCartridge('en'))
    assert.ok(studio.finale.ending?.preserved.some(p=>p.includes('negative remains at the studio')))
    await steps(['darkroom'])
   }
   await steps(['photo'])
   if(readingMode!=='commission'){
    assert.deepEqual(evidenceChoices(h,'photographer'),[],'a visible stranger is not yet an introduced recipient')
    await steps(['oldstreet:greet-photographer'])
   }
   const label=(id:string)=>evidenceChoices(h,'photographer').find(c=>c.id===id)!.label
   const inventoryBefore=structuredClone(h.save.inventory),relationsBefore=structuredClone(h.save.relationships)
   assert.deepEqual(sharedEvidence(h.save,'photographer'),[],'a discovery is not automatically shared')
   const leftPrint=structuredClone(h);leftPrint.save.inventory=leftPrint.save.inventory.filter(i=>i.id!=='darkroom-print')
   assert.ok(!evidenceChoices(leftPrint,'photographer').some(c=>c.kind==='photo-shown'))
   assert.ok(evidenceChoices(leftPrint,'photographer').some(c=>c.kind==='photo-described'))
   const describedLabel=label('evidence:describe-photo')
   const described=await send('photographer',{type:'free-input',text:describedLabel,mode:'local',evidenceText:'CLIENT INVENTED HISTORY'})
   assert.equal(described.r.kind,'shared-evidence')
   assert.equal(sharedEvidence(h.save,'photographer')[0].text,photoPlan.content.discovery)
   assert.match(sharedEvidenceKnowledge(h.save,'photographer')[0].text,/not seen the print/)
   assert.deepEqual(await s.action('synthetic',h.id,described.b),described.r,'retry returns the same share without duplicate memories')
   const recall=oldStreetTalkTopics(h.save,'photographer').find(t=>t.id==='shared-photo')!
   assert.match(oldStreetAuthoredTalkReply(h.save,'photographer',recall.text)!,/not seen the print/)
   await assert.rejects(s.action('synthetic',h.id,input('photographer',{type:'free-input',text:describedLabel,mode:'local'})),/INPUT_UNSUPPORTED/)
   const shown=await send('photographer',{type:'free-input',text:label('evidence:show-photo'),mode:'local'})
   assert.deepEqual(await s.action('synthetic',h.id,shown.b),shown.r)
   assert.equal(evidenceChoices(h,'photographer').some(c=>c.kind.startsWith('photo-')),false)
   assert.equal(sharedEvidenceKnowledge(h.save,'photographer').length,1)
   assert.match(sharedEvidenceKnowledge(h.save,'photographer')[0].text,/showed you/)
   assert.match(oldStreetAuthoredTalkReply(h.save,'photographer',recall.text)!,/showed me the print/)
   await send('photographer',{type:'free-input',text:'Tell her what I learned from the records',mode:'live'})
   assert.equal(interpretationCalls,1,'a model-resolved paraphrase reaches the same authoritative share')
   assert.equal(sharedEvidence(h.save,'photographer').length,3)
   assert.deepEqual(sharedEvidence(h.save,'watchmaker'),[])
   assert.deepEqual(sharedEvidence(h.save,'laundry-owner'),[])
   assert.deepEqual(h.save.inventory,inventoryBefore,'showing a print does not transfer it')
   assert.deepEqual(h.save.relationships,relationsBefore,'sharing does not farm relationship points')
   s=authority();h=s.get('synthetic',h.id)
   assert.equal(oldStreetDialogueContext(h,'photographer').knowledge.filter(k=>k.id.startsWith('received:')).length,2)
   const reply=await send('photographer',{type:'dialogue',text:recall.text,mode:'local'})
   assert.match(reply.r.text,/showed me the print/)
   assert.ok(reply.r.text.includes(photoPlan.content.discovery))
   await steps(['roof','shed'])
   assert.equal(oldStreetDialogueContext(h,'watchmaker').knowledge.filter(k=>k.id.startsWith('received:')).length,0)
   await steps(['roof','photo'])
   assert.equal(sharedEvidence(h.save,'photographer').length,3,'leaving and returning preserves the recipient memory')
  }
  await steps(['street','oldstreet:leave'])
  if(photoPlan)assert.ok(h.save.finale.ending?.preserved.includes(photoPlan.content.discovery))
  assert.equal(h.save.finale.status,'complete');assert.ok(h.save.finale.ending?.preserved.includes(archive.discovery))
  assert.equal(h.save.finale.ending?.title,'A letter and an answer')
  assert.ok(h.save.finale.ending?.preserved.some(line=>line.includes(fullCommission?'request that came with the letter':'family’s request')))
  assert.ok(h.save.finale.ending?.preserved.some(line=>line.includes('public record book')))
  s=authority();assert.deepEqual(s.get('synthetic',h.id),h);assert.equal(calls,direct?3:5)
  if(h.campaign?.field){assert.ok(h.save.finale.ending?.preserved.includes(h.campaign.field.content.finding));assert.ok(h.save.finale.ending?.preserved.some(p=>p.includes('written copy')));assert.ok(h.save.finale.ending?.preserved.some(p=>p.includes('left the supplementary note')))}
 }finally{raw.close()}
})
