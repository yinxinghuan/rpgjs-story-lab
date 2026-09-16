import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetPerson,recordOldStreetInteraction,usesCurrentLaundryCast,laundryCastVersionFact} from '../src/old-street-characters'
import {oldStreetTalkBlocks} from '../src/old-street-conversation'
import {OldStreetResidentMotion} from '../src/old-street-resident-motion'
import {oldStreetProjectedProps,oldStreetWalkable,bindOldStreet,oldStreetBody} from '../src/old-street-space'

for(const locale of ['zh','en'] as const)test(`new and legacy laundry appearances retain their own visible introduction (${locale})`,()=>{
 for(const legacy of [false,true]){
  const save=createInitialSave(oldStreetCartridge(locale))
  if(legacy)delete save.facts[laundryCastVersionFact]
  assert.equal(usesCurrentLaundryCast(save),!legacy)
  assert.equal(save.characters.length,0)
  const appearance=oldStreetPerson('laundry-owner',save)!.appearance[locale==='zh'?0:1]
  assert.match(appearance,legacy?/围裙|apron/:/青绿|teal/)
  const blocks=recordOldStreetInteraction(save,'laundry-owner','oldstreet:greet-laundry','hello','intro')
  const name=locale==='zh'?(legacy?'阿岚':'玛拉'):(legacy?'Lan':'Mara')
  assert.match(blocks[0].text,legacy?/围裙|apron/:/青绿|teal/)
  assert.equal(blocks[1].speaker,name)
  assert.equal(save.characters.find(c=>c.id==='lan-laundry')?.name,name)
  const restored=JSON.parse(JSON.stringify(save)),history=JSON.stringify(restored.blocks)
  assert.equal(usesCurrentLaundryCast(restored),!legacy)
  assert.equal(oldStreetTalkBlocks(restored,'laundry-owner','chat','hi','hello')[1].speaker,name)
  assert.equal(JSON.stringify(restored.blocks),history)
 }
})

test('laundry pacing stays collision-free and its projected approach remains in authoritative range',()=>{
 const save=createInitialSave(oldStreetCartridge('en')),home=oldStreetProjectedProps(save).find(p=>p.id==='laundry-owner')!.position
 for(const fps of [30,60,120]){
  const m=new OldStreetResidentMotion(home,undefined,'y',9),directions=new Set(),poses=new Set()
  for(let i=0;i<fps*15;i++){
   const positions=()=>({'laundry-owner':m.position})
   m.update(1/fps,{x:0,y:0},false,false,p=>oldStreetWalkable('laundry',{x:p.x-12,y:p.y-12},save,{w:32,h:28},positions(),true,'laundry-owner'))
   directions.add(m.direction);poses.add(m.pose)
   assert.equal(m.position.x,home.x);assert.ok(Math.abs(m.position.y-home.y)<=9.001)
   const prop=oldStreetProjectedProps(save,positions()).find(p=>p.id==='laundry-owner')!
   assert.ok(oldStreetWalkable('laundry',prop.approach,save,oldStreetBody,positions()))
   assert.ok(bindOldStreet('en',save).canInteract('laundry-owner','laundry',prop.approach))
  }
  assert.ok(directions.has('up')&&directions.has('down'))
  assert.ok(poses.has('stride-0')&&poses.has('stride-2'))
  const before={...m.position};m.update(1/fps,{x:before.x,y:before.y+45},false,false,()=>true)
  assert.deepEqual(m.position,before);assert.equal(m.pose,'stand');assert.equal(m.direction,'down')
 }
 const hero={...home},m=new OldStreetResidentMotion(home,hero,'y',9)
 assert.ok(oldStreetWalkable('laundry',hero,save,oldStreetBody,{'laundry-owner':m.position}))
 const prop=oldStreetProjectedProps(save,{'laundry-owner':m.position}).find(p=>p.id==='laundry-owner')!
 assert.ok(bindOldStreet('en',save).canInteract('laundry-owner','laundry',prop.approach))
})
