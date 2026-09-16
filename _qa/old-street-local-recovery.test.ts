import {decodeSpatialArt} from '../src/spatial-art-decode'
import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {OldStreetAuthority} from '../server/old-street-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetSession} from '../src/old-street-session'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import {oldStreetRecoveredTurn} from '../src/old-street-turn'

test('a lost campaign enrollment keeps its chosen story and language; unavailable trials preserve the current journey',async()=>{
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const value=work();raw.exec('COMMIT');return value}catch(e){raw.exec('ROLLBACK');throw e}}}
 const s=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,undefined,async()=>{throw Error('NO_GENERATION_DURING_ENROLLMENT')})
 const values=new Map<string,string>(),storage:Storage={get length(){return values.size},key:i=>[...values.keys()][i]??null,getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,String(v))},removeItem:k=>{values.delete(k)},clear:()=>values.clear()}
 let lose=false,refuse=false;const requests:any[]=[]
 const request:typeof fetch=async(url,init)=>{
  const path=String(url).split('/api/oldstreet-dev')[1]
  if(path==='/sessions'){
   const body=JSON.parse(String(init?.body));requests.push(body)
   if(refuse)return Response.json({error:'CAMPAIGN_NOT_AVAILABLE'},{status:503})
   const h=s.create('synthetic',body.enrollment_id,body.locale,body.options)
   if(lose){lose=false;throw Error('LOST_ENROLLMENT')}
   return Response.json(h)
  }
  return Response.json(s.get('synthetic',path.split('/')[2]))
 }
 const client=()=>oldStreetSession(storage,async(_name,work)=>work(),request).client
 try{
  const previous=await client().enroll('en');lose=true
  await assert.rejects(client().enroll('zh',true,{campaign:'letter-trail-v1'}),/LOST_ENROLLMENT/)
  const restored=await client().enroll('en')
  assert.deepEqual(requests[1],requests[2]);assert.equal(restored.save.locale,'zh')
  assert.deepEqual(restored.campaign,{version:1});assert.notEqual(restored.id,previous.id)
  assert.equal(s.get('synthetic',previous.id).campaign,undefined)
  refuse=true
  await assert.rejects(client().enroll('en',true,{campaign:'letter-trail-v1'}),/CAMPAIGN_NOT_AVAILABLE/)
  assert.equal((await client().enroll('en')).id,restored.id)
 }finally{raw.close()}
})

test('local transport bounds a lost receipt and recovers the same committed action once',async t=>{
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const result=work();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}
 let attemptCalls=0
 const server=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,async()=>{
  attemptCalls++
  return {kind:'attempt',outcome:'inconclusive',text:'你轻敲抽屉，里面的东西还无法确认。',discoveryIds:[]}
 })
 const values=new Map<string,string>()
 const storage:Storage={get length(){return values.size},key:i=>[...values.keys()][i]??null,getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,String(v))},removeItem:k=>{values.delete(k)},clear:()=>values.clear()}
 let controller:AbortController,loseReceipt=false
 const actionIds:string[]=[]
 t.mock.method(AbortSignal,'timeout',(ms:number)=>{assert.equal(ms,30000);controller=new AbortController();return controller.signal})
 const request:typeof fetch=async(url,init)=>{
  assert.equal(init?.cache,'no-store');assert.equal(init?.credentials,'same-origin');assert.ok(init?.signal)
  const path=String(url).split('/api/oldstreet-dev')[1],body=init?.body?JSON.parse(String(init.body)):undefined
  let result:unknown
  if(path==='/sessions')result=server.create('test-owner',body.enrollment_id,body.locale)
  else if(path.endsWith('/actions')){
   actionIds.push(body.action_id);result=await server.action('test-owner',path.split('/')[2],body)
   if(loseReceipt){loseReceipt=false;controller.abort(new DOMException('Synthetic lost receipt','TimeoutError'));init.signal.throwIfAborted()}
  }else result=server.get('test-owner',path.split('/')[2])
  return Response.json(result)
 }
 try{
  const connection=oldStreetSession(storage,async(_name,work)=>work(),request)
  const start=await connection.client.enroll('zh')
  const door=oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='shop')!
  const target=oldStreetSpatialPlan(start.save).entities.find(e=>e.id===door.id)!
  loseReceipt=true
  await assert.rejects(connection.client.send(start,{type:'action',action:door.actionId,target:target.id,position:target.approach}),{name:'TimeoutError'})
  assert.equal(connection.client.hasPending(),true)
  assert.equal(server.get('test-owner',start.id).version,start.version+1)
  const recovered=await connection.client.recover()
  assert.equal(recovered.head.sceneId,'shop');assert.equal(recovered.head.version,start.version+1)
  assert.equal(actionIds.length,2);assert.equal(actionIds[0],actionIds[1])
  assert.equal(server.events('test-owner',start.id,0).length,1)
  assert.equal(connection.client.hasPending(),false)
  const drawer=oldStreetSpatialPlan(recovered.head.save).entities.find(e=>e.id==='drawer')!
  const opened=await connection.client.send(recovered.head,{type:'action',action:'oldstreet:move-box',target:'drawer',position:drawer.approach})
  loseReceipt=true
  await assert.rejects(connection.client.send(opened.head,{type:'action',action:'oldstreet:take-lens',target:'drawer',position:drawer.approach}),{name:'TimeoutError'})
  assert.equal(connection.client.hasPending(),true)
  const resumed=await connection.client.recover()
  assert.equal(resumed.head.save.inventory.find((i:{id:string})=>i.id==='lens')?.count,1)
  assert.equal(resumed.head.version,opened.head.version+1)
  assert.equal(actionIds.at(-1),actionIds.at(-2))
  assert.equal(server.events('test-owner',start.id,0).length,3)
  assert.equal(connection.client.hasPending(),false)
  // The page reloads after a free attempt commits but its response is lost.
  // Enrollment already returns the new version: ordinary before/after rendering
  // cannot recover this reply, so use the exact pending receipt identifier.
  loseReceipt=true
  await assert.rejects(connection.client.send(resumed.head,{type:'free-input',text:'轻敲抽屉听听',target:'drawer',position:drawer.approach}),{name:'TimeoutError'})
  assert.equal(attemptCalls,1)
  const reconnect=oldStreetSession(storage,async(_name,work)=>work(),request)
  const initial=await reconnect.client.enroll('zh')
  const pending=reconnect.client.pending().find(p=>p.id===initial.id)
  const reply=await reconnect.client.recover()
  assert.equal(initial.version,reply.head.version)
  assert.equal(reply.accepted,true)
  assert.equal(attemptCalls,1,'replaying a committed receipt must not regenerate the attempt')
  assert.equal(actionIds.at(-1),actionIds.at(-2))
  assert.equal(reconnect.client.hasPending(),false)
  assert.deepEqual(reply.head.save.inventory,resumed.head.save.inventory)
  const recoveredTurn=oldStreetRecoveredTurn(pending,reply.head,reply.accepted)
  assert.equal(recoveredTurn.length,1)
  assert.equal(recoveredTurn[0].text,'你轻敲抽屉，里面的东西还无法确认。')
  assert.equal(server.events('test-owner',start.id,0).length,4)
  // The authority has acknowledged a door transfer before the destination art
  // decodes. Reload must read that head, not resubmit the completed transfer.
  const exit=oldStreetDoors().find(d=>d.room==='shop'&&d.destination.room==='street')!
  const transferred=await reconnect.client.send(reply.head,{type:'action',action:exit.actionId,target:exit.id,position:exit.approach})
  await assert.rejects(decodeSpatialArt('blob:broken-room',{createImage:()=>({src:'',decode:async():Promise<void>=>{throw Error('corrupt image')}} as HTMLImageElement)}),/ART_IMAGE_DECODE_FAILED/)
  assert.equal(connection.client.hasPending(),false)
  const posts=actionIds.length
  const reloaded=oldStreetSession(storage,async(_name,work)=>work(),request)
  const enrolled=await reloaded.client.enroll('zh')
  const recovery=await reloaded.client.recover()
  const restored=recovery?.head??enrolled
  assert.equal(restored.sceneId,'street')
  assert.deepEqual(restored.position,transferred.head.position)
  assert.equal(restored.version,transferred.head.version)
  assert.equal(restored.save.inventory.find((i:{id:string})=>i.id==='lens')?.count,1)
  assert.equal(actionIds.length,posts)
  assert.equal(server.events('test-owner',start.id,0).length,5)

 }finally{raw.close()}
})
