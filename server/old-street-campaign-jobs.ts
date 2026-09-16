import type {AuthorityStorage} from './session-authority'
import type {OldStreetHead} from '../src/old-street-head'
import {readTraceContent,readParcelContent,type CampaignContext,type TraceContent,type ParcelContent} from '../src/old-street-campaign'
import type {OldStreetCampaignGenerator} from './old-street-campaign-planner'
import {LabError} from '../src/journey-runtime'
type Stage='trace'|'parcel'
export type CampaignJob={stage:Stage;state:'queued'|'planning'|'ready'|'failed';attempt:number;deadline:number;context:CampaignContext;content?:TraceContent|ParcelContent}
export function campaignJobContext(h:OldStreetHead,stage:Stage):CampaignContext{
 if(!h.campaign||!h.save.facts['letter-taken']||!['trace','parcel'].includes(stage))throw new LabError('CAMPAIGN_ACTION_UNAVAILABLE',409)
 if(stage==='trace')return {stage,locale:h.save.locale}
 const trace=h.campaign.trace
 if(trace?.selected===undefined)throw new LabError('CAMPAIGN_TRACE_REQUIRED',409)
 return {stage,locale:h.save.locale,previous:structuredClone(trace.content.records[trace.selected])}
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
   const content=stage==='trace'?readTraceContent(raw):readParcelContent(raw)
   this.db.transaction(()=>{const j=this.read(owner,id,stage);if(j?.state==='planning'&&j.attempt===claimed.attempt)this.write(owner,id,{...j,state:'ready',deadline:0,content})})
  }catch{
   this.db.transaction(()=>{const j=this.read(owner,id,stage);if(j?.state==='planning'&&j.attempt===claimed.attempt)this.write(owner,id,{...j,state:'failed',deadline:0})})
  }
  return this.get(owner,id,stage)
 }
}
