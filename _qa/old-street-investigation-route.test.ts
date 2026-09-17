import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {chooseInvestigationRoute,investigationRoutePlan} from '../src/old-street-investigation-route'
import {oldStreetRuntime} from '../server/old-street-runtime'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {compilePreparedInvestigation,readPreparedInvestigation} from '../server/old-street-investigation-draft'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import type {AuthorityStorage} from '../server/session-authority'
const previous={label:'The footbridge reopened',mark:'two notches',wrapping:'linen cord'}
const draft={title:'Bridge repairs',recordAt:'end',events:['Damaged boards were surveyed','Replacement boards were cut','New boards were fitted','The footbridge reopened'],denseSource:'index',ledgerSite:'photo',roomPlan:{indexSide:'right',storageShelves:1,rack:'left'}}

test('new journey schedules one supported route; reload and legacy upgrade do not reroll it',()=>{
 const runtime=oldStreetRuntime(()=>true,undefined,undefined,()=>undefined,()=>undefined,undefined,async()=>({}))
 const routes=new Set<string>()
 for(let n=1;n<=12;n++){
  const id='synthetic-route-trial-'+n,head=runtime.initial('en',id,{campaign:'letter-trail-v3'})
  routes.add(head.campaign!.explorationRoute!)
  assert.equal(head.campaign!.explorationRoute,chooseInvestigationRoute(id))
  assert.equal(runtime.upgrade(JSON.parse(JSON.stringify(head))).campaign!.explorationRoute,head.campaign!.explorationRoute)
  delete head.campaign!.explorationRoute
  assert.equal(runtime.upgrade(head).campaign!.explorationRoute,undefined)
 }
 assert.equal(routes.size,3)
 assert.equal(runtime.initial('en',randomUUID(),{campaign:'letter-trail-v2'}).campaign!.explorationRoute,undefined)
})

test('model correction keeps the same planned route, and rejects two incompatible drafts',async()=>{
 const context={stage:'parcel' as const,locale:'en' as const,previous,investigation:true as const,route:'studio-loan-v1' as const}
 const requests:any[]=[]
 const planner=createOldStreetCampaignPlanner(async(_system,input)=>{
  const data=JSON.parse(input);requests.push(data)
  if(!data.stage)return {valid:true,issues:[]}
  return {...draft,ledgerSite:data.repair?'photo':'archive'}
 },{recordDrivenInquiry:true})
 const prepared=readPreparedInvestigation(await planner(context,AbortSignal.timeout(5000)))
 assert.equal(prepared.archive.ledgerSite,'photo')
 const authors=requests.filter(r=>r.stage)
 assert.equal(authors.length,2)
 assert.deepEqual(authors[0].explorationPlan,investigationRoutePlan(context.route))
 assert.deepEqual(authors[0].explorationPlan,authors[1].explorationPlan)
 assert.match(authors[1].repair.issues[0],/ROUTE_MISMATCH/)
 let calls=0
 await assert.rejects(createOldStreetCampaignPlanner(async()=>{calls++;return {...draft,ledgerSite:'archive'}},{recordDrivenInquiry:true})(context,AbortSignal.timeout(5000)),/ROUTE_MISMATCH/)
 assert.equal(calls,2)
})

test('failed preparation can retry the fixed route; restored jobs keep the pair without granting evidence',async()=>{
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(sql,...args)=>raw.prepare(sql).all(...args) as any,run:(sql,...args)=>{raw.prepare(sql).run(...args)},transaction:f=>{raw.exec('BEGIN');try{const value=f();raw.exec('COMMIT');return value}catch(error){raw.exec('ROLLBACK');throw error}}}
 const head=oldStreetRuntime(()=>true).initial('en',randomUUID())
 head.save.facts['letter-taken']=true
 head.campaign={version:3,explorationRoute:'studio-loan-v1',trace:{id:randomUUID(),observed:true,selected:0,content:{title:'Records',clue:{mark:previous.mark,wrapping:previous.wrapping},records:[previous]}}}
 let calls=0
 const produce=async(context:any)=>{assert.equal(context.route,'studio-loan-v1');calls++;return compilePreparedInvestigation({...draft,ledgerSite:calls===1?'archive':'photo'},previous,'en',42)}
 let jobs=new OldStreetCampaignJobs(db,()=>head,produce)
 try{
  jobs.enqueue('synthetic',head.id,'parcel');await jobs.run('synthetic',head.id,'parcel')
  assert.equal(jobs.get('synthetic',head.id,'parcel')?.state,'failed')
  assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM oldstreet_campaign_jobs WHERE stage=?').get('archive')!.n,0)
  jobs.enqueue('synthetic',head.id,'parcel',true);await jobs.run('synthetic',head.id,'parcel')
  assert.equal(jobs.get('synthetic',head.id,'parcel')?.state,'ready')
  assert.equal(head.campaign.archive,undefined)
  assert.throws(()=>jobs.get('synthetic',head.id,'archive'),/PAPERS_REQUIRED/)
  head.campaign.parcel={id:randomUUID(),observed:true,content:jobs.candidateFor(head,'parcel') as any}
  jobs=new OldStreetCampaignJobs(db,()=>head,produce)
  jobs.enqueue('synthetic',head.id,'archive');await jobs.run('synthetic',head.id,'archive')
  assert.equal((jobs.candidateFor(head,'archive') as any).ledgerSite,'photo')
  assert.equal(calls,2)
  assert.equal(head.campaign.archive,undefined)
 }finally{raw.close()}
})
