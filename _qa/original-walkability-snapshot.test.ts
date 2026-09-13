import test from 'node:test'
import assert from 'node:assert/strict'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalWorldWalkable,originalWorldWalkabilitySnapshot} from '../src/original-world-space'
import {originalCharacterBodies} from '../src/original-character-space'
import {originalEquipmentBodies} from '../src/original-equipment-art'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {findGridPath} from '../src/grid-path'
test('search snapshot agrees with live collision at scene grids, exact body edges and invalid positions',()=>{
 const h=originalTrainRuntime(()=>true).initial('zh',crypto.randomUUID())
 for(const scene of originalTrainChapterSpatialPlan().scenes){h.sceneId=scene.id;const snapshot=originalWorldWalkabilitySnapshot(h),points=[{x:NaN,y:0},{x:0,y:Infinity},{x:-1,y:0},{x:384,y:576}]
  for(let x=0;x<=384;x+=16)for(let y=0;y<=576;y+=16)points.push({x,y})
  for(const b of [...originalCharacterBodies(h),...originalEquipmentBodies(h.sceneId,h.assets)])for(const d of [-.01,0,.01])points.push({x:b.x-9+d,y:b.y},{x:b.x+b.w+d,y:b.y},{x:b.x,y:b.y-15+d},{x:b.x,y:b.y+b.h+d})
  for(const p of points)assert.equal(snapshot(p),originalWorldWalkable(h,p),`${scene.id}:${p.x},${p.y}`)
 }
})
test('snapshot is scoped to a single search; next snapshot reflects departed characters and paths stay identical',()=>{
 const h=originalTrainRuntime(()=>true).initial('en',crypto.randomUUID()),body=originalCharacterBodies(h)[0],p={x:body.x,y:body.y},snapshot=originalWorldWalkabilitySnapshot(h)
 assert.deepEqual(findGridPath(h.position,{x:92,y:300},snapshot),findGridPath(h.position,{x:92,y:300},q=>originalWorldWalkable(h,q)))
 assert.equal(snapshot(p),false)
 h.save.characters.find(c=>c.id===body.id)!.status='departed'
 assert.equal(snapshot(p),false)
 assert.equal(originalWorldWalkabilitySnapshot(h)(p),originalWorldWalkable(h,p))
 assert.equal(originalWorldWalkabilitySnapshot(h)(p),true)
})
