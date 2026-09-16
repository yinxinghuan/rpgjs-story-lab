import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetPerson,recordOldStreetInteraction,usesCurrentLaundryCast,laundryCastVersionFact,usesCurrentPhotographerCast,photographerCastVersionFact,oldStreetCastArtVersion} from '../src/old-street-characters'
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

for(const locale of ['zh','en'] as const)test(`photographer appearance, introduction and restored speaker agree (${locale})`,()=>{
 for(const legacy of [false,true]){
  const save=createInitialSave(oldStreetCartridge(locale))
  if(legacy)delete save.facts[photographerCastVersionFact]
  assert.equal(usesCurrentPhotographerCast(save),!legacy)
  assert.equal(oldStreetCastArtVersion(save),legacy?'2:1':'2:2')
  assert.equal(save.characters.length,0)
  assert.match(oldStreetPerson('photographer',save)!.appearance[locale==='zh'?0:1],legacy?/眼镜|glasses/:/深蓝|navy/)
  const blocks=recordOldStreetInteraction(save,'photographer','oldstreet:greet-photographer','hello','intro')
  const name=locale==='zh'?(legacy?'许青':'诺拉'):(legacy?'Xu Qing':'Nora')
  assert.match(blocks[0].text,legacy?/蓝色衬衫|blue shirt/:/深蓝工作服|navy workwear/)
  assert.equal(blocks[1].speaker,name)
  const restored=JSON.parse(JSON.stringify(save)),history=JSON.stringify(restored.blocks)
  assert.equal(restored.characters.find((c:{id:string})=>c.id==='xu-photographer')?.name,name)
  assert.equal(oldStreetTalkBlocks(restored,'photographer','chat','hi','hello')[1].speaker,name)
  assert.equal(JSON.stringify(restored.blocks),history)
 }
})

for(const [entity,room,axis,radius] of [['laundry-owner','laundry','y',9],['photographer','photo','x',24]] as const)test(`${entity} pacing stays collision-free and its projected approach remains in authoritative range`,()=>{
 const save=createInitialSave(oldStreetCartridge('en')),home=oldStreetProjectedProps(save).find(p=>p.id===entity)!.position
 for(const fps of [30,60,120]){
  const m=new OldStreetResidentMotion(home,undefined,axis,radius),directions=new Set(),poses=new Set()
  for(let i=0;i<fps*15;i++){
   const positions=()=>({[entity]:m.position})
   m.update(1/fps,{x:0,y:0},false,false,p=>oldStreetWalkable(room,{x:p.x-12,y:p.y-12},save,{w:32,h:28},positions(),true,entity))
   directions.add(m.direction);poses.add(m.pose)
   assert.equal(m.position[axis==='x'?'y':'x'],home[axis==='x'?'y':'x']);assert.ok(Math.abs(m.position[axis]-home[axis])<=radius+.001)
   const prop=oldStreetProjectedProps(save,positions()).find(p=>p.id===entity)!
   assert.ok(oldStreetWalkable(room,prop.approach,save,oldStreetBody,positions()))
   assert.ok(bindOldStreet('en',save).canInteract(entity,room,prop.approach))
  }
  assert.ok(directions.has(axis==='x'?'left':'up')&&directions.has(axis==='x'?'right':'down'))
  assert.ok(poses.has('stride-0')&&poses.has('stride-2'))
  const before={...m.position};m.update(1/fps,{x:before.x,y:before.y+45},false,false,()=>true)
  assert.deepEqual(m.position,before);assert.equal(m.pose,'stand');assert.equal(m.direction,'down')
 }
 const hero={...home},m=new OldStreetResidentMotion(home,hero,axis,radius)
 assert.ok(oldStreetWalkable(room,hero,save,oldStreetBody,{[entity]:m.position}))
 const prop=oldStreetProjectedProps(save,{[entity]:m.position}).find(p=>p.id===entity)!
 assert.ok(bindOldStreet('en',save).canInteract(entity,room,prop.approach))
})
