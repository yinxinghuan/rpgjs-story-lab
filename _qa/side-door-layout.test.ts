import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetDoors} from '../src/old-street-space'
import {isSidePassage,roomSidePassages,sideDoorStyle,sideLeafPlacement} from '../src/old-street-side-door-layout'
test('every lateral non-stair endpoint has an explicit passage/leaf direction; none are missed',()=>{
 const all=oldStreetDoors().filter(isSidePassage)
 assert.ok(all.length>=8)
 for(const door of all){const s=sideDoorStyle(door);assert.ok([door.room,door.destination.room].includes(s.opensInto));const p=sideLeafPlacement(door);assert.ok(p.width<56);assert.equal(Math.abs(p.direction),1)}
 assert.equal(all.filter(d=>sideDoorStyle(d).leaf==='none').length,2)
})
test('opposite W/E exterior doors open toward the street without rotating their projection',()=>{
 const street=roomSidePassages('street',{}).map(sideLeafPlacement)
 assert.equal(street.length,2);assert.deepEqual(street.map(p=>p.direction),[1,-1]);assert.ok(street.every(p=>p.towardRoom))
 assert.equal(sideLeafPlacement(roomSidePassages('shed',{})[0]).towardRoom,true)
})
test('uncreated archive/darkroom remain solid while closed authored gates retain a threshold',()=>{
 assert.equal(roomSidePassages('cellar',{}).length,0);assert.equal(roomSidePassages('photo',{}).length,0)
 assert.equal(roomSidePassages('cellar',{'archive-ready':true}).length,1)
 assert.equal(roomSidePassages('photo',{'darkroom-ready':true}).length,1)
 assert.equal(roomSidePassages('shed',{}).length,1)
})
test('open leaf collision shares its rendered hinge and leaves the original entry approach clear',async()=>{
 const {openSideLeafBody}=await import('../src/old-street-side-door-config')
 const {oldStreetWalkable,oldStreetBody}=await import('../src/old-street-space')
 const facts={'yard-unlatched':true,'darkroom-ready':true,'archive-ready':true}
 for(const d of oldStreetDoors().filter(isSidePassage)){
  const b=openSideLeafBody(d,facts),p=sideLeafPlacement(d)
  assert.equal(p.y,d.position.y-28,'upper jamb anchor')
  assert.equal(p.width,56-8,'leaf matches passage opening with hinge clearance')
  assert.ok(oldStreetWalkable(d.room,d.approach,{facts}),d.id+' approach')
  if(b){assert.equal(b.w,p.width);assert.equal(oldStreetWalkable(d.room,{x:b.x+b.w/2-8,y:b.y-oldStreetBody.h+2},{facts}),false,d.id+' solid leaf')}
 }
})
