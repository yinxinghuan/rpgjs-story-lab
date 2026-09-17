import test from 'node:test'
import assert from 'node:assert/strict'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {compileLinkedParcel,type CampaignContext} from '../src/old-street-campaign'
import {archiveOrders,compileInquiryArchive,type ArchiveContent} from '../src/old-street-archive'
const previous={label:'Path repairs were completed',mark:'two notches',wrapping:'string'}
const papers=compileLinkedParcel({title:'Undated records',fragment:'The page lists path repairs and newly planted trees, with no dates.',otherEvent:'New trees were planted'},previous,'en')
const context:CampaignContext={stage:'archive',locale:'en',previous,papers}
const room=['I...L','.....','.SS..','.....','...S.','.Tt..','.....','.....','.....']
const bad={title:'Path and trees',layout:'west-index',room,middleEvents:['Tree planting was planned','Seedlings were purchased'],earlier:'second'}
const corrected={...bad,earlier:'first'}

test('review sees actual chronology and immutable papers; one corrected candidate is recompiled and re-reviewed',async()=>{
 const seen:any[]=[],replies=[bad,{valid:false,issues:['The same trees cannot be planted before planning and buying the seedlings.']},corrected,{valid:true,issues:[]}]
 const before=structuredClone(context),signal=new AbortController().signal
 const planner=createOldStreetCampaignPlanner(async(_system,user,options)=>{assert.equal(options?.signal,signal);seen.push(JSON.parse(user));return replies.shift()})
 const result=await planner(context,signal) as ArchiveContent
 assert.deepEqual(seen[1].chronologicalEvents,['New trees were planted','Tree planting was planned','Seedlings were purchased','Path repairs were completed'])
 assert.deepEqual(seen[2].papers,before.papers)
 assert.deepEqual(seen[2].repair.candidate,bad)
 assert.match(seen[2].repair.issues[0],/cannot/)
 assert.equal(seen[3].chronologicalEvents.at(-1),'New trees were planted')
 assert.deepEqual(archiveOrders([...result.sources.index,...result.sources.ledger]),[['a','c','d','b']])
 assert.deepEqual(context,before,'review/correction never rewrites player-visible earlier content')
 assert.equal(replies.length,0)
})

test('invalid geometry can be corrected once but semantic approval cannot admit an unreachable room',async()=>{
 const invalid={...corrected,room:['I...L','.....','SSSSS','.....','.....','.Tt..','.....','.....','.....']}
 let calls=0
 const result=await createOldStreetCampaignPlanner(async(_system,user)=>{
  const data=JSON.parse(user);calls++
  if(calls===1)return invalid
  if(calls===2){assert.match(data.repair.issues[0],/UNREACHABLE/);return corrected}
  return {valid:true,issues:[]}
 })(context,new AbortController().signal) as ArchiveContent
 assert.deepEqual(result.room,room);assert.equal(calls,3)
 calls=0
 await assert.rejects(createOldStreetCampaignPlanner(async()=>{calls++;return invalid})(context,new AbortController().signal),/ARCHIVE_ROOM_UNREACHABLE/)
 assert.equal(calls,2,'no reviewer can overrule collision validation')
})

test('two semantic rejections fail without looping; malformed approval fails closed',async()=>{
 let calls=0
 await assert.rejects(createOldStreetCampaignPlanner(async()=>++calls%2?bad:{valid:false,issues:['Planting precedes seedling acquisition.']})(context,new AbortController().signal),/CAMPAIGN_NARRATIVE_REJECTED/)
 assert.equal(calls,4)
 calls=0
 await assert.rejects(createOldStreetCampaignPlanner(async()=>++calls===1?corrected:{valid:true,issues:['Contradiction remains.']})(context,new AbortController().signal),/CAMPAIGN_REVIEW_INVALID/)
 assert.equal(calls,2)
})

test('aborted review or unavailable provider cannot launch another generation attempt',async()=>{
 const controller=new AbortController();let calls=0
 await assert.rejects(createOldStreetCampaignPlanner(async()=>{
  if(++calls===1)return corrected
  controller.abort();return {valid:false,issues:['Repair needed.']}
 })(context,controller.signal),{name:'AbortError'})
 assert.equal(calls,2)
 calls=0
 await assert.rejects(createOldStreetCampaignPlanner(async()=>{calls++;throw Error('MODEL_HTTP_503')})(context,new AbortController().signal),/MODEL_HTTP_503/)
 assert.equal(calls,1)
})

test('equivalent generated grid serialization preserves geometry; malformed rows still fail',()=>{
 const rows=compileInquiryArchive(corrected,papers.inquiry!,'en',0)
 const multiline=compileInquiryArchive({...corrected,room:room.join('\n')},papers.inquiry!,'en',0)
 assert.deepEqual(multiline,rows)
 assert.throws(()=>compileInquiryArchive({...corrected,room:room.join('\n').replace('I...L','I..L')},papers.inquiry!,'en',0),/9 strings, each 5/)
 assert.throws(()=>compileInquiryArchive({...corrected,layout:room},papers.inquiry!,'en',0),/layout must be the string/)
})
