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
