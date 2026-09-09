import { test } from 'node:test'
import assert from 'node:assert/strict'
import { advanceRoute, moveWithCollision, walkingPose, WALK_SPEED, STRIDE_DISTANCE } from '../src/walking-motion'
import { findPath } from '../src/pathfinding'
import { walkable, SPAWN } from '../src/contract'

const near=(actual:number,expected:number)=>assert.ok(Math.abs(actual-expected)<1e-6,`${actual} != ${expected}`)
for(const fps of [30,60,120])test(`continuous 4px waypoints at ${fps}fps keep speed and gait`,()=>{
 let position={x:0,y:0},route=Array.from({length:101},(_,i)=>({x:0,y:i*4})),distance=0
 const poses=new Set<string>()
 for(let i=0;i<fps;i++){
  const step=advanceRoute(position,route,WALK_SPEED/fps,()=>true)
  near(step.distance,WALK_SPEED/fps)
  position=step.position;route=route.slice(step.consumed);distance+=step.distance
  poses.add(walkingPose(distance))
 }
 near(position.y,110);near(distance,110)
 assert.equal(poses.size,3)
})
test('irregular frames spend the remaining budget across a corner without shortening the stride',()=>{
 let position={x:0,y:0},route=[{x:0,y:0},{x:0,y:4},{x:4,y:4},{x:100,y:4}],distance=0
 for(const dt of [.008,.033,.016,.04,.009,.027]){
  const step=advanceRoute(position,route,WALK_SPEED*dt,()=>true)
  near(step.distance,WALK_SPEED*dt)
  position=step.position;route=route.slice(step.consumed);distance+=step.distance
 }
 near(distance,110*.133);near(position.x,distance-4);near(position.y,4)
})
test('arrival never overshoots and consumes every reached waypoint in the same frame',()=>{
 const result=advanceRoute({x:0,y:0},[{x:0,y:0},{x:0,y:1},{x:0,y:2}],4,()=>true)
 assert.deepEqual(result.position,{x:0,y:2});near(result.distance,2)
 assert.equal(result.arrived,true);assert.equal(result.consumed,3)
})
test('a wall contributes no stride distance; sliding uses actual distance and cannot tunnel',()=>{
 const wall=(p:{x:number;y:number})=>p.x<=0
 near(moveWithCollision({x:0,y:0},{x:4,y:0},wall).distance,0)
 near(moveWithCollision({x:0,y:0},{x:4,y:3},wall).distance,3)
 const blocked=advanceRoute({x:0,y:0},[{x:4,y:0}],4,wall)
 assert.equal(blocked.blocked,true);assert.equal(blocked.arrived,false)
 const thinWall=(p:{x:number;y:number})=>p.x<2||p.x>3
 assert.ok(moveWithCollision({x:0,y:0},{x:10,y:0},thinWall).position.x<2)
})
test('slow joystick and full speed select the same pose at the same distance',()=>{
 const travel=(speed:number,frames:number)=>{
  let position={x:0,y:0},distance=0
  for(let i=0;i<frames;i++){
   const step=moveWithCollision(position,{x:speed/60,y:0},()=>true)
   position=step.position;distance+=step.distance
  }
  return distance
 }
 const slow=travel(WALK_SPEED/2,42),fast=travel(WALK_SPEED,21)
 near(slow,fast);assert.equal(walkingPose(slow),walkingPose(fast))
 assert.deepEqual([0,1,2,3,4].map(i=>walkingPose(i*STRIDE_DISTANCE/4)),['stride-0','stride-1','stride-2','stride-1','stride-0'])
})
test('real carriage path remains walkable and reaches its destination at both frame rates',()=>{
 for(const fps of [30,120]){
  let position={...SPAWN},route=findPath(position,{x:188,y:200},'carriage')
  assert.ok(route.length)
  const destination=route.at(-1)
  for(let frame=0;route.length&&frame<fps*10;frame++){
   const step=advanceRoute(position,route,WALK_SPEED/fps,p=>walkable(p,'carriage'))
   assert.equal(step.blocked,false)
   position=step.position;route=route.slice(step.consumed)
   assert.ok(walkable(position,'carriage'))
  }
  assert.equal(route.length,0);near(position.x,destination!.x);near(position.y,destination!.y)
 }
})
