import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {oldStreetWoodRegion,oldStreetWoodSource} from '../src/old-street-floor-material'
import {oldStreetFloors,oldStreetDoors,oldStreetWalkable} from '../src/old-street-space'
test('wood floor crops fit the real source with identical pixel density and no aspect distortion',()=>{
 const png=readFileSync(new URL('../doc/oldstreet-pixel-study/floor/candidate.png',import.meta.url))
 assert.equal(png.readUInt32BE(16),oldStreetWoodSource.width);assert.equal(png.readUInt32BE(20),oldStreetWoodSource.height)
 for(const room of ['shop','shed'] as const){const {floor,crop}=oldStreetWoodRegion(room)!
  assert.deepEqual(floor,oldStreetFloors[room]);assert.equal(crop.width/floor.w,2);assert.equal(crop.height/floor.h,2)
  assert.ok(crop.x>=0&&crop.y>=0&&crop.x+crop.width<=448&&crop.y+crop.height<=832)
  assert.equal(crop.x%2,0);assert.equal(crop.y%2,0)
  for(const door of oldStreetDoors().filter(d=>d.room===room))assert.ok(oldStreetWalkable(room,door.approach,{facts:{'crates-cleared':true}}))
 }
 assert.deepEqual(oldStreetWoodRegion('shop')!.crop,{x:0,y:0,width:448,height:832})
 assert.equal(oldStreetWoodRegion('laundry'),null);assert.equal(oldStreetWoodRegion('photo'),null)
})
