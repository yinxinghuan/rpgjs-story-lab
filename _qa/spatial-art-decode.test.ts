import test from 'node:test'
import assert from 'node:assert/strict'
import {decodeSpatialArt} from '../src/spatial-art-decode'

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
