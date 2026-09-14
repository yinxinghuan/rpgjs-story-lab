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
test('explicit work post overrides following until duty is released',()=>{
 const m=new CompanionMotion();m.reset({x:200,y:100},[{id:'ada',position:{x:80,y:100}}])
 const workPosts={ada:{x:100,y:100}}
 for(let i=0;i<120;i++)m.update(1/60,{x:200,y:100},{...options(),workPosts})
 assert.ok(Math.abs(m.snapshot()[0].position.x-100)<3)
 for(let i=0;i<60;i++)m.update(1/60,{x:200+i,y:100},{...options(),workPosts})
 assert.ok(Math.abs(m.snapshot()[0].position.x-100)<3);assert.equal(m.snapshot()[0].pose,'stand')
 for(let i=0;i<30;i++)m.update(1/60,{x:259,y:100},options())
 assert.ok(m.snapshot()[0].position.x>120)
})
test('a companion steps aside for a player turning back and does not cross occupied ground',()=>{
 const m=new CompanionMotion(34,20);m.reset({x:100,y:100},[{id:'ada',position:{x:130,y:100}}]);let states=m.snapshot()
 for(let i=0;i<60;i++){states=m.update(1/60,{x:100,y:100},{...options(),leaderIntent:{x:1,y:0}});assert.ok(open(states[0].position));assert.ok(Math.hypot(states[0].position.x-100,states[0].position.y-100)>=20)}
 assert.ok(Math.abs(states[0].position.y-100)>=26)
})
test('in a one-person corridor a companion retreats to the next opening before yielding sideways',()=>{
 const corridor=(p:{x:number;y:number})=>p.x>=0&&p.x<=290&&(p.x>=174?p.y>=60&&p.y<=150:p.y>=96&&p.y<=104)
 const m=new CompanionMotion(34,20);let hero={x:80,y:100};m.reset(hero,[{id:'ada',position:{x:112,y:100}}]);let actor=m.snapshot()[0],sawSideStep=false
 for(let i=0;i<240;i++){
  const next={x:Math.min(250,hero.x+1.2),y:100}
  if(corridor(next)&&!(next.x+9>actor.position.x&&next.x<actor.position.x+9&&next.y+15>actor.position.y&&next.y<actor.position.y+15))hero=next
  actor=m.update(1/60,hero,{...options(corridor),leaderIntent:hero.x<250?{x:1,y:0}:{x:0,y:0}})[0]
  assert.ok(corridor(actor.position),'follower stays within corridor or opening')
  if(actor.position.x>=174&&Math.abs(actor.position.y-100)>20)sawSideStep=true
 }
 assert.ok(sawSideStep);assert.ok(hero.x>210,'player gets past the follower at the opening: '+JSON.stringify({hero,actor}))
})

test('approaching one companion holds only that person while another can yield',()=>{
 const leader={x:150,y:180},target={x:150,y:120},blocker={x:150,y:155},motion=new CompanionMotion(34,20)
 motion.reset(leader,[{id:'ada',position:target},{id:'mako',position:blocker}])
 let state=motion.snapshot()
 for(let frame=0;frame<60;frame++)state=motion.update(1/60,leader,{...options(),talkingTo:'ada',leaderIntent:{x:0,y:-1}})
 assert.deepEqual(state[0].position,target);assert.equal(state[0].pose,'stand');assert.equal(state[0].direction,'down')
 assert.ok(Math.abs(state[1].position.x-blocker.x)>20,'the untargeted companion must leave the approach corridor')
 const before=state.map(s=>s.position)
 const paused=motion.update(1/60,leader,{...options(),paused:true,talkingTo:'ada',leaderIntent:{x:0,y:-1}})
 assert.deepEqual(paused.map(s=>s.position),before)
})
