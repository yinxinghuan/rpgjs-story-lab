import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync} from 'node:fs'
import {repairHeroBackStride} from '../src/hero-back-gait-repair'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('B hero repair preserves all other pixels and changes trailing boot sides without flipping the satchel',()=>{
 const decoded=PNG.sync.read(readFileSync('public/art/overhead/hero.png'))
 const source={width:decoded.width,height:decoded.height,rgba:new Uint8ClampedArray(decoded.data)},snapshot=new Uint8ClampedArray(source.rgba),out=repairHeroBackStride(source)
 let changed=0
 for(let y=0;y<1448;y++)for(let x=0;x<1086;x++){
  const i=(y*1086+x)*4,original=source.rgba.subarray(i,i+4),result=out.rgba.subarray(i,i+4)
  if(x<724||y<1086+266)assert.deepEqual(result,original)
  else if(!original.every((v,n)=>v===result[n]))changed++
 }
 assert.ok(changed>1000);assert.deepEqual(source.rgba,snapshot)
 const footSide=(pixels:Uint8ClampedArray,col:number)=>{
  const count=[0,0];for(let y=308;y<330;y++)for(let x=0;x<362;x++)if(pixels[((1086+y)*1086+col*362+x)*4+3]>200)count[x<181?0:1]++
  return count[0]>count[1]?'left':'right'
 }
 assert.equal(footSide(source.rgba,0),footSide(source.rgba,2))
 assert.notEqual(footSide(out.rgba,0),footSide(out.rgba,2))
 const shipped=PNG.sync.read(readFileSync('public/art/overhead/hero-gait-v2.png'))
 assert.deepEqual(new Uint8ClampedArray(shipped.data),out.rgba)
})
