import test from 'node:test'
import assert from 'node:assert/strict'
import {decodeBrowserPicture} from '../src/decode-browser-picture'
test('abandoned decode releases only its own URL; late completion cannot replace successful retry',async t=>{
 const images:any[]=[],revoked:string[]=[],prior=globalThis.Image;let serial=0
 class Picture {src='';naturalWidth=768;naturalHeight=1024;complete!:()=>void;decode(){return new Promise<void>(resolve=>this.complete=resolve)}constructor(){images.push(this)}}
 globalThis.Image=Picture as any;t.after(()=>{globalThis.Image=prior})
 t.mock.method(URL,'createObjectURL',()=>`blob:picture-${++serial}`);t.mock.method(URL,'revokeObjectURL',(url:string)=>revoked.push(url))
 const first=new AbortController(),old=decodeBrowserPicture(new Uint8Array([1]),first.signal)
 await Promise.resolve();first.abort();await assert.rejects(old,/RESOURCE_ABORTED/)
 assert.deepEqual(revoked,['blob:picture-1']);assert.equal(images[0].src,'')
 const next=decodeBrowserPicture(new Uint8Array([2]),new AbortController().signal,{width:768,height:1024});await Promise.resolve();images[1].complete()
 assert.equal(await next,'blob:picture-2');images[0].complete();await Promise.resolve()
 assert.deepEqual(revoked,['blob:picture-1']);assert.equal(images[1].src,'')
})
test('wrong dimensions and already cancelled attempts do not leak picture URLs',async t=>{
 const prior=globalThis.Image,revoked:string[]=[];globalThis.Image=class {src='';naturalWidth=1;naturalHeight=1;decode(){return Promise.resolve()}} as any;t.after(()=>{globalThis.Image=prior})
 const created=t.mock.method(URL,'createObjectURL',()=>`blob:wrong`);t.mock.method(URL,'revokeObjectURL',(url:string)=>revoked.push(url))
 await assert.rejects(decodeBrowserPicture(new Uint8Array([1]),new AbortController().signal,{width:768,height:1024}),/IMAGE_INVALID/)
 const controller=new AbortController();controller.abort();await assert.rejects(decodeBrowserPicture(new Uint8Array([1]),controller.signal),/RESOURCE_ABORTED/)
 assert.deepEqual(revoked,['blob:wrong']);assert.equal(created.mock.callCount(),1)
})
