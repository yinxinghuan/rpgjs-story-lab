import test from 'node:test'
import assert from 'node:assert/strict'
import {createOldStreetExpansionPlanner} from '../server/old-street-expansion-planner'
import {expansionPresentation,readExpansionContent} from '../src/old-street-expansion-plan'
import type {OldStreetExpansionRequest} from '../src/old-street-expansion'
const intent:OldStreetExpansionRequest={version:1,id:'expansion-test-00001',template:'photo-darkroom-v1',sourceScene:'photo',input:'想看看暗房',status:'requested',requestedAtVersion:2}
const content={title:'暗房',discovery:'拼合后，两边的窗沿连成了完整的旧店面。',photograph:'A single old storefront with a continuous window sill, no text or people.'}
test('model content compiles to playable baseline; only visual puzzle awaits its image',async()=>{
 let calls=0
 const plan=await createOldStreetExpansionPlanner(async()=>{calls++;return content})(intent,'zh',new AbortController().signal)
 assert.equal(calls,1)
 assert.equal(plan.content.arrival,'小灯照着旧工作台，门仍通向照相馆。')
 const geometry=structuredClone(plan.space)
 assert.deepEqual(expansionPresentation(plan,[],true),{useBaseline:true,actions:['observe-bench']})
 assert.deepEqual(expansionPresentation(plan,['photograph','atmosphere'],false),{useBaseline:true,actions:['observe-bench','match-print']})
 assert.deepEqual(expansionPresentation(plan,['photograph','atmosphere'],true),{useBaseline:false,actions:['observe-bench','match-print']})
 assert.deepEqual(plan.space,geometry)
 assert.equal(plan.media.length,2);assert.ok(plan.media.every(m=>!m.requiredForEntry))
 assert.throws(()=>readExpansionContent({...content,door:{x:0,y:0}}),/INVALID/)
})

const archiveSource={archiveId:'archive-source-00001',title:'Bridge repair',events:['The damage was measured','Replacement boards were cut','New boards were fitted','The bridge reopened'],account:'Boards were fitted before the bridge reopened.'}
test('linked photograph carries the confirmed chronology into generation and review, without changing room geometry',async()=>{
 const inputs:any[]=[]
 const plan=await createOldStreetExpansionPlanner(async(_system,user)=>{const data=JSON.parse(user);inputs.push(data);return inputs.length===1?content:{valid:true,issues:[]}})({...intent,archiveSource},'en',new AbortController().signal)
 assert.equal(inputs.length,2);assert.deepEqual(inputs[0].archiveSource,archiveSource);assert.deepEqual(inputs[1].archiveSource,archiveSource)
 assert.deepEqual(plan.space, (await createOldStreetExpansionPlanner(async()=>content)(intent,'en',new AbortController().signal)).space)
})
test('review cannot admit a photograph about an unrelated event',async()=>{
 let calls=0
 await assert.rejects(createOldStreetExpansionPlanner(async()=>++calls===1?content:{valid:false,issues:['The archive is about a bridge, not a storefront.']})({...intent,archiveSource},'en',new AbortController().signal),/ARCHIVE_PHOTO_REVIEW_REJECTED/)
})
