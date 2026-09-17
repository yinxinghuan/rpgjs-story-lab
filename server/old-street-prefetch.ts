import type {OldStreetHead} from '../src/old-street-head'
import type {OldStreetCampaignJobs} from './old-street-campaign-jobs'

/** Committed milestones schedule drafts, never story commands. No automatic
 * retries, optional field generation or new behavior for previous journeys. */
export function prepareNextStreetContent(owner:string,result:{accepted?:boolean;head?:OldStreetHead},jobs:OldStreetCampaignJobs|undefined,background:(work:Promise<unknown>)=>void){
 const h=result.head,c=h?.campaign
 if(!jobs||!result.accepted||!h||h.save.facts.departed||c?.photoSource!=='roof-negative-v1'||!h.save.facts['letter-taken'])return
 const stage=!c.trace?'trace':c.trace.selected!==undefined&&!c.parcel?'parcel':undefined
 if(!stage)return
 // The action has already committed. An unavailable draft store must not turn
 // its successful receipt into an ambiguous failure; the normal UI can retry.
 try{
  const job=jobs.enqueue(owner,h.id,stage)
  if(job.state==='queued')background(jobs.run(owner,h.id,stage).catch(()=>{}))
 }catch{/* Opening the material retains its explicit preparation/retry path. */}
}
