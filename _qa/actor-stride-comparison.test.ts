import test from 'node:test'
import assert from 'node:assert/strict'
import {compareActorStrides} from '../src/actor-stride-comparison'
import type {PixelRaster} from '../src/sprite-preparation'
function raster(){const r:PixelRaster={width:144,height:192,rgba:new Uint8ClampedArray(144*192*4)};for(let row=0;row<4;row++)for(let col=0;col<3;col++)for(let y=8;y<44;y++)for(let x=16;x<31;x++)if(y<32||x<22){const i=((row*48+y)*144+col*48+x)*4;r.rgba.set([40,70,90,255],i)}return r}
test('identical legs flag repeated pose risk, ignoring invisible matte colors',()=>{const r=raster();for(let i=0;i<r.rgba.length;i+=4)if(!r.rgba[i+3])r.rgba.set([i%255,123,209],i);for(const v of Object.values(compareActorStrides(r))){assert.equal(v.similar,true);assert.equal(v.difference,0);assert.equal(v.overlap,1)}})
test('small alignment jitter cannot hide a repeated pose',()=>{const r=raster(),copy=r.rgba.slice();for(let row=0;row<4;row++)for(let y=0;y<48;y++)for(let x=0;x<48;x++){const i=((row*48+y)*144+96+x)*4;r.rgba.fill(0,i,i+4);if(x>=1&&y>=1){const j=((row*48+y-1)*144+96+x-1)*4;r.rgba.set(copy.subarray(j,j+4),i)}}for(const v of Object.values(compareActorStrides(r)))assert.equal(v.similar,true)})
test('large leg changes are not called similar and never create an anatomy pass',()=>{const r=raster();for(let row=0;row<4;row++)for(let y=32;y<44;y++)for(let x=0;x<48;x++){const i=((row*48+y)*144+96+x)*4;r.rgba.fill(0,i,i+4);if(x>=28&&x<34)r.rgba.set([40,70,90,255],i)}for(const v of Object.values(compareActorStrides(r))){assert.equal(v.similar,false);assert.equal('passed'in v,false)}})
test('empty or malformed images cannot masquerade as a comparison',()=>{assert.throws(()=>compareActorStrides({width:144,height:192,rgba:new Uint8ClampedArray(144*192*4)}),/EMPTY/);assert.throws(()=>compareActorStrides({...raster(),height:191}),/INVALID/)})

test('released B sample flags known repeated side-pose risk but not its opposite back poses',async()=>{
 const {readFileSync}=await import('node:fs'),{createRequire}=await import('node:module'),{dirname,join}=await import('node:path');const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js')),p=PNG.sync.read(readFileSync('public/art/overhead/hero-gait-v2.png'))
 const rows=compareActorStrides({width:p.width,height:p.height,rgba:new Uint8ClampedArray(p.data)})
 assert.deepEqual(Object.entries(rows).filter(([,v])=>v.similar).map(([d])=>d),['left','right'])
})
