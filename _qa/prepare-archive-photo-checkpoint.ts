/** Prepare the new section using normal authority actions, not save injection.
 * ONLY the previously created synthetic map-QA database is opened. This is not
 * movement evidence for the earlier rooms; browser QA starts at the shelf. */
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OldStreetAuthority} from '../server/old-street-runtime'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {oldStreetDoors,oldStreetSpatialPlan} from '../src/old-street-space'
import type {AuthorityStorage} from '../server/session-authority'
import {photoCampaignFixture as campaignFixture} from './archive-photo-fixture'
import {campaignRecordMatches} from '../src/old-street-campaign'
const raw=new DatabaseSync('.data/archive-photo-playtest-20260917/journeys.sqlite',{open:true})
raw.exec('PRAGMA busy_timeout=5000')
try{
 const owners=raw.prepare('SELECT DISTINCT owner FROM journeys').all() as Array<{owner:string}>
 if(owners.length!==1)throw Error('EXPECTED_SINGLE_SYNTHETIC_QA_OWNER')
 const owner=owners[0].owner,db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN IMMEDIATE');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 let jobs:OldStreetCampaignJobs
 const s=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,undefined,undefined,(h,stage)=>jobs.candidateFor(h,stage))
 jobs=new OldStreetCampaignJobs(db,(o,id)=>s.get(o,id),campaignFixture)
 let h=s.create(owner,process.argv[2]??'archive-map-checkpoint-20260917','en',{campaign:'letter-trail-v2'})
 const send=async(target:string,extra:any)=>{const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.id===target)!;h=(await s.action(owner,h.id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:entity.approach,target,...extra})).head}
 const steps=async(route:string[])=>{for(const step of route){const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId;const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;await send(e.id,{type:'action',action})}}
 if(h.version===0){
  await steps(['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
 }
 if(!h.campaign?.trace){
  jobs.enqueue(owner,h.id,'trace',true);await jobs.run(owner,h.id,'trace')
  await send('record-book',{type:'campaign-read',stage:'trace'});await send('record-book',{type:'campaign-decide',stage:'trace',selection:h.campaign!.trace!.content.records.findIndex((_,i)=>campaignRecordMatches(h.campaign!.trace!.content,i))})
 }
 if(!h.campaign?.parcel){
  await steps(['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar'])
  jobs.enqueue(owner,h.id,'parcel');await jobs.run(owner,h.id,'parcel')
  await send('photo-folder',{type:'campaign-read',stage:'parcel'});await send('photo-folder',{type:'campaign-decide',stage:'parcel',selection:'leave'})
 }
 // Optional room checkpoint uses ordinary admission and door actions. This
 // prepares a distinct sample, not browser movement evidence for its arrival.
 if(!h.campaign?.archive){
  jobs.enqueue(owner,h.id,'archive');await jobs.run(owner,h.id,'archive')
  await send('photo-folder',{type:'campaign-plan',stage:'archive'});await steps(['archive'])
 }
 if(!h.campaign?.archive?.order){
  await send('archive-index',{type:'campaign-observe',stage:'archive'})
  await send('archive-ledger',{type:'campaign-observe',stage:'archive'})
  await send('archive-desk',{type:'campaign-decide',stage:'archive',order:['a','b','c','d']})
  await steps(['cellar','yard','shop','street','photo'])
 }
 console.log(JSON.stringify({scene:h.sceneId,version:h.version,campaignVersion:h.campaign?.version,archiveAdmitted:!!h.campaign?.archive,remoteCalls:0}))
}finally{raw.close()}
