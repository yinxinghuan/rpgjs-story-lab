import {test} from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetLocalMap} from '../src/old-street-map-layout'
import {oldStreetRooms,type OldStreetRoom} from '../src/old-street-cartridge'
import {oldStreetDoors,oldStreetFloors} from '../src/old-street-space'

test('nearby map follows all actual exit sides, threshold order and discovery',()=>{
 const rooms=Object.keys(oldStreetRooms) as OldStreetRoom[],known=new Set(rooms)
 for(const room of rooms){
  const exits=oldStreetLocalMap(room,known),doors=oldStreetDoors().filter(d=>d.room===room),floor=oldStreetFloors[room]
  assert.equal(exits.length,doors.length)
  for(const {door,point,label} of exits){
   assert.ok(Math.abs(point[0]-(116+(door.position.x-floor.x)/floor.w*108))<.001)
   assert.ok(Math.abs(point[1]-(110+(door.position.y-floor.y)/floor.h*230))<.001)
   assert.ok(door.side==='N'?label[1]<110:door.side==='S'?label[1]>340:door.side==='W'?label[0]<116:label[0]>224)
   assert.equal(oldStreetLocalMap(room,new Set([room])).length,0)
  }
  for(const side of ['W','E']){
   const group=exits.filter(e=>e.door.side===side).sort((a,b)=>a.point[1]-b.point[1])
   for(let i=1;i<group.length;i++)assert.ok(group[i].label[1]-group[i-1].label[1]>=100)
  }
 }
})
