import test from 'node:test'
import assert from 'node:assert/strict'
import {compilePhotoInquiry,preparePhotoInquiry} from '../server/old-street-photo-inquiry'
import {readPreparedInvestigation} from '../server/old-street-investigation-draft'
import {archiveOrders,readArchiveContent} from '../src/old-street-archive'
import {archivePhotoSource,assertArchivePhotoSource} from '../src/old-street-archive-photo'
import {createOldStreetExpansionPlanner} from '../server/old-street-expansion-planner'
import {DatabaseSync} from 'node:sqlite'
import {oldStreetRuntime} from '../server/old-street-runtime'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import type {AuthorityStorage} from '../server/session-authority'

const context={stage:'parcel' as const,locale:'en' as const,previous:{label:'The footbridge reopened',mark:'two notches',wrapping:'linen cord'},investigation:true as const,route:'studio-loan-v1' as const}
const draft={title:'Bridge exposure',photoLabel:'Footbridge',roomPlan:{indexSide:'left',storageShelves:1,rack:'none'}}

test('the production planner stores a paired investigation once and restores its capture timing without early revelation',async()=>{
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(sql,...args)=>raw.prepare(sql).all(...args) as any,run:(sql,...args)=>{raw.prepare(sql).run(...args)},transaction:f=>{raw.exec('BEGIN');try{const value=f();raw.exec('COMMIT');return value}catch(error){raw.exec('ROLLBACK');throw error}}}
 const head=oldStreetRuntime(()=>true).initial('en','synthetic-photo-timing')
 head.save.facts['letter-taken']=true
 head.campaign={version:3,explorationRoute:'studio-loan-v1',trace:{id:'synthetic-trace',observed:true,selected:0,content:{title:'Records',clue:{mark:context.previous.mark,wrapping:context.previous.wrapping},records:[context.previous]}}}
 let calls=0
 const planner=createOldStreetCampaignPlanner(async()=>{calls++;return draft})
 let jobs=new OldStreetCampaignJobs(db,()=>head,planner)
 try{
  jobs.enqueue('synthetic',head.id,'parcel');await jobs.run('synthetic',head.id,'parcel')
  assert.equal(jobs.get('synthetic',head.id,'parcel')?.state,'ready')
  assert.equal(head.campaign.archive,undefined)
  assert.throws(()=>jobs.get('synthetic',head.id,'archive'),/PAPERS_REQUIRED/)
  head.campaign.parcel={id:'synthetic-paper',observed:true,content:jobs.candidateFor(head,'parcel') as any}
  jobs=new OldStreetCampaignJobs(db,()=>head,planner)
  jobs.enqueue('synthetic',head.id,'archive');await jobs.run('synthetic',head.id,'archive')
  const archive=readArchiveContent(jobs.candidateFor(head,'archive'))
  assert.ok(archive.photoTiming)
  assert.equal(archive.ledgerSite,'photo')
  assert.equal(calls,1)
  assert.equal(head.campaign.archive,undefined,'preparation is not observation')
  const restored=new OldStreetCampaignJobs(db,()=>head,planner)
  assert.deepEqual(restored.candidateFor(head,'archive'),archive)
 }finally{raw.close()}
})

test('both photo timings yield a unique evidence-based answer and survive persistence in both languages',()=>{
 for(const locale of ['zh','en'] as const)for(const before of [true,false]){
  const previous={...context.previous,label:locale==='zh'?'步行桥重新开放':context.previous.label}
  const result=readPreparedInvestigation(JSON.parse(JSON.stringify(compilePhotoInquiry({...draft,photoLabel:locale==='zh'?'步行桥':'Footbridge'},{...context,locale,previous},before,42))))
  const archive=result.archive,all=[...archive.sources.index,...archive.sources.ledger],orders=archiveOrders(all)
  assert.equal(orders.length,1)
  assert.equal(orders[0].indexOf('b')<orders[0].indexOf('a'),before)
  for(const source of Object.values(archive.sources)){
   // A single source must leave the actual question unresolved, not just leave
   // some unrelated middle cards movable.
   assert.deepEqual(new Set(archiveOrders(source).map(o=>o.indexOf('b')<o.indexOf('a'))),new Set([true,false]))
  }
  assert.equal(archive.cards.find(c=>c.id==='a')!.label,previous.label)
  assert.equal(archive.ledgerSite,'photo')
  const progress={id:'synthetic-photo-inquiry',content:archive,examined:[]}
  assert.equal(archivePhotoSource({version:3,archive:progress}),undefined)
  const source=archivePhotoSource({version:3,archive:{...progress,order:orders[0]}})!
  assertArchivePhotoSource(source)
  assert.deepEqual(source.capture,{timing:before?'before-work':'after-work',workEvent:previous.label})
  assert.throws(()=>readArchiveContent({...archive,photoTiming:before?'after-work':'before-work'}),/TIMING_MISMATCH/)
  const legacy={...archive};delete legacy.photoTiming
  assert.equal(archivePhotoSource({version:3,archive:{...progress,content:readArchiveContent(legacy),order:orders[0]}})!.capture,undefined)
 }
})

test('model repairs only its label or furniture once; it cannot author a chronology or change the assigned route',async()=>{
 const seen:any[]=[]
 const prepared=await preparePhotoInquiry(async(_system,input)=>{
  seen.push(JSON.parse(input))
  return seen.length===1?{...draft,events:['made-up history']}:draft
 },context,AbortSignal.timeout(5000))
 assert.equal(seen.length,2)
 assert.deepEqual(seen[0].route,seen[1].route)
 assert.equal(prepared.archive.ledgerSite,'photo')
 assert.match(seen[1].repair.issue,/return only/)
 let calls=0
 await assert.rejects(preparePhotoInquiry(async()=>{calls++;return {...draft,events:[]}},context,AbortSignal.timeout(5000)),/PHOTO_INQUIRY_INVALID/)
 assert.equal(calls,2)
 calls=0
 await assert.rejects(preparePhotoInquiry(async()=>{calls++;throw Error('MODEL_HTTP_503')},context,AbortSignal.timeout(5000)),/MODEL_HTTP_503/)
 assert.equal(calls,1)
})

test('the photograph consumes the admitted capture time and refuses an incompatible image plan',async()=>{
 const archive=compilePhotoInquiry(draft,context,true,42).archive
 const source=archivePhotoSource({version:3,archive:{id:'synthetic-capture',content:archive,examined:['index','ledger'],order:archiveOrders([...archive.sources.index,...archive.sources.ledger])[0]}})!
 const intent={version:1 as const,id:'synthetic-capture-photo',template:'photo-darkroom-v1' as const,sourceScene:'photo' as const,input:'Examine the negative',status:'requested' as const,requestedAtVersion:20,archiveSource:source}
 const content={title:'Footbridge',discovery:'Wooden planks cross the stream.',photograph:'A monochrome pixel art wooden footbridge over a stream, no people or text.'}
 const review={archiveSubject:'Footbridge',pictureSubject:'Footbridge',comparison:'The same wooden bridge.',relationship:'same-object',sourceEventId:'event-4',pictureDetailId:'detail-1',sameSubject:true,compatibleMaterials:true,visibleDiscovery:true,compatibleCapture:true,issues:[]}
 const seen:any[]=[]
 await createOldStreetExpansionPlanner(async(_system,input)=>{seen.push(JSON.parse(input));return seen.length===1?content:review})(intent,'en',AbortSignal.timeout(5000))
 assert.deepEqual(seen[0].archiveSource.capture,source.capture)
 assert.deepEqual(seen[1].capture,source.capture)
 let calls=0
 await assert.rejects(createOldStreetExpansionPlanner(async()=>++calls===1?content:{...review,compatibleCapture:false})(intent,'en',AbortSignal.timeout(5000)),/REVIEW_REJECTED/)
 assert.equal(calls,2,'semantic rejection is not retried')
 for(const capture of [null,{timing:'before-work',workEvent:'Another building was demolished'}])assert.throws(()=>assertArchivePhotoSource({...source,capture}),/INVALID_ARCHIVE_PHOTO_SOURCE/)
})
