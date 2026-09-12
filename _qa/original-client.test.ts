import {inspectOriginalDirectory} from '../src/original-session-client'
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
 const transport:Transport=async(path,b:any)=>{let r:unknown;if(path==='/sessions')r=service.create(owner,b.enrollment_id,b.locale);else{const m=path.match(/^\/sessions\/([^/]+)(\/actions|\/ending)?$/)!;r=m[2]==='/ending'?await service.ending(owner,m[1],b):m[2]?await service.action(owner,m[1],b):service.get(owner,m[1])}return JSON.parse(JSON.stringify(r))}
 return {raw,db,service,owner,storage,transport,client:new OriginalSessionClient(storage,'original-',transport)}
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

// Deliberate synthetic terminal fixture: later story chapters are not yet playable.
async function endingFixture(){const env=setup(),h=await env.client.enroll('en');h.save.scene=24;h.save.facts['chapter-bridge-complete']=true;h.save.finale={status:'ready'};env.db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id);return {...env,h}}
test('original ending persists before POST, blocks new actions/restart and recovers exact envelope after lost receipt',async()=>{
 const {raw,service,owner,storage,transport,h}=await endingFixture();let fail=true;const requests:any[]=[]
 const flaky:Transport=async(p,b)=>{if(p.endsWith('/ending')){requests.push(structuredClone(b));assert.equal(new OriginalSessionClient(storage,'original-',transport).pending()[0].operation,'ending')}const r=await transport(p,b);if(p.endsWith('/ending')&&fail){fail=false;throw Error('LOST_ENDING_RESPONSE')}return r}
 const c=new OriginalSessionClient(storage,'original-',flaky)
 await assert.rejects(c.sendEnding(h),/LOST_ENDING_RESPONSE/);assert.equal(c.hasPending(),true)
 const restored=new OriginalSessionClient(storage,'original-',flaky)
 await assert.rejects(restored.sendEnding(h),/PENDING_ACTION/);await assert.rejects(restored.send(h,input(h,'inspect-brakes')),/PENDING_ACTION/);await assert.rejects(restored.enroll('en',true),/PENDING_ACTION/)
 const result=await restored.recover();assert.deepEqual(requests[0],requests[1]);assert.equal(result.head.version,1);assert.equal(result.head.save.finale.status,'complete');assert.equal(result.cursor,0);assert.equal(restored.hasPending(),false);assert.equal(service.events(owner,h.id,0).length,0);raw.close()
})
test('original ending malformed receipt and latest finale never acknowledge pending',async()=>{
 for(const change of ['empty','wrong-id','wrong-snapshot','wrong-version','latest-finale']){
  const {raw,storage,transport,h}=await endingFixture();let invalid=true
  const corrupt:Transport=async(p,b)=>{const r=await transport(p,b);if(!invalid)return r;if(p.endsWith('/ending')){if(change==='empty')return {};if(change==='wrong-id')r.endingId=randomUUID();if(change==='wrong-snapshot')r.head.save.finale.ending.snapshotId='ending-wrong';if(change==='wrong-version')r.head.version=0}else if(change==='latest-finale')r.save.finale={status:'ready'};return r}
  const c=new OriginalSessionClient(storage,'original-',corrupt);await assert.rejects(c.sendEnding(h),/ENDING_RESPONSE_MISMATCH/);assert.equal(c.hasPending(),true)
  invalid=false;const result=await new OriginalSessionClient(storage,'original-',corrupt).recover();assert.equal(result.head.save.finale.status,'complete');assert.equal(c.hasPending(),false);raw.close()
 }
})
test('original ending retries transient failure but settles stale snapshot against latest head',async()=>{
 const {raw,db,storage,transport,h}=await endingFixture();let ready=false;const requests:any[]=[]
 const unavailable:Transport=async(p,b)=>{if(p.endsWith('/ending')){requests.push(structuredClone(b));if(!ready)throw Error('ENDING_UNAVAILABLE')}return transport(p,b)}
 const c=new OriginalSessionClient(storage,'original-',unavailable);await assert.rejects(c.sendEnding(h),/ENDING_UNAVAILABLE/);await assert.rejects(c.recover(),/ENDING_UNAVAILABLE/);assert.equal(c.hasPending(),true)
 const changed=structuredClone(h);changed.save.facts['synthetic-new-fact']=true;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(changed),h.id)
 ready=true;const result=await c.recover();assert.equal(result.rejectionCode,'ENDING_SNAPSHOT_MISMATCH');assert.deepEqual(result.head,changed);assert.equal(c.hasPending(),false);assert.deepEqual(requests[0],requests[2]);raw.close()
})

test('original exhausted model budget clears pending without losing the journey or blocking authored actions',async()=>{
 const {raw,storage,transport}=setup()
 const exhausted:Transport=async(p,b)=>{if(p.endsWith('/actions')&&(b as any)?.mode==='live')throw Error('ORIGINAL_MODEL_TEST_BUDGET_EXHAUSTED');return transport(p,b)}
 try{
  const client=new OriginalSessionClient(storage,'original-',exhausted),h=await client.enroll('zh')
  const r=await client.send(h,{...input(h,'inspect-brakes'),type:'dialogue',text:'你好',mode:'live'})
  assert.equal(r.accepted,false);assert.equal(r.rejectionCode,'ORIGINAL_MODEL_TEST_BUDGET_EXHAUSTED');assert.deepEqual(r.head,h);assert.equal(client.hasPending(),false)
  const next=await client.send(h,input(h,'repair-starter'));assert.equal(next.head.save.stats.condition,h.save.stats.condition+5)
 }finally{raw.close()}
})

test('saved journey selection preserves both original stories, refuses unknown ownership and stops stale-tab writes',async()=>{
 const {raw,client,service,owner,storage,transport}=setup()
 try{let a=await client.enroll('zh');a=(await client.send(a,input(a,'repair-starter'))).head
 const old=structuredClone(service.get(owner,a.id)),b=await client.enroll('en',true)
 assert.notEqual(a.id,b.id);assert.deepEqual(service.get(owner,a.id),old)
 const selected=await client.selectSession(a.id);assert.deepEqual(selected,old)
 await assert.rejects(client.send(b,input(b,'repair-starter')),/SESSION_SELECTION_CHANGED/)
 assert.equal(service.get(owner,b.id).version,0);assert.equal(client.pending().length,0)
 const foreign=service.create('another-owner',randomUUID(),'zh')
 await assert.rejects(client.selectSession(foreign.id));assert.equal(client.read('session',''),a.id)
 const offline=new OriginalSessionClient(storage,'original-',async(path,body)=>{if(path==='/sessions/'+b.id)throw Error('OFFLINE');return transport(path,body)})
 await assert.rejects(offline.selectSession(b.id),/OFFLINE/);assert.equal(client.read('session',''),a.id)
 const resumed=await new OriginalSessionClient(storage,'original-',transport).enroll('en');assert.equal(resumed.id,a.id);assert.equal(resumed.save.locale,'zh')
 }finally{raw.close()}
})
test('selection cannot abandon an unconfirmed action or lost new-journey enrollment',async()=>{
 const {raw,client,storage,transport,service,owner}=setup()
 try{const a=await client.enroll('zh'),b=await client.enroll('en',true);await client.selectSession(a.id)
 let fail=true
 const flaky=new OriginalSessionClient(storage,'original-',async(p,b)=>{const r=await transport(p,b);if(p.endsWith('/actions')&&fail){fail=false;throw Error('LOST')};return r})
 await assert.rejects(flaky.send(a,input(a,'repair-starter')),/LOST/)
 await assert.rejects(flaky.selectSession(b.id),/PENDING_ACTION/);assert.equal(flaky.read('session',''),a.id)
 await flaky.recover();await flaky.selectSession(b.id)
 let lose=true
 const restart=new OriginalSessionClient(storage,'original-',async(p,b)=>{const r=await transport(p,b);if(p==='/sessions'&&lose){lose=false;throw Error('LOST_NEW')};return r})
 await assert.rejects(restart.enroll('zh',true),/LOST_NEW/)
 await assert.rejects(restart.selectSession(a.id),/PENDING_ACTION/)
 const restored=await restart.enroll('en');assert.equal(restored.save.locale,'zh');assert.equal(service.directory(owner).length,3);assert.equal(restored.version,0)
 }finally{raw.close()}
})

test('directory rejects foreign schema, invalid rooms and duplicate journey ids',async()=>{
 const {inspectOriginalDirectory}=await import('../src/original-session-client'),{raw,service,owner,client}=setup()
 try{await client.enroll('en');const rows=service.directory(owner)
 assert.deepEqual(inspectOriginalDirectory({sessions:rows}),rows)
 assert.throws(()=>inspectOriginalDirectory({sessions:[...rows,...rows]}),/DIRECTORY/)
 assert.throws(()=>inspectOriginalDirectory({sessions:[{...rows[0],scene:'unmade-room'}]}),/DIRECTORY/)
 assert.throws(()=>inspectOriginalDirectory({sessions:[{...rows[0],cursor:9}]}),/DIRECTORY/)
 assert.throws(()=>inspectOriginalDirectory({sessions:[{...rows[0],id:'../bad'}]}),/DIRECTORY/)
 }finally{raw.close()}
})

test('definite new-journey quota refusal retains current story and does not lock out saved journey selection',async()=>{
 const {raw,client,storage,transport}=setup()
 try{const a=await client.enroll('zh'),b=await client.enroll('en',true)
 const capped=new OriginalSessionClient(storage,'original-',async(p,body)=>{if(p==='/sessions')throw Error('SESSION_LIMIT');return transport(p,body)})
 await assert.rejects(capped.enroll('zh',true),/SESSION_LIMIT/)
 assert.equal(capped.read('session',''),b.id);assert.equal(capped.read('enrollment-pending','missing'),null)
 assert.equal((await capped.selectSession(a.id)).id,a.id)
 }finally{raw.close()}
})

test("directory accepts completed ending offset but rejects impossible or noninteger cursors",()=>{const row={id:"synthetic-journey-123",version:40,cursor:39,scene:"train-at-dawn-junction",updated:1};assert.deepEqual(inspectOriginalDirectory({sessions:[row]}),[row]);for(const cursor of [-1,1.5,38,41])assert.throws(()=>inspectOriginalDirectory({sessions:[{...row,cursor}]}),/DIRECTORY/)})
