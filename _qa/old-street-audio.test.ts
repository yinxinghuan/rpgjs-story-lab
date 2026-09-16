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

test('ending cue respects unlock and mute, replaces foley, and schedules a finite release',async t=>{
 const {OldStreetAudio}=await import('../src/old-street-audio')
 const original=Object.getOwnPropertyDescriptor(globalThis,'AudioContext')
 const oscillators:Array<{type:string;startAt?:number;stopAt?:number;cancelled:boolean;onended?:()=>void;frequency:{setValueAtTime:()=>void;exponentialRampToValueAtTime:()=>void};connect:()=>void;disconnect:()=>void;start:(at:number)=>void;stop:(at?:number)=>void}>=[]
 class Context{
  state='running';currentTime=10;destination={}
  resume(){return Promise.resolve()}close(){return Promise.resolve()}
  createOscillator(){const n={type:'',cancelled:false,frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){},start(at:number){n.startAt=at},stop(at?:number){if(at===undefined){n.cancelled=true;n.onended?.()}else n.stopAt=at}} as typeof oscillators[number];oscillators.push(n);return n}
  createGain(){return{gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},disconnect(){}}}
 }
 Object.defineProperty(globalThis,'AudioContext',{value:Context,configurable:true})
 t.after(()=>{if(original)Object.defineProperty(globalThis,'AudioContext',original);else delete (globalThis as any).AudioContext})
 const audio=new OldStreetAudio()
 audio.play('ending');assert.equal(oscillators.length,0)
 audio.unlock();for(let i=0;i<4;i++)audio.play('stone')
 audio.play('ending')
 assert.equal(oscillators.length,6);assert.ok(oscillators.slice(0,4).every(n=>n.cancelled))
 assert.ok(oscillators.slice(4).every(n=>n.type==='sine'&&n.stopAt!>n.startAt!&&n.stopAt!<=11.8))
 audio.setEnabled(false);assert.ok(oscillators.every(n=>n.cancelled))
 audio.play('ending');assert.equal(oscillators.length,6)
 audio.dispose()
})
