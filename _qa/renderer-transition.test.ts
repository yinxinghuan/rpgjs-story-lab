import {test} from 'node:test'
import assert from 'node:assert/strict'
import {RendererTransition,rendererFailure} from '../src/renderer-transition'
const flush=()=>new Promise(resolve=>setTimeout(resolve,0))
test('renderer diagnostics preserve known causes without arbitrary exception details',()=>{
 assert.equal(rendererFailure(Error('MAP_TRANSFER_TIMEOUT')),'MAP_TRANSFER_TIMEOUT')
 assert.equal(rendererFailure(Error('private URL or player details')),'RENDERER_RESTORE')
})
function setup(timeout=25){
 const changes:string[]=[],commits:string[]=[],teleports:number[]=[]
 const r=new RendererTransition<string,number>('carriage',{
  changeMap:async s=>{changes.push(s);return true},
  teleport:async p=>{teleports.push(p)},commit:(s,p)=>{commits.push(s+':'+p)},
 },timeout)
 r.joinedScene('carriage');r.loadedScene('carriage')
 return {r,changes,commits,teleports}
}
test('late renderer completes original transfer after timeout; retry does not wait for old room',async()=>{
 const {r,changes,commits}=setup()
 await assert.rejects(r.restore('baggage',42),/MAP_TRANSFER_TIMEOUT/)
 assert.deepEqual(changes,['baggage']);assert.deepEqual(commits,[])
 const retry=r.restore('baggage',42)
 r.joinedScene('baggage');r.loadedScene('carriage');await flush()
 assert.deepEqual(commits,[])
 r.loadedScene('baggage');await retry
 assert.deepEqual(changes,['baggage']);assert.deepEqual(commits,['baggage:42'])
 const next=r.restore('cab',7);await flush();r.loadedScene('cab');r.joinedScene('cab');await next
 assert.deepEqual(commits,['baggage:42','cab:7'])
})
test('slow initial renderer keeps one pending restore and cannot teleport early',async()=>{
 const calls:string[]=[]
 const r=new RendererTransition<string,number>('carriage',{changeMap:async()=>true,teleport:async()=>{calls.push('teleport')},commit:()=>calls.push('commit')},15)
 r.joinedScene('carriage')
 await assert.rejects(r.restore('carriage',1),/TIMEOUT/);assert.deepEqual(calls,[])
 const retry=r.restore('carriage',1);r.loadedScene('carriage');await retry
 assert.deepEqual(calls,['teleport','commit'])
})
test('slow engine transfer is bounded for caller, coalesced for retry, and commits only when ready',async()=>{
 let finish!:(ok:boolean)=>void,calls=0,commits=0
 const r=new RendererTransition<string,number>('carriage',{changeMap:async()=>{calls++;return new Promise(resolve=>finish=resolve)},teleport:async()=>{},commit:()=>commits++},15)
 r.joinedScene('carriage');r.loadedScene('carriage')
 await assert.rejects(r.restore('cab',2),/TIMEOUT/)
 await assert.rejects(r.restore('walkway',3),/MAP_TRANSFER_BUSY/)
 const retry=r.restore('cab',2);r.joinedScene('cab');r.loadedScene('cab')
 assert.equal(commits,0);finish(true);await retry
 assert.equal(calls,1);assert.equal(commits,1)
})
test('rejected engine transfer can retry from intact old room',async()=>{
 let succeed=false
 const commits:string[]=[]
 const r=new RendererTransition<string,number>('carriage',{changeMap:async()=>succeed,teleport:async()=>{},commit:s=>commits.push(s)})
 r.joinedScene('carriage');r.loadedScene('carriage')
 await assert.rejects(r.restore('cab',2),/MAP_TRANSFER_REJECTED/)
 succeed=true;const retry=r.restore('cab',2);await flush();r.joinedScene('cab');r.loadedScene('cab');await retry
 assert.deepEqual(commits,['cab'])
})
test('destroyed renderer cannot commit late map readiness',async()=>{
 const {r,commits}=setup();const pending=r.restore('cab',2);await flush()
 r.dispose();await assert.rejects(pending,/MAP_RUNTIME_DISPOSED/)
 r.joinedScene('cab');r.loadedScene('cab');assert.deepEqual(commits,[])
 await assert.rejects(r.restore('carriage',1),/MAP_RUNTIME_DISPOSED/)
})
