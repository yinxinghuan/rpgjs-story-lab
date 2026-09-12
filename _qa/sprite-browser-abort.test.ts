import {test} from 'node:test'
import assert from 'node:assert/strict'
import {inspectSpritePng} from '../src/sprite-draft'
import {decodeSpritePixels} from '../src/sprite-browser-io'

const bytes=new Uint8Array(45);bytes.set([137,80,78,71,13,10,26,10]);new DataView(bytes.buffer).setUint32(8,13);bytes.set([73,72,68,82],12);new DataView(bytes.buffer).setUint32(16,2);new DataView(bytes.buffer).setUint32(20,2)
const png=await inspectSpritePng(bytes)
for(const stalledPass of [1,2])test(`published sprite pixel check can abort decode pass ${stalledPass}, release blobs, and retry`,async()=>{
 const oldImage=Object.getOwnPropertyDescriptor(globalThis,'Image'),oldDocument=Object.getOwnPropertyDescriptor(globalThis,'document'),oldCreate=URL.createObjectURL,oldRevoke=URL.revokeObjectURL
 let started!:()=>void,finish!:()=>void,decodes=0,stall=true,draws=0
 const decoding=new Promise<void>(resolve=>{started=resolve}),images:FakeImage[]=[],created:string[]=[],revoked:string[]=[]
 class FakeImage {src='';naturalWidth=2;naturalHeight=2;constructor(){images.push(this)}decode(){if(stall&&++decodes===stalledPass){started();return new Promise<void>(resolve=>{finish=resolve})}return Promise.resolve()}}
 Object.defineProperty(globalThis,'Image',{configurable:true,value:FakeImage})
 Object.defineProperty(globalThis,'document',{configurable:true,value:{createElement:()=>({getContext:()=>({drawImage:()=>{draws++},getImageData:()=>({data:new Uint8ClampedArray(16)})})})}})
 URL.createObjectURL=()=>{const url='blob:owned-'+created.length;created.push(url);return url};URL.revokeObjectURL=url=>{revoked.push(url)}
 try{
  const controller=new AbortController(),pending=decodeSpritePixels(png,controller.signal)
  await decoding;controller.abort();await assert.rejects(pending,/SPRITE_DECODE|RESOURCE_ABORTED/)
  assert.deepEqual(revoked,created);assert.equal(draws,0);assert.ok(images.every(i=>i.src===''))
  stall=false;const result=await decodeSpritePixels(png,new AbortController().signal)
  assert.equal(result.rgba.length,16);assert.equal(draws,1);assert.deepEqual(revoked,created)
  finish();await new Promise<void>(resolve=>setImmediate(resolve));assert.equal(draws,1);assert.ok(images.every(i=>i.src===''))
  const cancelled=new AbortController();cancelled.abort();const count=created.length
  await assert.rejects(decodeSpritePixels(png,cancelled.signal),/SPRITE_DECODE/);assert.equal(created.length,count)
 }finally{
  URL.createObjectURL=oldCreate;URL.revokeObjectURL=oldRevoke
  if(oldImage)Object.defineProperty(globalThis,'Image',oldImage);else delete (globalThis as any).Image
  if(oldDocument)Object.defineProperty(globalThis,'document',oldDocument);else delete (globalThis as any).document
 }
})
