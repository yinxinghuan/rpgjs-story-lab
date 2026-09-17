import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetBuildingEdges,oldStreetBuildingRoofs} from '../src/old-street-boundary-layout'
import {oldStreetDoors,oldStreetFloors} from '../src/old-street-space'
test('street masonry stays outside the walkable floor and all real shop entrances',()=>{
 const f=oldStreetFloors.street,edges=oldStreetBuildingEdges()
 for(const r of edges){
  assert.ok(r.height>0)
  assert.ok(r.x+r.width<=f.x||r.x>=f.x+f.w)
  for(const door of oldStreetDoors().filter(d=>d.room==='street'&&d.side===r.side))
   assert.ok(r.y+r.height<=door.position.y-28||r.y>=door.position.y+28)
 }
 assert.equal(edges.filter(e=>e.side==='W').length,2)
 assert.equal(edges.filter(e=>e.side==='E').length,2)
})

test('courtyard roofs enclose the whole hub, while every side entrance stays in its facade recess',()=>{
 for(const room of ['street','yard'] as const){
  const f=oldStreetFloors[room],roofs=oldStreetBuildingRoofs(room),facades=oldStreetBuildingEdges(room)
  assert.equal(roofs.length,2)
  for(const r of roofs){assert.equal(r.y,f.y);assert.equal(r.height,f.h);assert.ok(r.width>=36);assert.ok(r.side==='W'?r.x+r.width<f.x:r.x>f.x+f.w)}
  for(const d of oldStreetDoors().filter(d=>d.room===room&&['E','W'].includes(d.side))){
   const roof=roofs.find(r=>r.side===d.side)!
   assert.ok(roof.y<d.position.y-28&&roof.y+roof.height>d.position.y+28)
   assert.ok(facades.filter(r=>r.side===d.side).every(r=>r.y+r.height<=d.position.y-28||r.y>=d.position.y+28))
  }
 }
 for(const room of ['shop','laundry','photo','shed','cellar','darkroom','archive','roof']){assert.deepEqual(oldStreetBuildingRoofs(room),[]);assert.deepEqual(oldStreetBuildingEdges(room),[])}
})
