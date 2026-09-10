import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalSessionClient} from '../src/original-session-client'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead} from '../server/original-train-runtime'
import {originalTrainSpatialPlan} from '../src/original-train-spatial-plan'
import type {Transport} from '../src/recoverable-session-client'
import type {AuthorityStorage} from '../server/session-authority'
class MemoryStorage implements Storage{private values=new Map<string,string>();get length(){return this.values.size}key(i:number){return [...this.values.keys()][i]??null}getItem(k:string){return this.values.get(k)??null}setItem(k:string,v:string){this.values.set(k,v)}removeItem(k:string){this.values.delete(k)}clear(){this.values.clear()}}
function setup(){
 const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 // Explicit source-only admission. This does not activate a visible game.
 const service=new OriginalTrainAuthority(db,()=>true),owner=randomUUID(),storage=new MemoryStorage()
 const transport:Transport=async(path,b:any)=>{let r:unknown;if(path==='/sessions')r=service.create(owner,b.enrollment_id,b.locale);else{const m=path.match(/^\/sessions\/([^/]+)(\/actions)?$/)!;r=m[2]?await service.action(owner,m[1],b):service.get(owner,m[1])}return JSON.parse(JSON.stringify(r))}
 return {raw,service,owner,storage,transport,client:new OriginalSessionClient(storage,'original-',transport)}
}
function input(h:OriginalHead,action:string,free=false){const e=originalTrainSpatialPlan().entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;return {target:e.id,position:e.approach,...(free?{type:'free-input',text:originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===action)!.match[0]}:{type:'action',action})}}
test('original client persists intent before sending and recovers lost route into its actual room',async()=>{
 const {raw,service,owner,storage,transport,client}=setup();let h=await client.enroll('en');h=(await client.send(h,input(h,'repair-starter'))).head
 let fail=true;const envelopes:any[]=[]
 const flaky:Transport=async(p,b)=>{if(p.endsWith('/actions')){envelopes.push(structuredClone(b));assert.equal(new OriginalSessionClient(storage,'original-',transport).pending().length,1)}const r=await transport(p,b);if(p.endsWith('/actions')&&fail){fail=false;throw Error('RESPONSE_LOST')}return r}
 await assert.rejects(new OriginalSessionClient(storage,'original-',flaky).send(h,input(h,'commit-valley-route',true)),/RESPONSE_LOST/)
 const reloaded=new OriginalSessionClient(storage,'original-',flaky);await assert.rejects(reloaded.enroll('zh',true),/PENDING_ACTION/)
 const recovered=await reloaded.recover();assert.deepEqual(envelopes[0],envelopes[1]);assert.equal(recovered.head.sceneId,'train-at-river-valley');assert.equal(recovered.head.save.stats.fuel,h.save.stats.fuel-6);assert.equal(recovered.head.save.version,8);assert.equal(reloaded.hasPending(),false)
 assert.equal(service.events(owner,h.id,0).length,2);assert.deepEqual(await reloaded.enroll('zh'),recovered.head);raw.close()
})
test('lost original enrollment response recovers original language and ID',async()=>{
 const {raw,storage,transport}=setup();let fail=true;const requests:any[]=[]
 const flaky:Transport=async(p,b)=>{requests.push(structuredClone(b));const r=await transport(p,b);if(fail){fail=false;throw Error('LOST_ENROLLMENT')}return r}
 await assert.rejects(new OriginalSessionClient(storage,'original-',flaky).enroll('zh'))
 const h=await new OriginalSessionClient(storage,'original-',flaky).enroll('en');assert.equal(h.save.locale,'zh');assert.deepEqual(requests[0],requests[1]);assert.equal(storage.getItem('original-enrollment-pending'),'null');raw.close()
})
test('original permanent rejection clears only its own pending and adopts latest authority',async()=>{
 const {raw,storage,transport,client}=setup(),h=await client.enroll('en')
 storage.setItem('carriage-cloud-1-pending-v2:untouched','another-world-record')
 const result=await client.send(h,{...input(h,'inspect-brakes'),type:'free-input',text:'Enter an unmade restaurant.'})
 assert.equal(result.accepted,false);assert.equal(result.rejectionCode,'ORIGINAL_NARRATION_NOT_READY');assert.deepEqual(result.head,h);assert.equal(client.hasPending(),false);assert.equal(storage.getItem('carriage-cloud-1-pending-v2:untouched'),'another-world-record')
 assert.deepEqual(await new OriginalSessionClient(storage,'original-',transport).recover(),{head:h,kind:'recovered',text:null,accepted:false});raw.close()
})
test('invalid or regressed authority responses never acknowledge original pending',async()=>{
 for(const failure of ['receipt-id','latest-id','older-head','wrong-world','room-mismatch']){
  const {raw,storage,transport,client}=setup(),h=await client.enroll('en');let valid=false
  const corrupt:Transport=async(p,b)=>{const r=await transport(p,b);if(valid)return r;if(p.endsWith('/actions')&&failure==='receipt-id')r.head.id=randomUUID();else if(!p.endsWith('/actions')){if(failure==='latest-id')r.id=randomUUID();if(failure==='older-head')r.version=0;if(failure==='wrong-world')r.save.cartridgeId='carriage-07';if(failure==='room-mismatch')r.sceneId='train-at-river-valley'}return r}
  const bad=new OriginalSessionClient(storage,'original-',corrupt)
  await assert.rejects(bad.send(h,input(h,'repair-starter')));assert.equal(bad.hasPending(),true)
  valid=true;const r=await new OriginalSessionClient(storage,'original-',corrupt).recover();assert.equal(r.head.version,1);assert.equal(r.head.save.stats.condition,87);assert.equal(bad.hasPending(),false);raw.close()
 }
})
test('original readiness failure keeps one intent for explicit later retry',async()=>{
 const {raw,storage,transport,client}=setup(),h=await client.enroll('en');let ready=false;const ids:string[]=[]
 const gated:Transport=async(p,b:any)=>{if(p.endsWith('/actions')){ids.push(b.action_id);if(!ready)throw Error('ORIGINAL_PRESENTATION_NOT_READY')}return transport(p,b)}
 const c=new OriginalSessionClient(storage,'original-',gated);await assert.rejects(c.send(h,input(h,'inspect-brakes')))
 await assert.rejects(c.recover());assert.equal(c.hasPending(),true);ready=true;const r=await c.recover();assert.equal(r.head.version,1);assert.equal(new Set(ids).size,1);assert.equal(c.hasPending(),false);raw.close()
})
