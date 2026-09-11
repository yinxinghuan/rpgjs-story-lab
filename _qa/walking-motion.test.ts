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

test('completed grid waypoints do not retain drift that blocks a tangent corner',()=>{
 const walk=(p:{x:number;y:number})=>!(p.x+9>146&&p.x<236&&p.y+15>0&&p.y<248)
 for(const fps of [20,24,30,40,50,59,60,61,75,90,120,144,165,240]){
  let p={x:112,y:184},route=[...Array.from({length:17},(_,i)=>({x:112,y:184+i*4})),...Array.from({length:41},(_,i)=>({x:112+i*4,y:248}))],distance=0
  for(let i=0;i<5000&&route.length;i++){const r=advanceRoute(p,route,110/fps,walk);assert.equal(r.blocked,false,`fps=${fps} p=${JSON.stringify(r.position)}`);assert.ok(walk(r.position));p=r.position;route.splice(0,r.consumed);distance+=r.distance}
  assert.equal(route.length,0);assert.deepEqual(p,{x:272,y:248});assert.ok(Math.abs(distance-224)<1e-5)
 }
 const rejected=advanceRoute({x:0,y:0},[{x:1e-8,y:0}],1,p=>p.x===0);assert.equal(rejected.blocked,true);assert.equal(rejected.arrived,false);assert.deepEqual(rejected.position,{x:0,y:0})
})

test('subpixel starts land exactly on a wall-adjacent node without phantom collision',()=>{
 const walk=(p:{x:number;y:number})=>p.x>=60&&!(p.x<74&&p.y+15>246)
 for(const x of [60,60.2,61,62,63.8])for(const y of [228,230,230.5,230.999,231])for(const fps of [30,60,120]){
  let p={x,y},route=[{x:60,y:228},{x:80,y:228}]
  for(let i=0;i<100&&route.length;i++){const r=advanceRoute(p,route,110/fps,walk);assert.equal(r.blocked,false,JSON.stringify({x,y,fps,p:r.position}));p=r.position;route.splice(0,r.consumed)}
  assert.equal(route.length,0);assert.deepEqual(p,{x:80,y:228})
 }
})
