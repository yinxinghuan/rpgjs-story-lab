import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {oldStreetShedWallRegions} from '../src/old-street-shed-environment-layout'
import {oldStreetFloors,oldStreetDoors,oldStreetWalkable} from '../src/old-street-space'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('shed wall uses real stairs and excludes generated matte without stretching its panels',()=>{
 const image=PNG.sync.read(readFileSync(new URL('../doc/oldstreet-shed-wall/candidate.png',import.meta.url))),regions=oldStreetShedWallRegions(),floor=oldStreetFloors.shed,stairs=oldStreetDoors().find(d=>d.room==='shed'&&d.side==='N')!
 assert.equal(image.width,768);assert.equal(image.height,256)
 assert.equal(regions[0].x+regions[0].width,stairs.position.x-28);assert.equal(regions[1].x,stairs.position.x+28)
 for(const r of regions){assert.equal(r.y+r.height,floor.y);assert.equal(r.width/r.crop.width,.25);assert.equal(r.height/r.crop.height,.25)
  for(let y=r.crop.y;y<r.crop.y+r.crop.height;y++)for(let x=r.crop.x;x<r.crop.x+r.crop.width;x++){const i=(y*image.width+x)*4;assert.ok(!(Math.min(image.data[i],image.data[i+2])>100&&Math.min(image.data[i],image.data[i+2])-image.data[i+1]>80),'magenta inside used crop')}
 }
 assert.ok(oldStreetWalkable('shed',stairs.approach,{facts:{}}))
})
