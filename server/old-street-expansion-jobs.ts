import type {AuthorityStorage} from './session-authority'
import type {OldStreetHead} from '../src/old-street-head'
import type {ExpansionPlan} from '../src/old-street-expansion-plan'
import type {OldStreetExpansionRequest} from '../src/old-street-expansion'
import {LabError} from '../src/journey-runtime'
export type ExpansionJob={id:string;state:'queued'|'planning'|'candidate'|'failed';attempt:number;deadline:number;plan?:ExpansionPlan;error?:'PLAN_INTERRUPTED'|'PLAN_FAILED'}
type Producer=(intent:OldStreetExpansionRequest,locale:'zh'|'en',signal:AbortSignal)=>Promise<ExpansionPlan>
/** Draft jobs use the same database and journey ownership, but never replace the save. */
export class OldStreetExpansionJobs{
 constructor(private db:AuthorityStorage,private head:(owner:string,id:string)=>OldStreetHead,private produce:Producer,private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_expansion_jobs(owner TEXT NOT NULL,journey TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,id))')
 }
 private intent(owner:string,journey:string){const h=this.head(owner,journey),intent=h.expansions?.[0];if(!intent)throw new LabError('EXPANSION_NOT_REQUESTED',409);return {h,intent}}
 private write(owner:string,journey:string,job:ExpansionJob){this.db.run('INSERT OR REPLACE INTO oldstreet_expansion_jobs VALUES(?,?,?,?)',owner,journey,job.id,JSON.stringify(job))}
 get(owner:string,journey:string):ExpansionJob|null{
  const {intent}=this.intent(owner,journey);return this.read(owner,journey,intent.id)
 }
 private read(owner:string,journey:string,id:string):ExpansionJob|null{
  const row=this.db.all<{data:string}>('SELECT data FROM oldstreet_expansion_jobs WHERE owner=? AND journey=? AND id=?',owner,journey,id)[0]
  if(!row)return null
  const j=JSON.parse(row.data) as ExpansionJob
  if(j.state==='planning'&&j.deadline<=this.now()){j.state='failed';j.error='PLAN_INTERRUPTED';this.write(owner,journey,j)}
  return j
 }
 enqueue(owner:string,journey:string,retry=false){
  const {h,intent}=this.intent(owner,journey)
  if(h.save.facts.departed)throw new LabError('OLD_STREET_JOURNEY_COMPLETE',409)
  return this.db.transaction(()=>{
   const old=this.read(owner,journey,intent.id)
   if(old&&!(retry&&old.state==='failed'))return old
   if(old&&old.attempt>=2)throw new LabError('EXPANSION_ATTEMPT_LIMIT',409)
   const job:ExpansionJob={id:intent.id,state:'queued',attempt:(old?.attempt??0)+1,deadline:0};this.write(owner,journey,job);return job
  })
 }
 async run(owner:string,journey:string){
  const {h,intent}=this.intent(owner,journey)
  const claimed=this.db.transaction(()=>{const j=this.read(owner,journey,intent.id);if(!j||j.state!=='queued')return null;j.state='planning';j.deadline=this.now()+25000;this.write(owner,journey,j);return j})
  if(!claimed)return this.get(owner,journey)
  const signal=AbortSignal.timeout(22000)
  try{
   const plan=await this.produce(intent,h.save.locale,signal);signal.throwIfAborted()
   if(plan.requestId!==intent.id||plan.template!==intent.template)throw Error('PLAN_MISMATCH')
   this.db.transaction(()=>{const current=this.read(owner,journey,intent.id);if(current?.state==='planning'&&current.attempt===claimed.attempt)this.write(owner,journey,{...current,state:'candidate',deadline:0,plan})})
  }catch{
   this.db.transaction(()=>{const current=this.read(owner,journey,intent.id);if(current?.state==='planning'&&current.attempt===claimed.attempt)this.write(owner,journey,{...current,state:'failed',deadline:0,error:'PLAN_FAILED'})})
  }
  return this.get(owner,journey)
 }
}
