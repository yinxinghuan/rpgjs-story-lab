import test from 'node:test'
import assert from 'node:assert/strict'
import {roofRecoveryForJourney,roofRecoveryInitial,assertRoofRecovery,roofRecoveryKnowledge,roofSpareVisible} from '../src/old-street-roof-recovery'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {resolveDomainAction,applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
import {oldStreetSpatialPlan,oldStreetDoors,oldStreetPath} from '../src/old-street-space'
const cartridge=oldStreetCartridge('en')
for(const source of ['legacy','roof','shed'])test(`roof supply ${source}: physical route, possession and old-save semantics`,()=>{
 const save=createInitialSave(cartridge)
 Object.assign(save.facts,roofRecoveryInitial,source==='legacy'?{}:{'roof-plank-source':source,'roof-plank-taken':false})
 const room=(id:string)=>{for(const n of save.map)n.current=n.id===id}
 const action=(id:string)=>resolveDomainAction(save,cartridge,'oldstreet:'+id)!
 const apply=(id:string)=>{const result=action(id);assert.equal(result.status,'accepted');applyDomainResolution(save,cartridge,result);assertRoofRecovery(save)}
 room('roof');assertRoofRecovery(save)
 if(source==='shed'){
  assert.equal(action('lay-roof-plank').status,'rejected')
  assert.equal(action('lay-carried-roof-plank').status,'rejected')
  assert.match(roofRecoveryKnowledge(save,'roof')[0].text,/workshop/)
  room('shed')
  const plan=oldStreetSpatialPlan(save),start=plan.scenes.find(s=>s.id==='shed')!.spawn
  for(const door of oldStreetDoors().filter(d=>d.room==='shed'))assert.ok(oldStreetPath('shed',start,door.approach,save).length,door.id)
  assert.ok(oldStreetPath('shed',start,plan.entities.find(e=>e.id==='watchmaker')!.approach,save).length)
  assert.equal(roofSpareVisible(save),true)
  apply('take-roof-plank')
  assert.equal(action('take-roof-plank').status,'rejected')
  assert.equal(roofSpareVisible(save),false)
  const forged=structuredClone(save);forged.inventory=forged.inventory.filter(i=>i.id!=='roof-plank')
  assert.throws(()=>assertRoofRecovery(forged),/POSSESSION/)
  room('roof');apply('lay-carried-roof-plank')
 }else{
  assert.equal(action('lay-carried-roof-plank').status,'rejected')
  apply('lay-roof-plank')
 }
 assert.ok(!save.inventory.some(i=>i.id==='roof-plank'))
 assert.equal(action('lay-roof-plank').status,'rejected')
 assert.equal(action('lay-carried-roof-plank').status,'rejected')
 assertRoofRecovery(JSON.parse(JSON.stringify(save)))
 assert.deepEqual(roofRecoveryKnowledge(save,'street'),[],'unvisited supply is not broadcast across rooms')
})
test('new supply plan is stable and can differ across journeys',()=>{
 const variants=new Set(Array.from({length:12},(_,i)=>roofRecoveryForJourney('synthetic-'+i)['roof-plank-source']))
 assert.deepEqual([...variants].sort(),['roof','shed'])
 assert.deepEqual(roofRecoveryForJourney('same-journey'),roofRecoveryForJourney('same-journey'))
})
