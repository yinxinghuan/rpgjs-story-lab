import test from 'node:test'
import assert from 'node:assert/strict'
import {spritePreviewUrl} from '../src/sprite-browser-io'
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
