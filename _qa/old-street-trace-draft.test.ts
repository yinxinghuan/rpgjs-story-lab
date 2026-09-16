import test from 'node:test'
import assert from 'node:assert/strict'
import {compileTraceDraft,campaignRecordMatches,readTraceContent} from '../src/old-street-campaign'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
const draft={title:'Cellar records',marks:['Two notches','One notch'],wrappings:['Linen cord','Folded flap'],subjects:['Footbridge repairs','Roof survey','Workshop maintenance']}

test('authored vocabulary compiles to six solvable row arrangements without changing its details',()=>{
 const arrangements=new Set<string>(),positions=new Set<number>()
 for(let variant=0;variant<6;variant++){
  const content=compileTraceDraft(draft,variant)
  assert.equal(content.records.filter((_,i)=>campaignRecordMatches(content,i)).length,1)
  assert.equal(content.records.filter(r=>r.mark===content.clue.mark).length,2)
  assert.equal(content.records.filter(r=>r.wrapping===content.clue.wrapping).length,2)
  assert.deepEqual(new Set(content.records.map(r=>r.label)),new Set(draft.subjects))
  arrangements.add(JSON.stringify(content.records));positions.add(content.records.findIndex((_,i)=>campaignRecordMatches(content,i)))
  assert.deepEqual(readTraceContent(JSON.parse(JSON.stringify(content))),content,'persisted instances keep their exact order')
 }
 assert.equal(arrangements.size,6);assert.equal(positions.size,3)
})

test('ambiguous vocabulary and incomplete drafts are rejected, never filled with made-up details',()=>{
 for(const broken of [{...draft,marks:['Two notches','two notches']},{...draft,wrappings:['Cord','Cord']},{...draft,subjects:['A','A','B']},{...draft,marks:['Only one']},{...draft,subjects:['Only one']}])assert.throws(()=>compileTraceDraft(broken))
 assert.throws(()=>compileTraceDraft(draft,6))
})

test('production planner compiles vocabulary while retaining the old validated instance contract',async()=>{
 const signal=new AbortController().signal
 const planner=createOldStreetCampaignPlanner(async()=>draft)
 const content=readTraceContent(await planner({stage:'trace',locale:'en'},signal))
 assert.equal(content.records.filter((_,i)=>campaignRecordMatches(content,i)).length,1)
 const legacy=createOldStreetCampaignPlanner(async()=>content)
 assert.deepEqual(await legacy({stage:'trace',locale:'en'},signal),content)
})
