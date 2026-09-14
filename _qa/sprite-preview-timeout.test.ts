import test from 'node:test'
import assert from 'node:assert/strict'
import {spritePreviewUrl,decodeSpritePixels} from '../src/sprite-browser-io'
import {diagnosticActorDraft} from './actor-publication-fixture'

test('stalled sprite decode releases the preview wait and a later attempt can succeed',async t=>{
 const {source}=await diagnosticActorDraft()
 const original=globalThis.Image
 let started!:()=>void,late!:()=>void,instance:any
 const decoding=new Promise<void>(r=>started=r)
 class Decoder{
  src='';naturalWidth=source.width;naturalHeight=source.height
  constructor(){instance=this}
  decode(){started();return new Promise<void>(r=>late=r)}
 }
 globalThis.Image=Decoder as any
 t.mock.timers.enable({apis:['setTimeout']})
 try{
  const waiting=spritePreviewUrl(source),rejected=assert.rejects(waiting,/SPRITE_DECODE/)
  await decoding;t.mock.timers.tick(15000);await rejected
  assert.equal(instance.src,'')
  late()
  Decoder.prototype.decode=async()=>{}
  const url=await spritePreviewUrl(source)
  assert.ok(url.startsWith('blob:'));URL.revokeObjectURL(url)
 }finally{t.mock.timers.reset();if(original)globalThis.Image=original;else delete (globalThis as any).Image}
})

for(const stop of ['timeout','cancel'] as const)test(`pixel extraction releases a stalled second decode on ${stop}`,async t=>{
 const {source}=await diagnosticActorDraft()
 const originalImage=globalThis.Image,originalDocument=globalThis.document
 const revoked:string[]=[],revoke=URL.revokeObjectURL.bind(URL)
 t.mock.method(URL,'revokeObjectURL',(url:string)=>{revoked.push(url);revoke(url)})
 let started!:()=>void,late!:()=>void,calls=0,draws=0
 const instances:{src:string}[]=[],decoding=new Promise<void>(r=>started=r)
 class Decoder{
  src='';naturalWidth=source.width;naturalHeight=source.height
  constructor(){instances.push(this)}
  decode(){if(++calls===2){started();return new Promise<void>(r=>late=r)}return Promise.resolve()}
 }
 globalThis.Image=Decoder as any
 const rgba=new Uint8ClampedArray(source.width*source.height*4)
 globalThis.document={createElement:()=>({width:0,height:0,getContext:()=>({drawImage:()=>{draws++},getImageData:()=>({data:rgba})})})} as any
 const controller=new AbortController()
 t.mock.timers.enable({apis:['setTimeout']})
 try{
  const rejected=assert.rejects(decodeSpritePixels(source,controller.signal),/SPRITE_DECODE/)
  await decoding
  if(stop==='timeout')t.mock.timers.tick(15000);else controller.abort()
  await rejected
  assert.equal(draws,0);assert.equal(revoked.length,1)
  assert.ok(instances.every(image=>image.src===''))
  late();await Promise.resolve()
  assert.equal(draws,0)
  const result=await decodeSpritePixels(source)
  assert.equal(result.rgba,rgba);assert.equal(draws,1);assert.equal(revoked.length,2)
 }finally{
  t.mock.timers.reset()
  if(originalImage)globalThis.Image=originalImage;else delete (globalThis as any).Image
  if(originalDocument)globalThis.document=originalDocument;else delete (globalThis as any).document
 }
})
