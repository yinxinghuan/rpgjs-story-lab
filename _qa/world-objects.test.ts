import {test} from 'node:test'
import assert from 'node:assert/strict'
import {worldObjects,objectId,objectAtlas,objectFrame,objectSheets,projectWorldObjects,objectAnimation} from '../src/world-objects'
import {sceneIds,scenes} from '../src/scene-layout'
import {initialStory} from '../src/story'

test('world object atlas frames stay inside admitted sources and preserve world bounds in both directions',()=>{
 const ids=new Set<string>()
 for(const scene of sceneIds)for(const object of worldObjects[scene]){
  const id=objectId(scene,object.id);assert.ok(!ids.has(id));ids.add(id)
  for(const variant of ['balanced','baseline'] as const){
   const atlas=objectAtlas(object,variant)
   for(const state of object.states){
    const crop=atlas.crops[state];assert.ok(crop,`${id}/${state}`)
    const [x,y,w,h]=crop;assert.ok(x>=0&&y>=0&&w>0&&h>0&&x+w<=atlas.width&&y+h<=atlas.height)
    const f=objectFrame(object,crop),r=object.rect
    assert.ok(Math.abs(Math.round(r.x+r.w/2)+f.x-f.rect.w/2-f.rect.x)<1e-8)
    assert.ok(f.rect.x>=r.x-1e-8&&f.rect.y>=r.y-1e-8&&f.rect.x+f.rect.w<=r.x+r.w+1e-8&&f.rect.y+f.rect.h<=r.y+r.h+1e-8)
    // The event's bottom anchor plus frame offset must land exactly at the old visual rectangle.
    assert.ok(Math.abs(object.depth-1+f.y-(f.rect.y+f.rect.h))<1e-8)
    if(object.fit==='contain')assert.ok(Math.abs(f.scale[0]-f.scale[1])<1e-8)
    else assert.deepEqual(f.rect,{x:r.x,y:r.y,w:r.w,h:r.h})
   }
  }
 }
 for(const variant of ['balanced','baseline'] as const){const sheets=objectSheets(variant);assert.equal(sheets.length,ids.size);assert.ok(sheets.every(s=>s.textures.stand));for(const sheet of sheets){assert.equal(sheet.textures.hidden.animations()[0][0].opacity,0);assert.equal(sheet.textures.stand.animations()[0][0].opacity,1)}}
})

test('furniture shares collision layout and cabinet contents share their supporting object depth',()=>{
 for(const scene of sceneIds)for(const furniture of scenes[scene].furniture){
  const object=worldObjects[scene].find(o=>o.id===furniture.id)!
  assert.equal(object.rect,furniture);assert.equal(object.depth,furniture.y+furniture.h)
 }
 const supply=worldObjects.baggage.find(o=>o.id==='supply')!,battery=worldObjects.baggage.find(o=>o.id==='supply-battery')!
 assert.ok(battery.depth>supply.depth&&battery.depth-supply.depth<=1);assert.equal(battery.parent,supply.id)
})

test('render projection follows authoritative cabinet, battery, power and radio facts without changing the save',()=>{
 const save=initialStory('zh'),before=structuredClone(save)
 const view=(scene:typeof sceneIds[number],id:string)=>projectWorldObjects(scene,save).find(p=>p.id===objectId(scene,id))!
 assert.equal(view('carriage','cabinet').state,'closed');assert.equal(view('baggage','supply-battery').visible,false)
 assert.deepEqual(save,before)
 save.facts.cabinet_open=true;assert.equal(view('carriage','cabinet').state,'open')
 save.facts.fuse_taken=true;assert.equal(view('carriage','cabinet').state,'empty')
 save.facts.supply_open=true;assert.equal(view('baggage','supply').state,'empty');assert.equal(view('baggage','supply-battery').visible,true)
 assert.equal(objectAnimation(view('baggage','supply-battery')),'battery')
 save.facts.battery_taken=true;assert.equal(view('baggage','supply-battery').visible,false)
 assert.equal(objectAnimation(view('baggage','supply-battery')),'hidden')
 save.facts.repaired=true;assert.equal(view('carriage','panel').state,'repaired');assert.equal(view('carriage','exit').state,'doorOpen')
 save.facts.battery_installed=true;assert.equal(view('cab','radio').state,'powered')
 save.facts.power_radio=true;assert.ok(projectWorldObjects('carriage',save).every(p=>p.tint==='#b8b8b8'))
 save.facts.rescue_sent=true;assert.equal(view('cab','radio').state,'connected')
 for(const scene of sceneIds)for(const projection of projectWorldObjects(scene,save))assert.ok(worldObjects[scene].find(o=>objectId(scene,o.id)===projection.id)!.states.includes(projection.state))
})
