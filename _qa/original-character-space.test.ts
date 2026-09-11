import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalCharacterBodies,originalCharacterWalkable,originalCharacterSafePosition} from '../src/original-character-space'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {findGridPath} from '../src/grid-path'

test('only present characters occupy the map; traveling and staying follow the same story state',()=>{
 const h=originalTrainRuntime(()=>true).initial('zh',randomUUID()),before=JSON.stringify(h)
 assert.deepEqual(originalCharacterBodies(h).map(b=>b.id),['ada-mechanic'])
 const b=originalCharacterBodies(h)[0]
 assert.equal(originalCharacterWalkable(h,{x:b.x,y:b.y}),false)
 assert.equal(JSON.stringify(h),before)
 h.save.characters[0].lastKnownLocation='dead-station'
 h.sceneId='train-at-river-valley';h.save.map=h.save.map.map(m=>({...m,current:m.id==='river-valley'}));h.save.location='河谷'
 assert.deepEqual(originalCharacterBodies(h),[])
 h.save.characters[0].status='companion';h.save.partyMemberIds=['ada-mechanic']
 assert.deepEqual(originalCharacterBodies(h).map(b=>b.id),['ada-mechanic'])
 h.save.characters[0].status='departed'
 assert.deepEqual(originalCharacterBodies(h),[])
})
test('occupied old positions recover without changing story or legal positions; all opening approaches remain reachable',()=>{
 const runtime=originalTrainRuntime(()=>true),h=runtime.initial('en',randomUUID()),story=JSON.stringify(h.save)
 assert.deepEqual(originalCharacterSafePosition(h,h.position),h.position)
 const body=originalCharacterBodies(h)[0];h.position={x:body.x,y:body.y}
 const restored=runtime.upgrade(h)
 assert.ok(originalCharacterWalkable(restored,restored.position));assert.notDeepEqual(restored.position,h.position)
 assert.equal(JSON.stringify(restored.save),story);assert.equal(restored.version,h.version)
 assert.throws(()=>runtime.position(h,h.position),/INVALID_POSITION/)
 for(const entity of originalTrainChapterSpatialPlan().entities.filter(e=>e.scene===h.sceneId)){
  const route=findGridPath(restored.position,entity.approach,p=>originalCharacterWalkable(restored,p))
  assert.ok(route.length,entity.id)
  assert.ok(route.every(p=>originalCharacterWalkable(restored,p)),entity.id)
 }
})
