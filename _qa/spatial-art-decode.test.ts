import test from 'node:test'
import assert from 'node:assert/strict'
import {decodeSpatialArt} from '../src/spatial-art-decode'

test('a loaded image remains usable when its decode promise never settles',async()=>{
 const image={src:'',complete:false,naturalWidth:0,naturalHeight:0,onload:null,onerror:null,decode:()=>new Promise<void>(()=>{})} as unknown as HTMLImageElement
 const work=decodeSpatialArt('blob:loaded',{createImage:()=>image,timeoutMs:30})
 Object.assign(image,{complete:true,naturalWidth:768,naturalHeight:1152})
 image.onload!(new Event('load'))
 assert.equal(await work,image);assert.equal(image.src,'blob:loaded')
 assert.equal(image.onload,null);assert.equal(image.onerror,null)
})
test('a cached image can be ready without another load event; zero dimensions cannot pass',async()=>{
 const cached={src:'',complete:true,naturalWidth:32,naturalHeight:32,decode:()=>new Promise<void>(()=>{})} as HTMLImageElement
 assert.equal(await decodeSpatialArt('blob:cached',{createImage:()=>cached}),cached)
 const broken={src:'',complete:true,naturalWidth:0,naturalHeight:0,decode:()=>new Promise<void>(()=>{})} as HTMLImageElement
 const work=decodeSpatialArt('blob:empty',{createImage:()=>broken})
 broken.onload!(new Event('load'))
 await assert.rejects(work,/ART_IMAGE_DECODE_FAILED/);assert.equal(broken.src,'')
})

test('a suspended decoder times out, clears its image, and a new attempt can succeed',async()=>{
 let late:()=>void=()=>{}
 const stalled={src:'',decode:()=>new Promise<void>(resolve=>{late=resolve})} as HTMLImageElement
 await assert.rejects(decodeSpatialArt('blob:stalled',{createImage:()=>stalled,timeoutMs:10}),/ART_IMAGE_TIMEOUT/)
 assert.equal(stalled.src,'')
 late()
 const working={src:'',decode:async()=>{}} as HTMLImageElement
 assert.equal(await decodeSpatialArt('blob:working',{createImage:()=>working}),working)
 assert.equal(working.src,'blob:working')
})
test('page teardown cancels a decode and never starts one for an already aborted page',async()=>{
 const controller=new AbortController()
 let calls=0
 const image={src:'',decode:()=>{calls++;return new Promise<void>(()=>{})}} as HTMLImageElement
 const work=decodeSpatialArt('blob:pending',{signal:controller.signal,createImage:()=>image})
 await Promise.resolve();controller.abort()
 await assert.rejects(work,/ART_IMAGE_CANCELLED/)
 assert.equal(image.src,'')
 await assert.rejects(decodeSpatialArt('blob:unused',{signal:controller.signal,createImage:()=>image}),/ART_IMAGE_CANCELLED/)
 assert.equal(calls,1)
})
test('corrupt artwork receives an artwork-specific error, without leaking decoder internals',async()=>{
 const image={src:'',decode:async():Promise<void>=>{throw new DOMException('private url details','EncodingError')}} as HTMLImageElement
 await assert.rejects(decodeSpatialArt('blob:bad',{createImage:()=>image}),/^Error: ART_IMAGE_DECODE_FAILED$/)
 assert.equal(image.src,'')
})
