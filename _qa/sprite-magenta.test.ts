import test from 'node:test'
import assert from 'node:assert/strict'
import {prepareSpritePixels,type PixelRaster,type SpritePreparationSpec} from '../src/sprite-preparation'
const spec:SpritePreparationSpec={columns:1,rows:1,cellWidth:32,cellHeight:40,foot:{x:16,y:36},kind:'actor',backgroundMode:'magenta',neutralMin:200,chromaMax:20}
function fixture(){const r:PixelRaster={width:32,height:40,rgba:new Uint8ClampedArray(32*40*4)};for(let i=0;i<32*40;i++)r.rgba.set([215,30,208,255],i*4);for(let y=8;y<35;y++)for(let x=8;x<24;x++)r.rgba.set([35,70,30,255],(y*32+x)*4);return r}
const read=(r:PixelRaster,x:number,y:number)=>Array.from(r.rgba.slice((y*r.width+x)*4,(y*r.width+x)*4+4))
function resultPixel(o:ReturnType<typeof prepareSpritePixels>,x:number,y:number){return read(o.raster,x+o.frames[0].offset.x,y+o.frames[0].offset.y)}
test('magenta preparation preserves pale apron and interior colors, retains source and aligns feet',()=>{
 const r=fixture();for(let y=18;y<30;y++)for(let x=11;x<21;x++)r.rgba.set([245,240,215,255],(y*32+x)*4)
 const before=new Uint8ClampedArray(r.rgba),o=prepareSpritePixels(r,spec)
 assert.deepEqual(r.rgba,before);assert.equal(o.algorithm,'magenta-matte-unmix-1');assert.deepEqual(resultPixel(o,16,24),[245,240,215,255]);assert.deepEqual(read(o.raster,0,0),[0,0,0,0]);assert.equal(o.frames[0].sourceAnchor.y+o.frames[0].offset.y,36)
})
test('enclosed magenta only clears with an explicitly selected eligible seed',()=>{
 const r=fixture();for(let y=17;y<23;y++)for(let x=14;x<18;x++)r.rgba.set([215,30,208,255],(y*32+x)*4)
 const without=prepareSpritePixels(r,spec);assert.equal(resultPixel(without,16,20)[3],255)
 const withSeed=prepareSpritePixels(r,{...spec,matteSeeds:[{x:16,y:20}]});assert.equal(resultPixel(withSeed,16,20)[3],0)
 assert.throws(()=>prepareSpritePixels(r,{...spec,matteSeeds:[{x:10,y:20}]}),/MATTE_SEEDS/)
})
test('magenta edge unmixing removes contamination without whitening dark outlines',()=>{
 const r=fixture();for(let y=8;y<35;y++)r.rgba.set([125,50,119,255],(y*32+7)*4)
 const o=prepareSpritePixels(r,spec),edge=resultPixel(o,7,20)
 assert.ok(o.metrics.edgeCorrected>0);assert.ok(edge[3]>100&&edge[3]<160);assert.ok(edge[0]<45&&edge[2]<45);assert.deepEqual(resultPixel(o,16,20),[35,70,30,255])
})
test('wrong matte mode fails rather than silently cropping an opaque backdrop',()=>{
 assert.throws(()=>prepareSpritePixels(fixture(),{...spec,backgroundMode:'pale-neutral'}),/NO_CONNECTED_MATTE/)
 const r=fixture();for(let i=0;i<r.width*r.height;i++)if(r.rgba[i*4]===215)r.rgba.set([245,245,245,255],i*4)
 assert.throws(()=>prepareSpritePixels(r,spec),/NO_CONNECTED_MATTE/)
})
