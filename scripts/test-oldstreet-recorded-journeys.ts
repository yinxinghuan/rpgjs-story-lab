/** Replay two accepted provider stories through ordinary Session/jobs and real
 * spatial paths. Optional live media uses the existing platform adapter only.
 * Fresh synthetic journeys; never reads a player save. Not renderer evidence. */
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {existsSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {isDeepStrictEqual} from 'node:util'
import {randomUUID} from 'node:crypto'
import {OldStreetAuthority,oldStreetRuntime,type OldStreetHead} from '../server/old-street-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {OldStreetExpansionJobs} from '../server/old-street-expansion-jobs'
import {OldStreetExpansionMedia,expansionPhotoProducer} from '../server/old-street-expansion-media'
import {compileExpansionPlan} from '../src/old-street-expansion-plan'
import {oldStreetDoors,oldStreetSpatialPlan,oldStreetPath} from '../src/old-street-space'
import {archiveOrders,archiveRackState} from '../src/old-street-archive'
import {campaignRecordMatches,campaignComplete,type CampaignContext} from '../src/old-street-campaign'
import {developingTarget} from '../src/old-street-developing-puzzle'
import {chooseInvestigationRoute} from '../src/old-street-investigation-route'

const [input,out]=process.argv.slice(2),resume=process.argv.includes('--resume-media')
if(!input||!out||existsSync(out)!==resume||!process.argv.includes('--live-media'))throw Error('NEW_OUTPUT_OR_EXPLICIT_MEDIA_RESUME_REQUIRED')
const source=JSON.parse(readFileSync(input,'utf8'))
assert.equal(source.chains.length,2);assert.ok(source.chains.every((c:any)=>c.complete));assert.ok(source.finishedAt)
mkdirSync(out,{recursive:true})
const raw=new DatabaseSync(out+'/journeys.sqlite')
const db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:f=>{raw.exec('BEGIN IMMEDIATE');try{const v=f();raw.exec('COMMIT');return v}catch(e){raw.exec('ROLLBACK');throw e}}}
const report:any=resume?JSON.parse(readFileSync(out+'/report.json','utf8')):{source:input,scope:'Two recorded real model stories, fresh synthetic authority journeys and live platform photographs. No browser/player data. Path checks are not rendered play or pacing evidence.',startedAt:new Date().toISOString(),finishedAt:null,runs:[]}
assert.equal(report.source,input)
const persist=()=>writeFileSync(out+'/report.json',JSON.stringify(report,null,2)+'\n')
persist()
try{
 for(const chain of [1,2]){
  const run:any=resume?report.runs.find((r:any)=>r.chain===chain):{chain,actions:[],media:[],complete:false};assert.ok(run)
  if(run.complete)continue
  if(resume){run.priorErrors=[...(run.priorErrors??[]),run.error];delete run.error;run.resumedAt=new Date().toISOString()}else report.runs.push(run)
  persist()
  const owner='synthetic-recorded-chain-'+chain,id='synthetic-route-trial-'+chain
  let jobs:OldStreetCampaignJobs,expansions:OldStreetExpansionJobs,media:OldStreetExpansionMedia
  const make=()=>new OldStreetAuthority(db,()=>true,undefined,undefined,h=>expansions?.candidateFor(h),h=>media?.candidateFor(h),undefined,undefined,(h,stage)=>jobs?.candidateFor(h,stage))
  let authority=make()
  const recorded=async(context:CampaignContext)=>{
   const row=source.cases.find((r:any)=>r.chain===chain&&r.stage===context.stage&&r.accepted)
   assert.ok(row&&isDeepStrictEqual(row.context,context),'Recorded generation must exactly match the Session context')
   return row.preparedArchive?{kind:'prepared-investigation',parcel:structuredClone(row.accepted),archive:structuredClone(row.preparedArchive)}:structuredClone(row.accepted)
  }
  jobs=new OldStreetCampaignJobs(db,(o,j)=>authority.get(o,j),recorded)
  expansions=new OldStreetExpansionJobs(db,(o,j)=>authority.get(o,j),async(intent,locale)=>{
   const row=source.photos.find((r:any)=>r.chain===chain&&r.plan)
   assert.ok(row&&intent.archiveSource&&isDeepStrictEqual({...intent.archiveSource,archiveId:row.source.archiveId},row.source),'Photo source must preserve this exact investigation')
   const {title,discovery,photograph}=row.plan.content
   return compileExpansionPlan(intent,{title,discovery,photograph},locale)
  })
  media=new OldStreetExpansionMedia(db,(o,j)=>authority.get(o,j),h=>expansions.candidateFor(h))
  let h=resume?authority.get(owner,id):oldStreetRuntime(()=>true,undefined,undefined,()=>undefined,()=>undefined,undefined,recorded).initial('en',id,{campaign:'letter-trail-v3'})
  assert.equal(h.campaign!.explorationRoute,chooseInvestigationRoute(id))
  if(!resume)db.run('INSERT INTO journeys VALUES(?,?,?,?,?,?,?)',id,owner,randomUUID(),'synthetic-initializer',JSON.stringify(h),0,Date.now())
  run.journey=id;run.route=h.campaign!.explorationRoute;persist()
  const send=async(target:string,extra:any)=>{
   const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.id===target)
   assert.ok(entity,'Current entity '+target)
   const path=oldStreetPath(h.sceneId as any,h.position,entity.approach,h.save)
   assert.ok(path.length,'Reachable '+h.sceneId+'/'+target)
   const body={action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:path.at(-1),target,...extra}
   const response=await authority.action(owner,id,body);h=response.head
   run.actions.push({version:h.version,scene:h.sceneId,target,...extra,text:response.text});persist()
   return {body,response}
  }
  const steps=async(route:string[])=>{for(const step of route){
   const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)?.actionId
   assert.ok(action,'Natural door to '+step)
   const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!
   await send(entity.id,{type:'action',action})
  }}
  const prepare=async(stage:'trace'|'parcel'|'archive')=>{jobs.enqueue(owner,id,stage);await jobs.run(owner,id,stage);assert.equal(jobs.get(owner,id,stage)?.state,'ready')}
  try{
   if(!resume){
   await steps(['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
   if(chain===2)await steps(['oldstreet:move-box','oldstreet:take-lens'])
   await prepare('trace');await send('record-book',{type:'campaign-read',stage:'trace'})
   const trace=h.campaign!.trace!.content
   await send('record-book',{type:'campaign-decide',stage:'trace',selection:trace.records.findIndex((_,i)=>campaignRecordMatches(trace,i))})
   await steps(['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar'])
   await prepare('parcel');await send('photo-folder',{type:'campaign-read',stage:'parcel'})
   await send('photo-folder',{type:'campaign-decide',stage:'parcel',selection:chain===1?'take':'leave'})
   await prepare('archive');await send('photo-folder',{type:'campaign-plan',stage:'archive'});await steps(['archive'])
   writeFileSync(out+`/chain-${chain}-archive-head.json`,JSON.stringify(h))
   if(archiveRackState(h.save.facts)?.slide)await send('archive-rack',{type:'campaign-decide',stage:'archive',selection:'slide'})
   for(const evidence of ['index','ledger'] as const){
    const content=h.campaign!.archive!.content,target='archive-'+evidence
    if(evidence==='ledger'&&content.ledgerSite){
     await send(target,{type:'campaign-observe',stage:'archive'})
     assert.equal(h.campaign!.archive!.examined.includes('ledger'),false)
     await steps(content.ledgerSite==='photo'?['cellar','yard','street','photo']:['cellar','yard','laundry'])
     await send(content.ledgerSite==='photo'?'viewing-table':'clock-display',{type:'campaign-observe',stage:'archive'})
     await steps(content.ledgerSite==='photo'?['street','yard','cellar','archive']:['yard','cellar','archive'])
    }else if(content.denseSource===evidence){
     if(chain===2)await send(target,{type:'campaign-decide',stage:'archive',selection:'read-lens'})
     else {await send(target,{type:'campaign-decide',stage:'archive',selection:'carry-sheet'});await send('archive-desk',{type:'campaign-decide',stage:'archive',selection:'spread-sheet'})}
    }else await send(target,{type:'campaign-observe',stage:'archive'})
   }
   const archive=h.campaign!.archive!.content,order=archiveOrders([...archive.sources.index,...archive.sources.ledger])[0]
   await send('archive-desk',{type:'campaign-decide',stage:'archive',order})
   const saved=structuredClone(h.campaign);authority=make();h=authority.get(owner,id);assert.deepEqual(h.campaign,saved)
   await steps(['cellar','yard','laundry','oldstreet:return-trolley','yard','shop'])
   if(chain===1)await send('record-book',{type:'campaign-decide',stage:'trace',selection:'share'})
   await steps(['street','photo'])
   await send('viewing-table',{type:'expansion-request',template:'photo-darkroom-v1',followArchive:true,text:'Find the related photograph'})
   expansions.enqueue(owner,id);await expansions.run(owner,id);assert.equal(expansions.get(owner,id)?.state,'candidate')
   await send('viewing-table',{type:'expansion-activate'});await steps(['darkroom'])
   writeFileSync(out+`/chain-${chain}-before-photo-head.json`,JSON.stringify(h))
   }else assert.ok(h.sceneId==='darkroom'&&!h.save.facts['darkroom-photo-matched'],'Resume only the unfinished media stage')
   media.start(owner,id)
   const producer=expansionPhotoProducer()
   await media.run(owner,id,async(job,onTask)=>{
    const entry:any={requestId:job.requestId,prompt:job.prompt,startedAt:new Date().toISOString()};run.media.push(entry);persist()
    let bytes:Uint8Array
    try{bytes=await producer(job,taskId=>{entry.taskId=taskId;onTask(taskId);persist()})}catch(e){entry.error=String(e);persist();throw e}
    writeFileSync(out+`/chain-${chain}.png`,bytes);entry.finishedAt=new Date().toISOString();persist();return bytes
   })
   const state=media.get(owner,id);run.mediaState=state;persist();assert.equal(state?.state,'candidate')
   const hash=media.candidateFor(h)!;assert.ok(hash)
   writeFileSync(out+`/chain-${chain}-ready-photo-head.json`,JSON.stringify(h))
   const matched=await send('developing-bench',{type:'expansion-photo-match',photoMatch:{version:hash,method:'develop-v1',...developingTarget(hash)}})
   assert.deepEqual(await authority.action(owner,id,matched.body),matched.response)
   assert.equal(campaignComplete(h.campaign!,h.save.facts),false)
   await send('developing-bench',{type:'expansion-photo-decision',decision:chain===1?'keep':'leave'})
   assert.equal(campaignComplete(h.campaign!,h.save.facts),true)
   await steps(['photo','roof','shed','oldstreet:return-key','yard','street','oldstreet:leave'])
   authority=make();h=authority.get(owner,id)
   assert.equal(h.save.finale?.status,'complete')
   assert.equal(h.save.facts['darkroom-photo-choice'],chain===1?'keep':'leave')
   run.complete=true;run.finalVersion=h.version;run.ending=h.save.finale;persist()
  }catch(error){run.error=error instanceof Error?error.stack:String(error);persist();process.exitCode=1}
 }
}finally{report.finishedAt=new Date().toISOString();persist();raw.close();console.log(JSON.stringify(report.runs.map((r:any)=>({chain:r.chain,complete:r.complete,actions:r.actions.length,error:r.error,media:r.mediaState?.state}))))}
