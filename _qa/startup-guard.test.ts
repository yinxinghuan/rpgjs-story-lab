import test from 'node:test'
import assert from 'node:assert/strict'
import {createStartupGuard} from '../src/startup-guard'
const delay=(ms:number)=>new Promise(r=>setTimeout(r,ms))
test('a stalled startup fails once and disposes its late renderer',async()=>{
 const failures:string[]=[],g=createStartupGuard(c=>failures.push(c),5)
 await delay(15)
 let disposed=0
 assert.equal(g.pending(),false)
 assert.equal(g.accept({destroy:()=>disposed++}),false)
 g.fail('LATE_DECODE_ERROR')
 assert.equal(disposed,1);assert.deepEqual(failures,['STARTUP_TIMEOUT'])
})
test('ready startup cancels its timeout; an independent retry may succeed',async()=>{
 const failures:string[]=[],first=createStartupGuard(c=>failures.push(c),5)
 first.fail('TEXTURE_ERROR')
 const retry=createStartupGuard(c=>failures.push(c),5)
 assert.equal(retry.accept({destroy:()=>assert.fail('active runtime destroyed')}),true)
 await delay(15);assert.deepEqual(failures,['TEXTURE_ERROR'])
})
test('unmounted startup is silent and cannot accept a delayed runtime',async()=>{
 const g=createStartupGuard(()=>assert.fail('unmount must not show a failure'),5)
 g.cancel();let disposed=false
 assert.equal(g.accept({destroy:()=>{disposed=true}}),false)
 await delay(15);assert.equal(disposed,true)
})

test('connection alone is not ready: wait for map acknowledgement and reject late acknowledgement',async()=>{
 let release!:()=>void,disposed=0
 const g=createStartupGuard(()=>{},1000)
 const runtime={destroy:()=>disposed++}
 const completion=g.acceptWhenReady(runtime,()=>new Promise<void>(r=>{release=r}))
 assert.equal(g.pending(),true)
 release();assert.equal(await completion,true);assert.equal(disposed,0)
 let late!:()=>void
 const failed=createStartupGuard(()=>{},5)
 const pending=failed.acceptWhenReady(runtime,()=>new Promise<void>(r=>{late=r}))
 await delay(15);late()
 assert.equal(await pending,false);assert.equal(disposed,1)
})
test('failed map acknowledgement exposes recovery and disposes the paused runtime',async()=>{
 const errors:string[]=[],g=createStartupGuard(c=>errors.push(c),1000)
 let disposed=false
 assert.equal(await g.acceptWhenReady({destroy:()=>{disposed=true}},async()=>{throw Error('MAP_TRANSFER_TIMEOUT')}),false)
 assert.equal(disposed,true);assert.deepEqual(errors,['MAP_TRANSFER_TIMEOUT'])
})
