import test from 'node:test'
import assert from 'node:assert/strict'
import {StreetFootsteps} from '../src/old-street-audio'
test('footsteps track displacement at 30/60/120 fps, not frame count',()=>{
 const counts=[30,60,120].map(fps=>{const s=new StreetFootsteps();let count=0;s.update(1/fps,{x:0,y:0},'street',false);for(let i=1;i<=fps*4;i++)if(s.update(1/fps,{x:64*i/fps,y:0},'street',false))count++;return count})
 assert.ok(Math.max(...counts)-Math.min(...counts)<=1);assert.ok(counts.every(n=>n>=8&&n<=9))
})
test('stationary, blocked, paused, scene changes and teleports cannot create steps',()=>{
 const s=new StreetFootsteps()
 for(let i=0;i<120;i++)assert.equal(s.update(1/60,{x:0,y:0},'street',false),undefined)
 assert.equal(s.update(.04,{x:200,y:200},'shop',false),undefined)
 assert.equal(s.update(.04,{x:400,y:200},'shop',false),undefined)
 assert.equal(s.update(.04,{x:401,y:200},'shop',true),undefined)
 for(let i=0;i<30;i++)assert.equal(s.update(1/60,{x:401,y:200},'shop',false),undefined)
})
test('material matches the room and low frame rate never creates a burst',()=>{
 for(const [room,cue] of [['shop','wood'],['street','stone']] as const){const s=new StreetFootsteps();s.update(.2,{x:0,y:0},room,false);assert.equal(s.update(.2,{x:28,y:0},room,false),cue)}
})
