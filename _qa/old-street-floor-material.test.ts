import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {oldStreetWoodTile,oldStreetWoodSource} from '../src/old-street-floor-material'
test('current floor candidate matches decoded dimensions and keeps source aspect ratio',()=>{
 const png=readFileSync(new URL('../doc/oldstreet-pixel-study/floor-narrow/candidate-actual.png',import.meta.url))
 const width=png.readUInt32BE(16),height=png.readUInt32BE(20)
 assert.equal(width,oldStreetWoodSource.width);assert.equal(height,oldStreetWoodSource.height)
 assert.ok(Math.abs(oldStreetWoodTile.width/width-oldStreetWoodTile.height/height)<1e-9)
 // A scale guard, not a visual admission or a measurement of every irregular plank.
 const approximateBoardWidth=oldStreetWoodTile.width/oldStreetWoodSource.observedColumns
 assert.ok(approximateBoardWidth>=6&&approximateBoardWidth<=8)
})
