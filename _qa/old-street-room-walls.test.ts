import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetInteriorRooms,oldStreetRoomWalls,roomWallSize,oldStreetWallReveal} from '../src/old-street-room-walls'
import {oldStreetDoors,oldStreetWalkable,oldStreetBody} from '../src/old-street-space'
const open={'darkroom-ready':true,'archive-ready':true}
test('all indoor wall spans use authoritative floors and leave every door opening clear',()=>{
 for(const room of oldStreetInteriorRooms){
  const w=oldStreetRoomWalls(room,open)!;assert.ok(w.north.length&&w.south.length)
  for(const d of oldStreetDoors().filter(d=>d.room===room)){
   const rows={N:w.north,S:w.south,W:w.west,E:w.east}[d.side],p=['N','S'].includes(d.side)?d.position.x:d.position.y
   assert.ok(rows.every(r=>r.start+r.length<=p-roomWallSize.doorHalf||r.start>=p+roomWallSize.doorHalf),room+':'+d.id)
   assert.ok(oldStreetWalkable(room,d.approach,{facts:open}),room+' door approach remains walkable')
  }
  for(const r of [...w.north,...w.south,...w.west,...w.east])assert.ok(r.length>0)
  const foot={x:w.floor.x+40,y:w.floor.y+w.floor.h-oldStreetBody.h-2}
  assert.ok(oldStreetWalkable(room,foot,{facts:open}),room+' near-wall position remains playable')
  assert.equal(roomWallSize.foreground+roomWallSize.thickness,roomWallSize.back);assert.ok(w.floor.y-roomWallSize.back>=0)
 }
})
test('unadmitted dynamic doors have a solid wall; admission opens that same side',()=>{
 for(const room of ['photo','cellar'] as const){const before=oldStreetRoomWalls(room,{})!,after=oldStreetRoomWalls(room,open)!;assert.equal(before.east.length,1);assert.equal(after.east.length,2)}

})

test('local reveal follows an occluded actor but leaves empty walls and doorways opaque',()=>{
 const room='photo',wall=oldStreetRoomWalls(room,open)!,y=wall.floor.y+wall.floor.h-28
 assert.ok(oldStreetWallReveal(room,open,{x:wall.floor.x+32,y}))
 assert.equal(oldStreetWallReveal(room,open,{x:184,y}),null)
 assert.equal(oldStreetWallReveal(room,open,{x:104,y:160}),null)
 assert.equal(oldStreetWallReveal(room,open),null)
 assert.equal(oldStreetWallReveal('street',open,{x:104,y}),null)
})

test('outdoor walls match top and bottom heights and keep stairs, alleys and home open',()=>{
 for(const room of ['street','yard','roof'] as const){
  const wall=oldStreetRoomWalls(room,open),s=wall.size
  assert.equal(s.back,s.foreground+s.thickness);assert.ok(wall.floor.y-s.back>=0)
  assert.ok(wall.north.length&&wall.south.length)
  for(const d of oldStreetDoors().filter(d=>d.room===room)){
   const rows={N:wall.north,S:wall.south,W:wall.west,E:wall.east}[d.side],p=['N','S'].includes(d.side)?d.position.x:d.position.y
   assert.ok(rows.every(r=>r.start+r.length<=p-s.doorHalf||r.start>=p+s.doorHalf))
   assert.ok(oldStreetWalkable(room,d.approach,{facts:open}))
  }
  assert.ok(oldStreetWallReveal(room,open,{x:wall.floor.x+40,y:wall.floor.y+wall.floor.h-28}))
 }
 const street=oldStreetRoomWalls('street',open)
 assert.ok(street.south.every(r=>r.start+r.length<=164||r.start>=220))
 assert.equal(oldStreetWallReveal('street',open,{x:184,y:516}),null)
})
