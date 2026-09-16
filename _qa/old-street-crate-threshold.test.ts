import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetDoors,oldStreetFloors,oldStreetProjectedProps,oldStreetWalkable,oldStreetPath,oldStreetSpatialPlan} from '../src/old-street-space'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetRuntime} from '../server/old-street-runtime'
import {assertOldStreetHead,type OldStreetHead} from '../src/old-street-head'

test('crate barrier spans the steps, touches the wall and clearing opens the same space',()=>{
 const save=createInitialSave(oldStreetCartridge('zh')),door=oldStreetDoors().find(d=>d.room==='yard'&&d.destination.room==='cellar')!
 const crates=oldStreetProjectedProps(save).find(p=>p.id==='crates')!,floor=oldStreetFloors.yard
 assert.equal(crates.body.y,floor.y)
 assert.ok(crates.body.x<=door.position.x-24&&crates.body.x+crates.body.w>=door.position.x+24)
 const spawn=oldStreetSpatialPlan(save).scenes.find(s=>s.id==='yard')!.spawn
 assert.ok(oldStreetPath('yard',spawn,crates.approach,save).length)
 // No walkable pocket exists behind the barrier, across the full stair width.
 for(let x=door.position.x-24;x<=door.position.x+24;x+=4){
  assert.equal(oldStreetWalkable('yard',{x,y:floor.y},save),false)
  assert.equal(oldStreetPath('yard',spawn,{x,y:floor.y},save).length,0)
 }
 save.facts['crates-cleared']=true
 assert.ok(oldStreetPath('yard',spawn,door.approach,save).length)
 assert.equal(oldStreetWalkable('yard',{x:door.position.x,y:floor.y},save),true)
 const moved=oldStreetProjectedProps(save).find(p=>p.id==='crates')!
 assert.ok(moved.body.y>crates.body.y+crates.body.h)
 assert.equal(oldStreetWalkable('yard',moved.body,save),false)
})

test('old journey in former gap moves safely without losing story or clear-state',()=>{
 const runtime=oldStreetRuntime(()=>true)
 for(const cleared of [false,true]){
  const save=createInitialSave(oldStreetCartridge('zh'))
  save.map.forEach(n=>{n.current=n.id==='yard'})
  save.facts['crates-cleared']=cleared
  save.inventory.push({id:'trolley',label:'借来的推车',count:1})
  const before:OldStreetHead={id:'synthetic-crate-migration',version:9,mapVersion:'oldstreet-furniture-3',sceneId:'yard',position:cleared?{x:60,y:268}:{x:136,y:48},save}
  assertOldStreetHead(before)
  assert.equal(oldStreetWalkable('yard',before.position,save),false)
  const next=runtime.upgrade!(before)
  assertOldStreetHead(next)
  assert.equal(next.mapVersion,oldStreetSpatialPlan().mapVersion)
  assert.equal(oldStreetWalkable('yard',next.position,next.save),true)
  assert.notDeepEqual(next.position,before.position)
  assert.deepEqual(next.save,before.save)
  assert.deepEqual(runtime.upgrade!(next),next)
 }
})

test('reverse cellar entrance has the same closed/open physical obstruction',()=>{
 const save=createInitialSave(oldStreetCartridge('zh')),door=oldStreetDoors().find(d=>d.room==='cellar'&&d.destination.room==='yard')!
 const blocked={x:door.position.x,y:door.position.y-28}
 assert.equal(oldStreetWalkable('cellar',blocked,save),false)
 assert.equal(oldStreetWalkable('cellar',door.approach,save),true)
 save.facts['crates-cleared']=true
 assert.equal(oldStreetWalkable('cellar',blocked,save),true)
})
