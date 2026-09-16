import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import 'fake-indexeddb/auto'
import {SessionClient,type Transport} from '../src/session-client'
import {BrowserJourney} from '../src/browser-journey'
import {cloudTransport,newCapability} from '../src/cloud-session'
import {selectRuntime} from '../src/runtime-selection'
import {approachPoints} from '../src/scene-layout'
class MemoryStorage implements Storage{private data=new Map<string,string>();get length(){return this.data.size}key(i:number){return [...this.data.keys()][i]??null}clear(){this.data.clear()}getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,String(v))}removeItem(k:string){this.data.delete(k)}}
test('cloud timeout diagnostics distinguish handshake, reads and writes without retrying a mutation',async()=>{
 const {RUNTIME_CONTRACT}=await import('../src/runtime-contract')
 for(const phase of ['HEALTH','READ','WRITE'] as const){
  const storage=new MemoryStorage();let healthCalls=0,sessionCalls=0
  const request:typeof fetch=async url=>{
   if(String(url).endsWith('/health')){
    healthCalls++;if(phase==='HEALTH')throw new DOMException('synthetic timeout','TimeoutError')
    return Response.json({runtimeContract:RUNTIME_CONTRACT})
   }
   sessionCalls++
   // Covers a timeout while consuming the response, not only before headers.
   return new Response(new ReadableStream({start(controller){controller.error(new DOMException('synthetic timeout','TimeoutError'))}}),{headers:{'Content-Type':'application/json'}})
  }
  const api=cloudTransport(storage,'stage-','/game/api/lab',async(_n,f)=>f(),request)
  await assert.rejects(api('/sessions',phase==='WRITE'?{enrollment_id:randomUUID()}:undefined),new RegExp('^Error: CLOUD_'+phase+'_TIMEOUT$'))
  assert.equal(healthCalls,1);assert.equal(sessionCalls,phase==='HEALTH'?0:1)
  assert.ok(storage.getItem('stage-capability'))
 }
})
const open={target:'cabinet',position:approachPoints.cabinet,type:'action',action:'open-cabinet'},take={...open,action:'take-fuse'}
function setup(){const storage=new MemoryStorage(),store=new BrowserJourney(randomUUID()),transport:Transport=(p,b)=>store.api(p,b);return {storage,store,transport,client:new SessionClient(storage,'test-',transport)}}
test('a received refusal survives a failed head read without reposting the action after reload',async()=>{
 const {storage,store,transport,client}=setup()
 let writes=0,failRead=false
 const flaky:Transport=async(path,body)=>{
  if(path.endsWith('/actions')){writes++;failRead=true;throw Error('UNSUPPORTED_ACTION')}
  if(failRead){failRead=false;throw Error('HEAD_READ_LOST')}
  return transport(path,body)
 }
 try{
  const h=await client.enroll('zh')
  const c=new SessionClient(storage,'test-',flaky)
  await assert.rejects(c.send(h,open),/HEAD_READ_LOST/)
  assert.equal(c.hasPending(),true)
  const reloaded=new SessionClient(storage,'test-',flaky),r=await reloaded.recover()
  assert.equal(writes,1);assert.equal(r.accepted,false);assert.equal(r.rejectionCode,'UNSUPPORTED_ACTION')
  assert.equal(r.head.version,h.version);assert.deepEqual(r.head.save.inventory,h.save.inventory)
  assert.equal(reloaded.hasPending(),false)
  // Choosing to try again is a new request, not silent recovery generation.
  await assert.rejects(reloaded.send(r.head,open),/HEAD_READ_LOST/)
  assert.equal(writes,2)
 }finally{await store.close()}
})
test('unsupported journey retains the pending action across reload and recovers with the same ID',async()=>{
 const {storage,store,transport,client}=setup(),h=await client.enroll('zh');let compatible=false;const ids:string[]=[]
 const guarded:Transport=async(p,b:any)=>{if(p.endsWith('/actions')){ids.push(b.action_id);if(!compatible)throw Error('JOURNEY_VERSION_UNSUPPORTED')}return transport(p,b)}
 try{
  const blocked=new SessionClient(storage,'test-',guarded)
  await assert.rejects(blocked.send(h,open),/JOURNEY_VERSION_UNSUPPORTED/);assert.equal(blocked.hasPending(),true)
  const reloaded=new SessionClient(storage,'test-',guarded)
  await assert.rejects(reloaded.recover(),/JOURNEY_VERSION_UNSUPPORTED/);assert.equal(reloaded.hasPending(),true)
  await assert.rejects(reloaded.enroll('zh',true),/PENDING_ACTION/)
  compatible=true;const restored=await reloaded.recover()
  assert.equal(new Set(ids).size,1);assert.equal(restored.head.version,1);assert.equal(reloaded.hasPending(),false)
 }finally{await store.close()}
})
test('lost action response reloads same ID without granting an item twice',async()=>{const {storage,store,transport,client}=setup();let h=await client.enroll('zh');h=(await client.send(h,open)).head;let fail=true,ids:string[]=[];const flaky:Transport=async(p,b:any)=>{const r=await transport(p,b);if(p.endsWith('/actions')){ids.push(b.action_id);if(fail){fail=false;throw Error('NETWORK_LOST')}}return r};const c=new SessionClient(storage,'test-',flaky);await assert.rejects(c.send(h,take),/NETWORK_LOST/);const recovered=await new SessionClient(storage,'test-',flaky).recover();assert.equal(ids[0],ids[1]);assert.equal(recovered.head.save.inventory[0].count,1);assert.equal(c.hasPending(),false);await store.close()})
test('stale client adopts newest state and clears only rejected request',async()=>{const {storage,store,transport,client}=setup(),h=await client.enroll('en');await client.send(h,open);const stale=new SessionClient(storage,'test-',transport),r=await stale.send(h,take);assert.equal(r.kind,'recovered');assert.equal(r.head.version,1);assert.equal(stale.hasPending(),false);await store.close()})
test('restart refuses ambiguous actions and cannot orphan the current journey',async()=>{const {storage,store,transport,client}=setup(),h=await client.enroll('en');const offline=new SessionClient(storage,'test-',async()=>{throw Error('OFFLINE')});await assert.rejects(offline.send(h,open));await assert.rejects(client.enroll('en',true),/PENDING_ACTION/);assert.equal(client.read('session',''),h.id);await client.recover();assert.notEqual((await client.enroll('en',true)).id,h.id);await store.close()})
test('lost enrollment response keeps original ID and locale across refresh',async()=>{const {storage,store,transport}=setup();let fail=true;const requests:any[]=[];const flaky:Transport=async(p,b)=>{if(p==='/sessions')requests.push(b);const r=await transport(p,b);if(fail){fail=false;throw Error('LOST')}return r};await assert.rejects(new SessionClient(storage,'test-',flaky).enroll('zh'));const h=await new SessionClient(storage,'test-',flaky).enroll('en');assert.deepEqual(requests[0],requests[1]);assert.equal(h.save.locale,'zh');await store.close()})
test('old session pending cannot replace selected newer session',async()=>{const {storage,store,transport,client}=setup(),old=await client.enroll('en'),fresh=await client.enroll('en',true);storage.setItem('test-pending',JSON.stringify({id:old.id,body:{...open,sceneId:'carriage',action_id:randomUUID(),expected_version:0}}));const r=await client.recover();assert.equal(r.head.id,fresh.id);assert.equal(client.pending().length,1);assert.equal((await transport('/sessions/'+old.id)).version,0);await store.close()})
test('corrupt pending quarantines without losing a valid journal or altering story',async()=>{const {storage,store,client}=setup(),h=await client.enroll('en');storage.setItem('test-pending','broken');assert.equal(client.pending().length,0);assert.equal((await client.recover()).head.version,h.version);assert.ok([...Array(storage.length)].some((_,i)=>storage.key(i)?.includes('quarantine:')));await store.close()})
test('cloud capability and timeout transport never touch legacy keys or fallback',async()=>{const storage=new MemoryStorage();storage.setItem('carriage-pages-1-owner','legacy-identity');const lock=async<T>(_n:string,f:()=>Promise<T>)=>f();let token='',calls=0;const fake:typeof fetch=async(_url,options)=>{calls++;token=new Headers(options?.headers).get('Authorization')!;assert.ok(options?.signal);return Response.json({error:'SERVICE_UNAVAILABLE'},{status:503})};const api=cloudTransport(storage,'cloud-','/game/api/lab',lock,fake);await assert.rejects(api('/sessions'),/SERVICE_UNAVAILABLE/);assert.equal(calls,1);assert.match(token,/^Bearer [A-Za-z0-9_-]{43}$/);assert.equal(storage.getItem('carriage-pages-1-owner'),'legacy-identity');const saved=storage.getItem('cloud-capability');await assert.rejects(cloudTransport(storage,'cloud-','/game/api/lab',lock,fake)('/sessions'));assert.equal(token,'Bearer '+saved);assert.notEqual(newCapability(),newCapability())})
test('runtime selection keeps Pages and explicit legacy separate from cloud failures',()=>{assert.equal(selectRuntime('pages','yinxinghuan.github.io',''),'browser');assert.equal(selectRuntime('cloud','game.aiwaves.tech',''),'cloud');assert.equal(selectRuntime('cloud','game.aiwaves.tech','?story_runtime=legacy'),'browser');assert.equal(selectRuntime('cloud','yinxinghuan.github.io',''),'mirror');assert.equal(selectRuntime('development','localhost',''),'local')})

test('lost restart response finishes the new enrollment rather than silently returning the old session',async()=>{const {storage,store,transport,client}=setup(),old=await client.enroll('en');let fail=true;const flaky:Transport=async(p,b)=>{const r=await transport(p,b);if(p==='/sessions'&&fail){fail=false;throw Error('RESTART_LOST')}return r};await assert.rejects(new SessionClient(storage,'test-',flaky).enroll('zh',true),/RESTART_LOST/);const pending=client.read<any>('enrollment-pending',null);const restored=await new SessionClient(storage,'test-',flaky).enroll('en');assert.notEqual(restored.id,old.id);assert.equal(restored.save.locale,'zh');assert.equal(client.read('enrollment-pending',null),null);assert.equal(restored.id,(await store.create(pending.enrollment_id,'zh')).id);await store.close()})

test('cloud handshake refuses old server before posting and retries when compatible',async()=>{
 const {RUNTIME_CONTRACT,RUNTIME_HEADER}=await import('../src/runtime-contract')
 const storage=new MemoryStorage(),lock=async<T>(_n:string,f:()=>Promise<T>)=>f();let current=false,posts=0,healths=0
 const request:typeof fetch=async(url,options)=>{
  assert.equal(new Headers(options?.headers).get(RUNTIME_HEADER),RUNTIME_CONTRACT)
  if(String(url).endsWith('/health')){healths++;return Response.json(current?{runtimeContract:RUNTIME_CONTRACT}:{ok:true})}
  posts++;return Response.json({ok:true},{headers:{[RUNTIME_HEADER]:RUNTIME_CONTRACT}})
 }
 const api=cloudTransport(storage,'version-','/game/api/lab',lock,request)
 await assert.rejects(api('/sessions',{enrollment_id:randomUUID()}),/RUNTIME_VERSION_MISMATCH/);assert.equal(posts,0)
 current=true;await api('/sessions',{enrollment_id:randomUUID()});await api('/sessions')
 assert.equal(healths,2);assert.equal(posts,2)
})
test('cloud response from another runtime is not adopted after a successful handshake',async()=>{
 const {RUNTIME_CONTRACT}=await import('../src/runtime-contract')
 const api=cloudTransport(new MemoryStorage(),'version-','/game/api/lab',async(_n,f)=>f(),async url=>Response.json(String(url).endsWith('/health')?{runtimeContract:RUNTIME_CONTRACT}:{version:999}))
 await assert.rejects(api('/sessions'),/RUNTIME_VERSION_MISMATCH/)
})
test('authenticated image transport preserves binary bytes and refuses a different runtime',async()=>{
 const {RUNTIME_CONTRACT,RUNTIME_HEADER}=await import('../src/runtime-contract')
 let valid=true
 const bytes=new Uint8Array([137,80,78,71,0,255])
 const api=cloudTransport(new MemoryStorage(),'image-','/game/api/lab',async(_n,f)=>f(),async(url,init)=>{
  if(String(url).endsWith('/health'))return Response.json({runtimeContract:RUNTIME_CONTRACT})
  assert.match(new Headers(init?.headers).get('Authorization')!,/^Bearer /)
  return new Response(bytes,{headers:{'Content-Type':'image/png',[RUNTIME_HEADER]:valid?RUNTIME_CONTRACT:'older'}})
 })
 assert.deepEqual(await api('/sessions/synthetic/image/file'),bytes)
 valid=false;await assert.rejects(api('/sessions/synthetic/image/file'),/RUNTIME_VERSION_MISMATCH/)
})
