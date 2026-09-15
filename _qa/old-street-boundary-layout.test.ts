import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetBuildingEdges} from '../src/old-street-boundary-layout'
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
