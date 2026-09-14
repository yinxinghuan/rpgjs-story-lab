import test from 'node:test'
import assert from 'node:assert/strict'
import {randomBytes,randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {PreflightStorage} from '../server/preflight-storage'
import {CarriageJourneyAuthority,createHandler,handleApi} from '../worker/source'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
import {OLD_STREET_API_PATH as base,OLD_STREET_RUNTIME_HEADER as header,OLD_STREET_RUNTIME_CONTRACT as contract} from '../src/old-street-runtime-contract'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import type {OldStreetHead} from '../src/old-street-head'

const handler=createHandler(true,false,false,()=>false,()=>false,false,false,false,true)
function request(path:string,token:string,body?:unknown){return new Request('https://worker.invalid'+base+path,{method:body===undefined?'GET':'POST',headers:{Authorization:'Bearer '+token,[RUNTIME_HEADER]:RUNTIME_CONTRACT,[header]:contract,'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})}
function harness(admitted=true){
 const dir=mkdtempSync(join(tmpdir(),'oldstreet-worker-')),storage=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>(),names=new Set<string>()
 const env={CARRIAGE_JOURNEYS:{idFromName:(id:string)=>id,get:(id:unknown)=>({fetch:async(r:Request)=>{
  const key=String(id);names.add(key)
  let object=objects.get(key)
  if(!object){object=new CarriageJourneyAuthority(storage.context(key),undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,admitted?()=>true:undefined);objects.set(key,object)}
  return object.fetch(r)
 }})}}
 return {env,names,reopen:()=>{objects.clear();storage.close()},close:()=>{objects.clear();storage.close();rmSync(dir,{recursive:true,force:true})}}
}
test('oldstreet Worker stays release-gated and rejects untrusted identity and runtime',async()=>{
 const h=harness(false),token=randomBytes(32).toString('base64url')
 try{
  const enroll={enrollment_id:randomUUID(),locale:'zh'}
  assert.equal((await handleApi(request('/sessions',token,enroll),h.env)).status,404)
  assert.equal((await handler(request('/sessions','',enroll),h.env)).status,401)
  const outdated=request('/sessions',token,enroll);outdated.headers.delete(header)
  assert.equal((await handler(outdated,h.env)).status,409)
  assert.equal((await handler(request('/sessions',token,{...enroll,owner:'forged'}),h.env)).status,400)
  const denied=await handler(request('/sessions',token,enroll),h.env)
  assert.equal(denied.status,409);assert.equal((await denied.json()).error,'OLD_STREET_PRESENTATION_NOT_READY')
 }finally{h.close()}
})
for(const locale of ['zh','en'] as const)test(`oldstreet Worker ${locale}: complete route survives disk reopen and private capability replay`,async()=>{
 const h=harness(),token=randomBytes(32).toString('base64url'),other=randomBytes(32).toString('base64url')
 try{
  const enrollment={enrollment_id:randomUUID(),locale}
  let response=await handler(request('/sessions',token,enrollment),h.env)
  assert.equal(response.status,200)
  let head=await response.json() as OldStreetHead
  for(const step of ['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter','street','oldstreet:leave']){
   const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===head.sceneId&&d.destination.room===step)!.actionId
   const target=oldStreetSpatialPlan(head.save).entities.find(e=>e.scene===head.sceneId&&e.actions.includes(action))!
   const input={type:'action',action,action_id:randomUUID(),expected_version:head.version,sceneId:head.sceneId,target:target.id,position:target.approach}
   response=await handler(request('/sessions/'+head.id+'/actions',token,input),h.env)
   assert.equal(response.status,200,step)
   const receipt=await response.json();head=receipt.head
   h.reopen()
   assert.deepEqual(await (await handler(request('/sessions/'+head.id,token),h.env)).json(),head)
   assert.deepEqual(await (await handler(request('/sessions/'+head.id+'/actions',token,input),h.env)).json(),receipt)
   assert.equal((await handler(request('/sessions/'+head.id,other),h.env)).status,404)
  }
  assert.equal(head.save.finale.status,'complete')
  const directory=await (await handler(request('/sessions',token),h.env)).json()
  assert.deepEqual(directory.sessions.map((s:{id:string})=>s.id),[head.id])
  const events=await (await handler(request('/sessions/'+head.id+'/events',token),h.env)).json()
  assert.equal(events.events.length,11)
  assert.ok([...h.names].every(n=>/^oldstreet-v1:[a-f0-9]{64}$/.test(n)))
  assert.ok(![...h.names].some(n=>n.includes(token)))
  assert.match(response.headers.get('Cache-Control')!,/private/)
 }finally{h.close()}
})

test('cloud client restores an ambiguous action using the same capability and request after reload',async()=>{
 const {oldStreetSessionHttp}=await import('../src/old-street-session')
 const h=harness(),values=new Map<string,string>()
 const storage={getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>{values.delete(k)}} as Storage
 const lock=async<T>(_key:string,work:()=>Promise<T>)=>work()
 let lose=false
 const transport:typeof fetch=async(input,init)=>{
  const r=new Request(input,init),response=await handler(r,h.env)
  if(lose&&r.url.endsWith('/actions')&&response.ok){lose=false;throw Error('CONNECTION_LOST')}
  return response
 }
 try{
  let client=oldStreetSessionHttp(storage,lock,transport,'https://worker.invalid').client
  const head=await client.enroll('zh'),door=oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='shop')!
  lose=true
  await assert.rejects(client.send(head,{type:'action',action:door.actionId,target:door.id,position:door.approach}),/CONNECTION_LOST/)
  h.reopen()
  client=oldStreetSessionHttp(storage,lock,transport,'https://worker.invalid').client
  const resumed=await client.enroll('zh')
  const recovered=await client.recover()
  const current=await client.enroll('zh')
  assert.equal(current.sceneId,'shop');assert.equal(current.version,1)
  const events=await (await handler(request('/sessions/'+head.id+'/events',values.get('oldstreet-story-1:capability')!),h.env)).json()
  assert.equal(events.events.length,1)
  assert.equal(resumed.id,head.id)
  assert.ok([...values.keys()].every(k=>k.startsWith('oldstreet-story-1:')))
 }finally{h.close()}
})
