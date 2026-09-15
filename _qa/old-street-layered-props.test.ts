import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {oldStreetPixelLayeredSheets} from '../src/old-street-prop-art'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
for(const kind of ['drawer','letter-compartment'] as const)test(`${kind}: fixed surface pixels and contiguous state layers`,()=>{
 const path=kind==='drawer'?'drawer/cutout.png':'props/orthogonal/cutout.png'
 const png=PNG.sync.read(readFileSync('doc/oldstreet-pixel-study/'+path))
 const [top,front]=oldStreetPixelLayeredSheets('source-image',kind)
 const samples:Buffer[]=[]
 for(const state of ['closed','open','empty']){
  const t=top.textures[state],b=front.textures[state]
  for(const layer of [t,b]){
   assert.ok(layer.offset.x>=0&&layer.offset.y>=0)
   assert.ok(layer.offset.x+layer.rectWidth<=png.width)
   assert.ok(layer.offset.y+layer.rectHeight<=png.height)
  }
  const chunks:Buffer[]=[]
  for(let y=t.offset.y;y<t.offset.y+t.rectHeight;y++)chunks.push(png.data.subarray((y*png.width+t.offset.x)*4,(y*png.width+t.offset.x+t.rectWidth)*4))
  samples.push(Buffer.concat(chunks))
  const tf=t.animations()[0][0],bf=b.animations()[0][0]
  const topBottom=tf.y+(1-tf.anchor[1])*t.rectHeight*tf.scale[1]
  const frontTop=bf.y-bf.anchor[1]*b.rectHeight*bf.scale[1]
  assert.ok(Math.abs(topBottom-frontTop)<.001,`${state}: no gap at layer seam`)
 }
 assert.deepEqual(samples[0],samples[1]);assert.deepEqual(samples[0],samples[2])
 assert.ok(samples[0].some((v,i)=>i%4===3&&v>0),'fixed surface must contain visible pixels')
 assert.notDeepEqual(front.textures.closed.offset,front.textures.open.offset,'state front really changes')
})
