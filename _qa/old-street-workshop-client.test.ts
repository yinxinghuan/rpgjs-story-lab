import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {createWorkshopClient} from '../src/old-street-workshop-client'
import type {OldStreetPresentationHead} from '../src/old-street-workshop'
import type {RecoverableSessionClient} from '../src/recoverable-session-client'
class Memory implements Storage{
 values=new Map<string,string>();get length(){return this.values.size}clear(){this.values.clear()}getItem(k:string){return this.values.get(k)??null}key(i:number){return [...this.values.keys()][i]??null}removeItem(k:string){this.values.delete(k)}setItem(k:string,v:string){this.values.set(k,String(v))}
}
const lock=async<T>(_name:string,work:()=>Promise<T>)=>work()
const source={id:randomUUID(),version:4} as OldStreetPresentationHead,hash='a'.repeat(64)
function client(select:(id:string)=>Promise<OldStreetPresentationHead>,pending=false){return {selectSession:select,hasPending:()=>pending} as RecoverableSessionClient<OldStreetPresentationHead>}
test('workshop adoption persists before send and reuses the same envelope after lost response',async()=>{
 const storage=new Memory(),target={id:randomUUID(),version:0} as OldStreetPresentationHead,bodies:unknown[]=[];let lost=true,selected=''
 const api=async(_path:string,body?:unknown)=>{assert.ok(storage.getItem('oldstreet-workshop-adoption-1'));bodies.push(body);if(lost){lost=false;throw Error('NETWORK_ERROR')}return {head:target}}
 let c=createWorkshopClient(storage,api,client(async id=>{selected=id;return target}),lock)
 await assert.rejects(c.adopt(source,hash),/NETWORK_ERROR/);assert.equal(c.pending(),true);assert.equal(selected,'')
 c=createWorkshopClient(storage,api,client(async id=>{selected=id;return target}),lock)
 assert.deepEqual(await c.recover(),target);assert.deepEqual(bodies[0],bodies[1]);assert.equal(c.pending(),false);assert.equal(selected,target.id)
})
test('failed selection keeps adoption receipt recoverable; pending original action prevents fork',async()=>{
 const storage=new Memory(),target={id:randomUUID(),version:2} as OldStreetPresentationHead;let fail=true,calls=0
 const c=createWorkshopClient(storage,async()=>{calls++;return {head:target}},client(async()=>{if(fail)throw Error('READ_TIMEOUT');return target}),lock)
 await assert.rejects(c.adopt(source,hash),/READ_TIMEOUT/);assert.equal(c.pending(),true);fail=false
 assert.deepEqual(await c.recover(),target);assert.equal(calls,2)
 const blocked=createWorkshopClient(storage,async()=>{throw Error('MUST_NOT_SEND')},client(async()=>target,true),lock)
 await assert.rejects(blocked.adopt(source,hash),/PENDING_ACTION/);assert.equal(blocked.pending(),false)
})
test('lost proposal response reuses its request ID instead of spending another proposal',async()=>{
 const storage=new Memory(),bodies:unknown[]=[];let lost=true
 const c=createWorkshopClient(storage,async(_p,b)=>{bodies.push(b);if(lost){lost=false;throw Error('NETWORK_ERROR')}return {job:{id:'test',state:'running'}}},client(async()=>source),lock)
 await assert.rejects(c.propose(source),/NETWORK_ERROR/);await c.propose(source);assert.deepEqual(bodies[0],bodies[1])
})
test('definitive stale refusal clears only the uncommitted adoption, never selection',async()=>{
 const storage=new Memory();let selected=false
 const c=createWorkshopClient(storage,async()=>{throw Error('DELTA_STALE')},client(async()=>{selected=true;return source}),lock)
 await assert.rejects(c.adopt(source,hash),/DELTA_STALE/);assert.equal(c.pending(),false);assert.equal(selected,false)
})
