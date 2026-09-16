import test from 'node:test'
import assert from 'node:assert/strict'
import {OldStreetResidentMotion} from '../src/old-street-resident-motion'
import {oldStreetProjectedProps,oldStreetWalkable,oldStreetBody,oldStreetSpatialPlan,bindOldStreet} from '../src/old-street-space'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
const save=createInitialSave(oldStreetCartridge('zh'))
const home=oldStreetProjectedProps(save).find(p=>p.id==='watchmaker')!.position
const far={x:100,y:420}
test('laundry owner and photographer share moving body and interaction projection',()=>{
 for(const id of ['laundry-owner','photographer'] as const){
  const original=oldStreetProjectedProps(save).find(p=>p.id===id)!
  const residents={[id]:{x:original.position.x-24,y:original.position.y}}
  const moved=oldStreetProjectedProps(save,residents).find(p=>p.id===id)!
  assert.equal(moved.body.x,original.body.x-24)
  assert.equal(moved.approach.x,original.approach.x-24)
  assert.deepEqual(moved.actions,original.actions)
  assert.equal(oldStreetWalkable(moved.room,moved.body,save,{w:32,h:28},residents),false)
  assert.equal(oldStreetWalkable(moved.room,moved.body,save,{w:32,h:28},residents,true,id),true)
  const other=oldStreetProjectedProps(save).find(p=>p.room===moved.room&&p.id!==id)!
  assert.equal(oldStreetWalkable(other.room,other.body,save,{w:32,h:28},residents,true,id),false)
  assert.deepEqual(oldStreetProjectedProps(save).find(p=>p.id===id),original)
 }
})
test('resident gait follows displacement across frame rates and stays within the work area',()=>{
 const results=[]
 for(const fps of [30,60,120]){const m=new OldStreetResidentMotion(home),poses=new Set<string>();let min=home.x,max=home.x
  for(let i=0;i<fps*20;i++){m.update(1/fps,far,false,false,()=>true);min=Math.min(min,m.position.x);max=Math.max(max,m.position.x);poses.add(m.pose)}
  assert.ok(min>=home.x-24&&max<=home.x+24);assert.ok(poses.has('stride-0')&&poses.has('stride-2'));results.push(m.position.x)
 }
 assert.ok(Math.max(...results)-Math.min(...results)<2)
})
test('first short walk shows both feet, with no held pose longer than a quarter second',()=>{
 for(const fps of [30,60,120]){
  const m=new OldStreetResidentMotion(home),sequence:string[]=[]
  let moving=false,held=0,longest=0,previous='stand'
  for(let i=0;i<fps*5;i++){
   m.update(1/fps,far,false,false,()=>true)
   if(m.pose==='stand'){if(moving)break;continue}
   moving=true
   if(m.pose!==previous){sequence.push(m.pose);held=0}
   held+=1/fps;longest=Math.max(longest,held);previous=m.pose
  }
  assert.deepEqual(sequence.slice(0,4),['stride-0','stride-1','stride-2','stride-1'])
  assert.ok(longest<=.25,`${fps}fps held a pose for ${longest}s`)
  assert.ok(Math.abs(m.position.x-home.x-24)<.01)
 }
})
test('attention and pause reset a planted gait; resuming does not jump to the old phase',()=>{
 for(const reason of ['attention','pause'] as const){
  const m=new OldStreetResidentMotion(home)
  for(let i=0;i<300&&m.pose!=='stride-2';i++)m.update(1/60,far,false,false,()=>true)
  assert.equal(m.pose,'stride-2')
  const stopped={...m.position}
  m.update(1/60,reason==='attention'?{x:stopped.x,y:stopped.y+50}:far,reason==='pause',false,()=>true)
  assert.equal(m.pose,'stand');assert.deepEqual(m.position,stopped)
  m.update(1/60,far,false,false,()=>true)
  assert.equal(m.pose,'stride-0')
 }
})
test('approach, selection, pause and blocked movement all stop actual displacement',()=>{
 const m=new OldStreetResidentMotion(home)
 for(let i=0;i<220;i++)m.update(1/60,far,false,false,()=>true)
 const stopped={...m.position}
 for(let i=0;i<120;i++)m.update(1/60,{x:stopped.x,y:stopped.y+50},false,false,()=>true)
 assert.deepEqual(m.position,stopped);assert.equal(m.direction,'down');assert.equal(m.pose,'stand')
 for(const [paused,selected,walkable] of [[true,false,true],[false,true,true],[false,false,false]] as const){m.update(.04,far,paused,selected,()=>walkable);assert.deepEqual(m.position,stopped);assert.equal(m.pose,'stand')}
 m.update(4,far,false,false,()=>true);assert.deepEqual(m.position,stopped)
})
test('interaction pause keeps the resident still while facing the nearby speaker',()=>{
 const m=new OldStreetResidentMotion(home)
 for(const [offset,direction] of [[{x:-50,y:0},'left'],[{x:50,y:0},'right'],[{x:0,y:-50},'up'],[{x:0,y:50},'down']] as const){
  m.update(1/60,{x:home.x+offset.x,y:home.y+offset.y},true,false,()=>{throw new Error('paused resident must not attempt a step')})
  assert.deepEqual(m.position,home);assert.equal(m.pose,'stand');assert.equal(m.direction,direction)
 }
 m.update(1/60,far,true,false,()=>true)
 assert.deepEqual(m.position,home);assert.equal(m.direction,'down')
})
test('moving position drives body and approach, without a stale authoritative person wall',()=>{
 for(const dx of [-24,0,24]){
  const p={x:home.x+dx,y:home.y},positions={watchmaker:p},prop=oldStreetProjectedProps(save,positions).find(p=>p.id==='watchmaker')!
  assert.equal(prop.body.x,p.x-12);assert.equal(prop.approach.x,p.x)
  assert.ok(oldStreetWalkable('shed',prop.approach,save,oldStreetBody,positions))
  assert.ok(!oldStreetWalkable('shed',{x:p.x,y:p.y},save,oldStreetBody,positions))
  assert.ok(oldStreetWalkable('shed',{x:p.x,y:p.y},save))
  const canonical=oldStreetSpatialPlan(save).entities.find(e=>e.id==='watchmaker')!
  assert.ok(Math.hypot(prop.approach.x-canonical.position.x,prop.approach.y-canonical.position.y)<=54)
  assert.ok(bindOldStreet('zh',save))
 }
})
test('restoring a player on the home position chooses a nonoverlapping resident arrival',()=>{
 for(let x=home.x-12;x<=home.x+20;x+=4){const hero={x,y:home.y},m=new OldStreetResidentMotion(home,hero)
 assert.ok(oldStreetWalkable('shed',hero,save,oldStreetBody,{watchmaker:m.position}))}
})
