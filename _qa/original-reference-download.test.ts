import test from 'node:test'
import assert from 'node:assert/strict'
import {createHash} from 'node:crypto'
import {downloadOriginalReference} from '../src/original-reference-download'

const bytes=new TextEncoder().encode('persisted source bytes')
const reference={url:'https://example.com/original.png',sha256:createHash('sha256').update(bytes).digest('hex')}
const signal=()=>new AbortController().signal
const reply=(response:Response)=>(async()=>response) as typeof fetch

test('verified source bytes are returned without credentials or referrer',async()=>{
 const controller=new AbortController()
 const result=await downloadOriginalReference(reference,controller.signal,async(url,options)=>{
  assert.equal(url,reference.url);assert.equal(options?.signal,controller.signal)
  assert.equal(options?.credentials,'omit');assert.equal(options?.referrerPolicy,'no-referrer')
  return new Response(bytes)
 })
 assert.deepEqual(result,bytes)
})
test('valid HTTP response with changed content never yields an image',async()=>{
 await assert.rejects(downloadOriginalReference(reference,signal(),reply(new Response('replacement image'))),/REFERENCE_CHANGED/)
})
test('unavailable source and broken network reject; a subsequent retry can succeed',async()=>{
 for(const response of [new Response('unavailable',{status:503}),new Response(null,{status:204})])
  await assert.rejects(downloadOriginalReference(reference,signal(),reply(response)),/REFERENCE_UNAVAILABLE/)
 await assert.rejects(downloadOriginalReference(reference,signal(),async()=>{throw Error('NETWORK_DISCONNECTED')}),/NETWORK_DISCONNECTED/)
 assert.deepEqual(await downloadOriginalReference(reference,signal(),reply(new Response(bytes))),bytes)
})
test('stream limit cancels transfer even without content-length',async()=>{
 let cancelled=false
 const stream=new ReadableStream<Uint8Array>({start(c){c.enqueue(new Uint8Array(8388609))},cancel(){cancelled=true}})
 await assert.rejects(downloadOriginalReference(reference,signal(),reply(new Response(stream))),/REFERENCE_TOO_LARGE/)
 assert.equal(cancelled,true);assert.equal(stream.locked,false)
})
test('leaving before download sends no request; leaving during download yields no bytes',async()=>{
 const before=new AbortController();before.abort();let calls=0
 await assert.rejects(downloadOriginalReference(reference,before.signal,async()=>{calls++;return new Response(bytes)}),{name:'AbortError'})
 assert.equal(calls,0)
 const during=new AbortController();let cancelled=false
 const stream=new ReadableStream<Uint8Array>({pull(c){c.enqueue(bytes);during.abort()},cancel(){cancelled=true}})
 await assert.rejects(downloadOriginalReference(reference,during.signal,reply(new Response(stream))),{name:'AbortError'})
 assert.equal(cancelled,true);assert.equal(stream.locked,false)
})
test('partial response failure is not accepted as a complete reference',async()=>{
 let count=0
 const stream=new ReadableStream<Uint8Array>({pull(c){if(count++===0)c.enqueue(bytes);else c.error(Error('CONNECTION_RESET'))}})
 await assert.rejects(downloadOriginalReference(reference,signal(),reply(new Response(stream))),/CONNECTION_RESET/)
 assert.equal(stream.locked,false)
})
