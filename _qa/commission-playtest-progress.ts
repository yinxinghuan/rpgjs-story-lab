/** Prepare ONLY a newly enrolled synthetic v3 journey in the dedicated QA DB.
 * All progress uses normal authority actions and campaign jobs. Stops before
 * the archive decision for representative renderer testing; not a UI walkthrough. */
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OldStreetAuthority} from '../server/old-street-runtime'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import {photoPlanReplay} from './archive-photo-fixture'
import {OldStreetExpansionJobs} from '../server/old-street-expansion-jobs'
import {OldStreetExpansionMedia} from '../server/old-street-expansion-media'
import {readFileSync} from 'node:fs'
import {archiveOrders} from '../src/old-street-archive'
import {photoCampaignFixture} from './archive-photo-fixture'
if(!process.argv.includes('--seed-synthetic'))throw Error('Explicit synthetic QA setup required')
const replay=process.env.OLDSTREET_PHOTO_QA_REPLAY
const raw=new DatabaseSync((process.env.OLDSTREET_DEV_DATA??'.data/archive-photo-playtest-20260917')+'/journeys.sqlite')
const rows=raw.prepare("SELECT owner,id FROM journeys WHERE json_extract(data,'$.campaign.version')=3 AND json_extract(data,'$.version')=0 ORDER BY updated DESC").all() as Array<{owner:string;id:string}>
if(rows.length!==1)throw Error('Expected exactly one untouched synthetic commission journey')
const {owner,id}=rows[0]
const db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
let jobs:OldStreetCampaignJobs,expansions:OldStreetExpansionJobs,media:OldStreetExpansionMedia
const authority=new OldStreetAuthority(db,()=>true,undefined,undefined,h=>expansions.candidateFor(h),h=>media.candidateFor(h),undefined,undefined,(h,stage)=>jobs.candidateFor(h,stage))
jobs=new OldStreetCampaignJobs(db,(owner,id)=>authority.get(owner,id),photoCampaignFixture)
expansions=new OldStreetExpansionJobs(db,(owner,id)=>authority.get(owner,id),photoPlanReplay)
media=new OldStreetExpansionMedia(db,(owner,id)=>authority.get(owner,id),h=>expansions.candidateFor(h))
let h=authority.get(owner,id)
if(h.save.locale!=='en')throw Error('Recorded sample is English only')
const act=async(target:string,body:any)=>{const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.id===target)!;h=(await authority.action(owner,id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:entity.approach,target,...body})).head}
const walk=async(route:string[])=>{for(const step of route){const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId;const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;await act(entity.id,{type:'action',action})}}
const prepare=async(stage:'trace'|'parcel'|'archive')=>{jobs.enqueue(owner,id,stage);await jobs.run(owner,id,stage)}
try{
 await walk(['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
 await prepare('trace');await act('record-book',{type:'campaign-read',stage:'trace'});await act('record-book',{type:'campaign-decide',stage:'trace',selection:0})
 await walk(['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar'])
 await prepare('parcel');await act('photo-folder',{type:'campaign-read',stage:'parcel'});await act('photo-folder',{type:'campaign-decide',stage:'parcel',selection:'leave'})
 await prepare('archive');await act('photo-folder',{type:'campaign-plan',stage:'archive'});await walk(['archive'])
 await act('archive-index',{type:'campaign-observe',stage:'archive'});await act('archive-ledger',{type:'campaign-observe',stage:'archive'})
 if(process.env.OLDSTREET_QA_LEDGER_SITE){
  const shelf=oldStreetSpatialPlan(h.save).entities.find(e=>e.id==='archive-ledger')!
  authority.checkpoint(owner,id,{sceneId:h.sceneId,expected_version:h.version,position:shelf.approach})
  console.log(JSON.stringify({scene:h.sceneId,version:h.version,ledgerSite:h.campaign?.archive?.content.ledgerSite,setup:'Synthetic loan route via normal authority actions; renderer begins at the loan slip, before visiting the off-site log.'}))
  process.exitCode=0
 }else if(replay){
  const a=h.campaign!.archive!
  await act('archive-desk',{type:'campaign-decide',stage:'archive',order:archiveOrders([...a.content.sources.index,...a.content.sources.ledger])[0]})
  await walk(['cellar','yard','street','photo'])
  await act('viewing-table',{type:'expansion-request',template:'photo-darkroom-v1',text:'Find the related photograph',followArchive:true})
  expansions.enqueue(owner,id);await expansions.run(owner,id)
  await act('viewing-table',{type:'expansion-activate'});await walk(['darkroom'])
  media.start(owner,id);await media.run(owner,id,async()=>new Uint8Array(readFileSync(replay)))
 }
 if(!process.env.OLDSTREET_QA_LEDGER_SITE){
 const desk=oldStreetSpatialPlan(h.save).entities.find(e=>e.id===(replay?'developing-bench':'archive-desk'))!
 authority.checkpoint(owner,id,{sceneId:h.sceneId,expected_version:h.version,position:desk.approach})
 console.log(JSON.stringify({scene:h.sceneId,version:h.version,archiveObserved:h.campaign?.archive?.examined,archiveSolved:!!h.campaign?.archive?.order,setup:replay?'Normal authority actions to the developing bench; archived photo replay; no model or media calls':'Normal authority actions; renderer walkthrough begins at the sorting table; no model or media calls'}))
 }
}finally{raw.close()}
