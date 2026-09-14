import test from 'node:test'
import assert from 'node:assert/strict'
import {CompanionMotion} from '../src/companion-motion'
import {findGridPath} from '../src/grid-path'
const open=(p:{x:number;y:number})=>p.x>=0&&p.x<=300&&p.y>=0&&p.y<=300
const options=(walkable=open)=>({paused:false,walkable,findPath:(a:{x:number;y:number},b:{x:number;y:number})=>findGridPath(a,b,walkable)})
test('following uses collision routes and never crosses the wall or teleports to the leader',()=>{
 const wall=(p:{x:number;y:number})=>open(p)&&!(p.x>=100&&p.x<=112&&p.y<180)
 const motion=new CompanionMotion();motion.reset({x:72,y:80},[{id:'ada',position:{x:48,y:80}}]);let leader={x:72,y:80},last={x:48,y:80},moved=false
 for(let frame=0;frame<400;frame++){
  if(frame<130)leader={x:72,y:80+frame};else if(frame<260)leader={x:72+frame-130,y:210}
  const actor=motion.update(1/60,leader,options(wall))[0]
  assert.ok(wall(actor.position));assert.ok(Math.hypot(actor.position.x-last.x,actor.position.y-last.y)<=110/60+.001)
  if(actor.pose!=='stand')moved=true;last=actor.position
 }
 assert.ok(moved);assert.ok(last.x>112,'companion walked around the wall')
})
test('conversation freezes movement and faces the player; resuming does not restart the formation',()=>{
 const m=new CompanionMotion();m.reset({x:100,y:100},[{id:'ada',position:{x:40,y:100}}])
 const paused=m.update(1/60,{x:100,y:100},{...options(),paused:true,talkingTo:'ada'})[0]
 assert.deepEqual(paused.position,{x:40,y:100});assert.equal(paused.direction,'right');assert.equal(paused.pose,'stand')
 assert.ok(m.update(1/60,{x:100,y:100},options())[0].position.x>40)
})
test('scene teleport waits for explicit reset and snapshot consumers cannot mutate positions',()=>{
 const m=new CompanionMotion();m.reset({x:40,y:40},[{id:'ada',position:{x:10,y:40}}])
 for(let i=0;i<3;i++)assert.deepEqual(m.update(1/60,{x:200,y:200},options())[0].position,{x:10,y:40})
 const s=m.snapshot();s[0].position.x=999;assert.equal(m.snapshot()[0].position.x,10)
 m.reset({x:200,y:200},[{id:'ada',position:{x:160,y:200}}]);assert.ok(m.update(1/60,{x:200,y:200},options())[0].position.x>160)
})
test('formation keeps actors apart and settles when the player stops',()=>{
 const m=new CompanionMotion();m.reset({x:80,y:100},[{id:'a',position:{x:44,y:100}},{id:'b',position:{x:12,y:100}}]);let leader={x:80,y:100},actors=m.snapshot()
 for(let i=0;i<240;i++){
  if(i<100)leader={x:80+i,y:100}
  actors=m.update(1/60,leader,options());assert.ok(Math.hypot(actors[0].position.x-actors[1].position.x,actors[0].position.y-actors[1].position.y)>=16-.001)
 }
 assert.ok(actors.every(a=>a.pose==='stand'));assert.ok(actors[0].position.x>actors[1].position.x)
})
test('frame rate does not turn following into faster movement or slower footsteps',()=>{
 const results=[30,60,120].map(fps=>{
  const m=new CompanionMotion();m.reset({x:80,y:100},[{id:'ada',position:{x:44,y:100}}]);let travelled=0,last={x:44,y:100},movingFrames=0
  for(let i=1;i<=fps*3;i++){
   const actor=m.update(1/fps,{x:80+40*i/fps,y:100},options())[0]
   travelled+=Math.hypot(actor.position.x-last.x,actor.position.y-last.y);last=actor.position
   if(actor.pose!=='stand')movingFrames++
  }
  assert.ok(movingFrames>0);return {travelled,x:last.x}
 })
 assert.ok(Math.max(...results.map(r=>r.x))-Math.min(...results.map(r=>r.x))<5)
 assert.ok(Math.max(...results.map(r=>r.travelled))-Math.min(...results.map(r=>r.travelled))<5)
})
