import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {oldStreetDrawerSheet} from '../src/old-street-prop-art'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('pixel drawer measured tabletop remains fixed in world coordinates across states',()=>{
 const p=PNG.sync.read(readFileSync('doc/oldstreet-pixel-study/drawer/cutout.png'))
 const sheet=oldStreetDrawerSheet('synthetic-image',true)
 const extents=Object.values(sheet.textures).map(texture=>{
  const f=texture.animations()[0][0];let left=512,right=-1
  for(let y=190;y<=355;y++)for(let x=0;x<512;x++)if(p.data[(y*p.width+f.frameX*512+x)*4+3]>230){left=Math.min(left,x);right=Math.max(right,x)}
  assert.ok(right>left,'tabletop must be present in actual PNG')
  return {center:((left+right)/2-f.anchor[0]*512)*f.scale[0]+f.x,width:(right-left+1)*f.scale[0],ground:(498-f.anchor[1]*768)*f.scale[1]+f.y}
 })
 for(const state of extents){assert.ok(Math.abs(state.center-16)<.001);assert.ok(Math.abs(state.width-40.48)<.001);assert.ok(Math.abs(state.ground-28)<.001)}
})
