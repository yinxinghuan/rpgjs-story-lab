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
const bridgeContent={title:'Bridge boards',discovery:'Pale boards cross the darker planks.',photograph:'A monochrome pixel art footbridge with pale boards among dark planks, no people or text.'}
const groundedReview={archiveSubject:'Bridge boards',pictureSubject:'Bridge planks',comparison:'Both depict the same wooden bridge surface.',relationship:'same-object',issues:[],sourceEventId:'event-3',pictureDetailId:'detail-1',sameSubject:true,compatibleMaterials:true,visibleDiscovery:true}
test('linked photograph carries the confirmed chronology into generation and review, without changing room geometry',async()=>{
 const inputs:any[]=[]
 const plan=await createOldStreetExpansionPlanner(async(_system,user)=>{const data=JSON.parse(user);inputs.push(data);return inputs.length===1?bridgeContent:groundedReview})({...intent,archiveSource},'en',new AbortController().signal)
 assert.equal(inputs.length,2);assert.deepEqual(inputs[0].archiveSource,archiveSource);assert.deepEqual(inputs[1].sourceEvents.map((e:any)=>e.text),archiveSource.events)
 assert.equal(inputs[1].pictureDetails[0].text,bridgeContent.photograph)
 assert.deepEqual(plan.space, (await createOldStreetExpansionPlanner(async()=>content)(intent,'en',new AbortController().signal)).space)
})
test('a positive verdict cannot override a material mismatch or fabricated supporting quotes',async()=>{
 for(const review of [
  {...groundedReview,compatibleMaterials:false},
  {...groundedReview,relationship:'background-only'},
  {...groundedReview,sourceEventId:'event-99'},
  {...groundedReview,pictureDetailId:'detail-99'},
  {valid:true,issues:[]},
 ]){
  let calls=0
  await assert.rejects(createOldStreetExpansionPlanner(async()=>++calls===1?bridgeContent:review)({...intent,archiveSource},'en',new AbortController().signal),/ARCHIVE_PHOTO_REVIEW_REJECTED/)
 }
})

test('one malformed evidence selection can be repaired without rewriting the candidate or its source',async()=>{
 const seen:any[]=[]
 const plan=await createOldStreetExpansionPlanner(async(_system,input)=>{
  seen.push(JSON.parse(input))
  if(seen.length===1)return bridgeContent
  return {...groundedReview,pictureDetailId:seen.length===2?'copied prose':'detail-1'}
 })({...intent,archiveSource},'en',new AbortController().signal)
 assert.equal(seen.length,3)
 assert.deepEqual(plan.content.photograph,bridgeContent.photograph)
 assert.deepEqual(seen[2].candidate,seen[1].candidate)
 assert.deepEqual(seen[2].sourceEvents,seen[1].sourceEvents)
 assert.deepEqual(seen[2].pictureDetails,seen[1].pictureDetails)
 assert.match(seen[2].reviewFormatErrors.join(' '),/pictureDetailId/)
})

test('explicit disagreement or provider interruption cannot be retried into a pass',async()=>{
 for(const review of [{...groundedReview,visibleDiscovery:false,issues:['Discovery claims a repair date.']},{...groundedReview,issues:['The object is wrong.']}]){
  let calls=0
  await assert.rejects(createOldStreetExpansionPlanner(async()=>++calls===1?bridgeContent:review)({...intent,archiveSource},'en',new AbortController().signal),/ARCHIVE_PHOTO_REVIEW_REJECTED/)
  assert.equal(calls,2)
 }
 let calls=0
 await assert.rejects(createOldStreetExpansionPlanner(async()=>{if(++calls===1)return bridgeContent;throw Error('MODEL_HTTP_503')})({...intent,archiveSource},'en',new AbortController().signal),/MODEL_HTTP_503/)
 assert.equal(calls,2)
})
test('review cannot admit a photograph about an unrelated event',async()=>{
 let calls=0
 await assert.rejects(createOldStreetExpansionPlanner(async()=>++calls===1?content:{valid:false,issues:['The archive is about a bridge, not a storefront.']})({...intent,archiveSource},'en',new AbortController().signal),/ARCHIVE_PHOTO_REVIEW_REJECTED/)
})
