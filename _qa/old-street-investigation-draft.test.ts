import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {compilePreparedInvestigation} from '../server/old-street-investigation-draft'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {oldStreetRuntime} from '../server/old-street-runtime'
import {archiveOrders} from '../src/old-street-archive'
import type {AuthorityStorage} from '../server/session-authority'
const record={label:'The footbridge reopened',mark:'two notches',wrapping:'linen cord'}
const draft={title:'Footbridge repairs',fragment:'An undated note lists the bridge reopening and a damage survey.',recordAt:'end',events:['The damaged boards were surveyed','Replacement boards were cut','The new boards were fitted'],roomPlan:{indexSide:'right',storageShelves:1,rack:'left'}}
const bundle=()=>compilePreparedInvestigation(draft,record,'en',42)
function harness(){
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN');try{const result=f();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}
 // Explicit isolated unit state; full authority admission is covered separately.
 const head=oldStreetRuntime(()=>true).initial('en',randomUUID())
 head.save.facts['letter-taken']=true
 head.campaign={version:2,trace:{id:randomUUID(),observed:true,selected:0,content:{title:'Records',clue:{mark:record.mark,wrapping:record.wrapping},records:[record]}}}
 return {raw,db,head}
}
test('one prepared episode keeps the fixed event at its authored endpoint and distributes the same chronology',()=>{
 const {parcel,archive}=bundle()
 const order=archiveOrders([...archive.sources.index,...archive.sources.ledger])[0]
 assert.deepEqual(order.map(id=>archive.cards.find(c=>c.id===id)!.label),[...draft.events,record.label])
 assert.equal(parcel.inquiry?.first,record.label)
 assert.equal(parcel.inquiry?.second,draft.events[0])
 assert.equal(archiveOrders(archive.sources.index).length>1,true)
 assert.deepEqual(compilePreparedInvestigation({...draft,events:[...draft.events,record.label]},record,'en',42).parcel,parcel)
 assert.throws(()=>compilePreparedInvestigation({...draft,events:[...draft.events,'A different repair']},record,'en'),/INVESTIGATION_INVALID/)
 assert.ok(!parcel.fragment.includes('before'))
})
test('expired paired preparation cannot replace either half of a newer episode; reopening reuses the saved archive',async()=>{
 const {raw,db,head}=harness();let now=1000,calls=0,finish!:(v:unknown)=>void
 const older=bundle(),newer=compilePreparedInvestigation({...draft,title:'A second draft'},record,'en',97)
 const produce=async()=>{calls++;return calls===1?new Promise(resolve=>{finish=resolve}):newer}
 let jobs=new OldStreetCampaignJobs(db,()=>head,produce,()=>now)
 try{
  jobs.enqueue('synthetic',head.id,'parcel');const pending=jobs.run('synthetic',head.id,'parcel')
  now+=26000;assert.equal(jobs.get('synthetic',head.id,'parcel')?.state,'failed')
  jobs.enqueue('synthetic',head.id,'parcel',true);await jobs.run('synthetic',head.id,'parcel')
  finish(older);await pending
  assert.deepEqual(jobs.get('synthetic',head.id,'parcel')?.content,newer.parcel)
  assert.throws(()=>jobs.get('synthetic',head.id,'archive'),/PAPERS_REQUIRED/)
  head.campaign!.parcel={id:randomUUID(),observed:true,content:newer.parcel}
  jobs=new OldStreetCampaignJobs(db,()=>head,produce,()=>now)
  jobs.enqueue('synthetic',head.id,'archive');await jobs.run('synthetic',head.id,'archive')
  assert.deepEqual(jobs.candidateFor(head,'archive'),newer.archive)
  assert.equal(calls,2);assert.equal(head.campaign!.archive,undefined)
 }finally{raw.close()}
})
test('legacy observed paper generates only its archive and retains the existing opening',async()=>{
 const {raw,db,head}=harness();const prepared=bundle();let calls=0
 head.campaign!.parcel={id:randomUUID(),observed:true,content:prepared.parcel}
 const before=structuredClone(head)
 const jobs=new OldStreetCampaignJobs(db,()=>head,async context=>{calls++;assert.equal(context.stage,'archive');return prepared.archive})
 try{
  jobs.enqueue('synthetic',head.id,'archive');await jobs.run('synthetic',head.id,'archive')
  assert.deepEqual(jobs.candidateFor(head,'archive'),prepared.archive)
  assert.deepEqual(head,before);assert.equal(calls,1)
 }finally{raw.close()}
})

test('recorded real complete accounts compile without another model request or a false missing-date claim',async()=>{
 const {readFileSync}=await import('node:fs')
 const report=JSON.parse(readFileSync(new URL('../doc/campaign-live-20260917/prepared-investigation-attempt-3.json',import.meta.url),'utf8'))
 const cases=report.cases.filter((c:any)=>c.stage==='parcel')
 assert.equal(cases.length,2)
 for(const c of cases){
  const compiled=compilePreparedInvestigation(c.raw,c.context.previous,'en',42)
  const order=archiveOrders([...compiled.archive.sources.index,...compiled.archive.sources.ledger])[0]
  assert.deepEqual(order.map(id=>compiled.archive.cards.find(event=>event.id===id)!.label),c.raw.events)
  assert.ok(!compiled.parcel.fragment.includes('Neither gives a date'))
 }
})
