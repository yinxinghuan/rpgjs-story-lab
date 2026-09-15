import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {oldStreetShopWallRegions} from '../src/old-street-shop-environment-layout'
import {oldStreetDoors,oldStreetFloors} from '../src/old-street-space'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('shop wall decorations leave authoritative floor and north doorway clear',()=>{
 const floor=oldStreetFloors.shop,door=oldStreetDoors().find(d=>d.room==='shop'&&d.side==='N')!
 const regions=oldStreetShopWallRegions()
 const png=PNG.sync.read(readFileSync('doc/oldstreet-pixel-study/workshop-wall/candidate.png'))
 for(const r of regions){
  assert.ok(r.width>0&&r.height>0)
  assert.ok(r.y+r.height<=floor.y)
  assert.ok(r.x+r.width<=door.position.x-24||r.x>=door.position.x+24)
  const [x,y,w,h]=r.crop.split(' ').map(Number)
  assert.ok(x>=0&&y>=0&&x+w<=png.width&&y+h<=png.height)
  let magenta=0
  for(let py=y;py<y+h;py++)for(let px=x;px<x+w;px++){
   const i=(py*png.width+px)*4,[red,green,blue]=png.data.subarray(i,i+3)
   if(Math.min(red,blue)-green>65)magenta++
  }
  assert.equal(magenta,0,'placeholder doorway color must never enter wall crops')
 }
})
