import {test} from 'node:test'
import assert from 'node:assert/strict'
import {abortableArtLoad} from '../src/abortable-art-load'
import {loadBrowserSceneResource} from '../src/scene-readiness'
const flush=()=>new Promise<void>(resolve=>setImmediate(resolve))

test('a stalled texture returns on abort; its late result is discarded without affecting a retry',async()=>{
 const controller=new AbortController();let finish!:(v:string)=>void;const discarded:string[]=[]
 const first=abortableArtLoad(()=>new Promise<string>(resolve=>{finish=resolve}),controller.signal,v=>{discarded.push(v)})
 await flush();controller.abort();await assert.rejects(first,/RESOURCE_ABORTED/)
 const secondController=new AbortController()
 assert.equal(await abortableArtLoad(()=>Promise.resolve('new texture'),secondController.signal,v=>{discarded.push(v)}),'new texture')
 finish('old texture');await flush();assert.deepEqual(discarded,['old texture'])
 secondController.abort();await flush();assert.deepEqual(discarded,['old texture'])
})

test('pre-aborted work never starts and late decoder rejection is handled',async()=>{
 const controller=new AbortController();controller.abort();let started=false
 await assert.rejects(abortableArtLoad(async()=>{started=true},controller.signal),/RESOURCE_ABORTED/);assert.equal(started,false)
 const active=new AbortController();let fail!:(error:Error)=>void
 const work=abortableArtLoad(()=>new Promise((_,reject)=>{fail=reject}),active.signal)
 await flush();active.abort();await assert.rejects(work,/RESOURCE_ABORTED/);fail(Error('decoder rejected later'));await flush()
 await assert.rejects(abortableArtLoad(()=>Promise.reject(Error('decode failed')),new AbortController().signal),/decode failed/)
})

test('the real browser resource loader releases a stalled image decode on abort',async()=>{
 const original=Object.getOwnPropertyDescriptor(globalThis,'Image');let image!:StalledImage
 class StalledImage {src='';naturalWidth=2;naturalHeight=2;constructor(){image=this}decode(){return new Promise<void>(()=>{})}}
 Object.defineProperty(globalThis,'Image',{configurable:true,value:StalledImage})
 const bytes=new Uint8Array([1,2,3]),sha256=Buffer.from(await crypto.subtle.digest('SHA-256',bytes)).toString('hex')
 const controller=new AbortController();let decodeStarted!:()=>void
 const decoding=new Promise<void>(resolve=>{decodeStarted=resolve})
 try{
  const pending=loadBrowserSceneResource({kind:'background',path:'./art.png',bytes:bytes.length,sha256,width:2,height:2},controller.signal,'https://example.test/game/',async()=>new Response(bytes),stage=>{if(stage==='decode')decodeStarted()})
  await decoding;await flush();controller.abort()
  await assert.rejects(pending,/RESOURCE_DECODE/);assert.equal(image.src,'')
 }finally{if(original)Object.defineProperty(globalThis,'Image',original);else delete (globalThis as any).Image}
})
