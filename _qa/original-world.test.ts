import {test} from 'node:test'
import assert from 'node:assert/strict'
import {findGridPath} from '../src/grid-path'
import {advanceRoute} from '../src/walking-motion'
import {originalTrainSpatialPlan,originalTrainPlanWalkable,originalTrainRoom,originalTrainObstacles} from '../src/original-train-spatial-plan'
test('North Cape paths reach each authored target while respecting the full actor footprint',()=>{
 const world=originalTrainSpatialPlan(),scene=originalTrainRoom('dead-station'),spawn=world.scenes.find(s=>s.id===scene)!.spawn,walk=(p:{x:number;y:number})=>originalTrainPlanWalkable(scene,p)
 for(const entity of world.entities.filter(e=>e.scene===scene)){
  const path=findGridPath(spawn,entity.approach,walk);assert.ok(path.length,entity.id)
  assert.ok(path.every(walk),entity.id)
  let p={...spawn},distance=0,remaining=[...path]
  for(let i=0;remaining.length&&i<1000;i++){const r=advanceRoute(p,remaining,6,walk);assert.equal(r.blocked,false,entity.id);p=r.position;distance+=r.distance;remaining.splice(0,r.consumed)}
  assert.equal(remaining.length,0,entity.id);assert.ok(Math.hypot(p.x-entity.position.x,p.y-entity.position.y)<world.interactionDistance);assert.ok(distance>0)
 }
 assert.equal(findGridPath(spawn,{x:188,y:130},walk).length,0)
 assert.equal(walk({x:140,y:180}),false,'actor right side overlaps train')
 assert.equal(walk({x:150,y:245}),false,'actor inside front coupling')
 assert.equal(walk({x:150,y:248}),true)
 assert.equal(walk({x:65,y:290}),false,'shed frame blocks the side path')
 assert.equal(walk({x:80,y:290}),true)
 assert.ok(originalTrainObstacles.length>=6)
})
test('route between opposite train sides goes around the front, not across the roof',()=>{
 const scene=originalTrainRoom('dead-station'),walk=(p:{x:number;y:number})=>originalTrainPlanWalkable(scene,p)
 const path=findGridPath({x:110,y:185},{x:260,y:195},walk)
 assert.ok(path.length>0);assert.ok(path.some(p=>p.y>=248));assert.ok(path.every(walk))
})
