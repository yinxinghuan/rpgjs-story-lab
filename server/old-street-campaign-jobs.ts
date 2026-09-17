import {readFieldContent,type FieldContent} from '../src/old-street-field-inquiry'
import type {AuthorityStorage} from './session-authority'
import type {OldStreetHead} from '../src/old-street-head'
import {readTraceContent,readParcelContent,type CampaignContext,type TraceContent,type ParcelContent} from '../src/old-street-campaign'
import type {OldStreetCampaignGenerator} from './old-street-campaign-planner'
import {LabError} from '../src/journey-runtime'
import {readArchiveContent,type ArchiveContent} from '../src/old-street-archive'
import {isPreparedInvestigation,readPreparedInvestigation} from './old-street-investigation-draft'
export type CampaignStage='trace'|'parcel'|'archive'|'field'
type Stage=CampaignStage
export type CampaignJob={stage:Stage;state:'queued'|'planning'|'ready'|'failed';attempt:number;deadline:number;context:CampaignContext;content?:TraceContent|ParcelContent|ArchiveContent|FieldContent}
export function campaignJobContext(h:OldStreetHead,stage:Stage):CampaignContext{
 if(!h.campaign||!h.save.facts['letter-taken']||!['trace','parcel','archive','field'].includes(stage))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 if(stage==='field'){const a=h.campaign.archive;if(!a?.order)throw new LabError('CAMPAIGN_OBSERVATION_REQUIRED',409);return {stage,locale:h.save.locale,account:a.content.discovery,events:a.order.map(id=>a.content.cards.find(c=>c.id===id)!.label)}}
 if(stage==='trace')return {stage,locale:h.save.locale}
 const trace=h.campaign.trace
 if(trace?.selected===undefined)throw new LabError('CAMPAIGN_TRACE_REQUIRED',409)
 if(stage==='archive'){
  if(h.campaign.version<2||!h.campaign.parcel?.observed)throw new LabError('CAMPAIGN_PAPERS_REQUIRED',409)
  return {stage,locale:h.save.locale,previous:structuredClone(trace.content.records[trace.selected]),papers:structuredClone(h.campaign.parcel.content)}
 }
 return {stage,locale:h.save.locale,previous:structuredClone(trace.content.records[trace.selected]),...(h.campaign.version>=2?{investigation:true as const}:{})}
}
/** Sidecar draft only: movement/ordinary actions continue during generation. */
export class OldStreetCampaignJobs{
 constructor(private db:AuthorityStorage,private head:(owner:string,id:string)=>OldStreetHead,private produce:OldStreetCampaignGenerator,private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_campaign_jobs(owner TEXT NOT NULL,journey TEXT NOT NULL,stage TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,stage))')
 }
 private write(owner:string,id:string,job:CampaignJob){this.db.run('INSERT OR REPLACE INTO oldstreet_campaign_jobs VALUES(?,?,?,?)',owner,id,job.stage,JSON.stringify(job))}
 private read(owner:string,id:string,stage:Stage){
  const row=this.db.all<{data:string}>('SELECT data FROM oldstreet_campaign_jobs WHERE owner=? AND journey=? AND stage=?',owner,id,stage)[0]
  if(!row)return null
  const job=JSON.parse(row.data) as CampaignJob
  if((job.state==='planning'||job.state==='queued')&&job.deadline<=this.now()){job.state='failed';this.write(owner,id,job)}
  return job
 }
 get(owner:string,id:string,stage:Stage){campaignJobContext(this.head(owner,id),stage);return this.read(owner,id,stage)}
 candidateFor(h:OldStreetHead,stage:Stage){
  const context=campaignJobContext(h,stage)
  const rows=this.db.all<{data:string}>('SELECT data FROM oldstreet_campaign_jobs WHERE journey=? AND stage=?',h.id,stage)
  if(rows.length!==1)return
  const job=JSON.parse(rows[0].data) as CampaignJob
  if(job.state==='ready'&&JSON.stringify(context)===JSON.stringify(job.context))return job.content
 }
 enqueue(owner:string,id:string,stage:Stage,retry=false){
  const head=this.head(owner,id),context=campaignJobContext(head,stage)
  if(head.save.facts.departed)throw new LabError('OLD_STREET_JOURNEY_COMPLETE',409)
  return this.db.transaction(()=>{
   const old=this.read(owner,id,stage)
   if(old&&!(retry&&old.state==='failed'))return old
   const job:CampaignJob={stage,state:'queued',attempt:(old?.attempt??0)+1,deadline:this.now()+25000,context}
   this.write(owner,id,job);return job
  })
 }
 async run(owner:string,id:string,stage:Stage){
  const context=campaignJobContext(this.head(owner,id),stage)
  const claimed=this.db.transaction(()=>{const j=this.read(owner,id,stage);if(j?.state!=='queued')return null;j.state='planning';j.deadline=this.now()+25000;this.write(owner,id,j);return j})
  if(!claimed)return this.get(owner,id,stage)
  try{
   const signal=AbortSignal.timeout(22000),raw=await this.produce(context,signal);signal.throwIfAborted()
   const prepared=isPreparedInvestigation(raw)?readPreparedInvestigation(raw):undefined
   if(prepared&&(context.stage!=='parcel'||!context.investigation))throw Error('CAMPAIGN_INVESTIGATION_CONTEXT_INVALID')
   const content=prepared?prepared.parcel:stage==='trace'?readTraceContent(raw):stage==='parcel'?readParcelContent(raw):stage==='field'?readFieldContent(raw):readArchiveContent(raw)
   // Authority reads may run their own upgrade transaction. Read immediately
   // before this synchronous commit, with no asynchronous gap between them.
   const latest=prepared?this.head(owner,id):undefined
   this.db.transaction(()=>{
    const j=this.read(owner,id,stage)
    if(j?.state!=='planning'||j.attempt!==claimed.attempt)return
    if(prepared&&context.stage==='parcel'){
     if(JSON.stringify(campaignJobContext(latest!,stage))!==JSON.stringify(context)||latest!.campaign?.parcel||this.read(owner,id,'archive'))throw Error('CAMPAIGN_INVESTIGATION_ALREADY_ADMITTED')
     // Commit the pair together; archive access still requires reading the
     // parcel. Preparation does not grant knowledge, open doors or move actors.
     this.write(owner,id,{stage:'archive',state:'ready',attempt:1,deadline:0,context:{stage:'archive',locale:context.locale,previous:context.previous,papers:prepared.parcel},content:prepared.archive})
    }
    this.write(owner,id,{...j,state:'ready',deadline:0,content})
   })
  }catch{
   this.db.transaction(()=>{const j=this.read(owner,id,stage);if(j?.state==='planning'&&j.attempt===claimed.attempt)this.write(owner,id,{...j,state:'failed',deadline:0})})
  }
  return this.get(owner,id,stage)
 }
}
