import {originalReleasedPresentation} from '../server/original-presentation'
import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {PreflightStorage} from '../server/preflight-storage'
import {randomUUID,randomBytes} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createHandler,handleApi,CarriageJourneyAuthority} from '../worker/source'
import {RUNTIME_CONTRACT,RUNTIME_HEADER} from '../src/runtime-contract'
import {ORIGINAL_RUNTIME_CONTRACT,ORIGINAL_RUNTIME_HEADER} from '../src/original-runtime-contract'
import {originalSessionHttp} from '../src/original-session-http'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalCartridge,originalPresentationUnavailable,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {createOriginalActionInterpreter,type OriginalActionInterpreter} from '../server/original-action-interpreter'
const world=originalTrainChapterSpatialPlan()
const lock=async<T>(_name:string,work:()=>Promise<T>)=>work()
function memory(){const values=new Map<string,string>();return {get length(){return values.size},getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>{values.delete(k)},key:(i:number)=>[...values.keys()][i]??null,clear:()=>values.clear()} as Storage}
function intent(h:OriginalHead,id:string,free=false){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id);return {target:e.id,position:e.approach,...(free?{type:'free-input',text:h.save.choices.find(c=>c.id===id)?.label??(chapter?originalChapterLabel(id,h.save.locale):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0])}:{type:'action',action:id})}}
async function harness(admit:OriginalPresentationGate=originalReleasedPresentation,interpreter?:OriginalActionInterpreter){
 const dir=mkdtempSync(join(tmpdir(),'original-http-')),objects=new Map<string,CarriageJourneyAuthority>(),storage=new PreflightStorage(dir),forwarded:Request[]=[]
 const env={CARRIAGE_JOURNEYS:{idFromName:(name:string)=>name,get:(key:unknown)=>({fetch:async(request:Request)=>{
  const id=String(key);let object=objects.get(id)
  if(!object){object=new CarriageJourneyAuthority(storage.context(id),undefined,undefined,undefined,admit,interpreter);objects.set(id,object)}
  forwarded.push(request.clone());return object.fetch(request)
 }})}}
 const handler=handleApi;let lost='';let requests=0
 const server=createServer(async(req,res)=>{try{requests++;const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);const request=new Request('http://127.0.0.1'+req.url,{method:req.method,headers,body:req.method==='GET'||req.method==='HEAD'?undefined:Buffer.concat(chunks)});const response=await handler(request,env);if(lost&&req.method==='POST'&&req.url?.endsWith(lost)&&response.ok){lost='';res.destroy();return}res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))}catch{res.writeHead(500);res.end('{}')}})
 await new Promise<void>((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve)})
 const address=server.address() as {port:number},base=`http://127.0.0.1:${address.port}`
 const reopen=()=>{objects.clear();storage.close()}
 return {base,env,forwarded,requests:()=>requests,lose:(suffix:string)=>{lost=suffix},reopen,close:async()=>{await new Promise<void>((resolve,reject)=>server.close(e=>e?reject(e):resolve()));reopen();rmSync(dir,{recursive:true,force:true})}}
}
for(const locale of ['zh','en'] as const)for(const route of ['quarry','valley','forest'] as const)test(`original HTTP ${locale}/${route}: full journey, lost responses, disk reopen and complete ending`,async()=>{
 const h=await harness(),store=memory();let connection=originalSessionHttp(store,lock,fetch,h.base),head:OriginalHead
 try{
  h.lose('/sessions');await assert.rejects(connection.client.enroll(locale));h.reopen();connection=originalSessionHttp(store,lock,fetch,h.base);head=await connection.client.enroll(locale)
  const id=head.id,assetBindings=structuredClone(head.assets)
  const steps=['repair-starter',`commit-${route}-route`,...(route==='valley'?['river-survey','river-rescue-manual','river-treat','river-depart']:route==='forest'?['pine-inspect','pine-reverse','pine-meet','pine-survey-route','pine-invite','pine-depart']:['yard-meet','yard-work-pact','yard-first-exit']),'tunnel-inspect',route==='valley'?'tunnel-doctor-led':'tunnel-captain-led','tunnel-ventilate','tunnel-depart',...(route==='quarry'?[]:['yard-meet',route==='valley'?'yard-medical-pact':'yard-work-pact']),'yard-route-brief','yard-invite','yard-depart','pass-inspect',route==='forest'?'pass-lin-watch':'pass-player-watch','pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart','town-inspect','town-grid-aid','town-public-rules','town-refuel','town-repair','town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange','bridge-rail-crossing','junction-review','junction-settle-basic']
  for(const [i,action] of steps.entries()){
   if(i===0){h.lose('/actions');await assert.rejects(connection.client.send(head,intent(head,action)));assert.equal(connection.client.hasPending(),true);h.reopen();connection=originalSessionHttp(store,lock,fetch,h.base);head=(await connection.client.recover()).head}
   else head=(await connection.client.send(head,intent(head,action,i%2===1))).head
   assert.equal(head.id,id);assert.equal(head.version,i+1);assert.deepEqual(head.assets,assetBindings)
  }
  assert.equal(head.save.finale.status,'ready');const before=structuredClone(head)
  h.lose('/ending');await assert.rejects(connection.client.sendEnding(head));assert.equal(connection.client.hasPending(),true);h.reopen();connection=originalSessionHttp(store,lock,fetch,h.base)
  const ending=await connection.client.recover();head=ending.head;assert.equal(head.save.finale.status,'complete');assert.equal(head.save.finale.ending?.anchorFamily,'settle-basic');assert.equal(ending.cursor,steps.length);assert.equal(head.version,steps.length+1);assert.deepEqual({...head.save,finale:before.save.finale},before.save)
  assert.equal(connection.client.hasPending(),false);assert.deepEqual(await connection.client.enroll(locale),head);assert.deepEqual(head.assets,assetBindings)
  const events=await connection.api(`/sessions/${id}/events?after=0`),directory=await connection.api('/sessions');assert.equal(events.events.length,steps.length);assert.equal(directory.sessions[0].cursor,steps.length)
  await assert.rejects(connection.api(`/sessions/${id}/position`,{expected_version:0,sceneId:head.sceneId,position:head.position}),/STALE_POSITION/)
  assert.deepEqual(await connection.api(`/sessions/${id}/position`,{expected_version:head.version,sceneId:head.sceneId,position:head.position}),{position:head.position})
  assert.ok(h.requests()>=steps.length*2);assert.ok(h.forwarded.every(r=>r.headers.get('Authorization')===null));assert.ok(h.forwarded.every(r=>/^[a-f0-9]{64}$/.test(r.headers.get('X-Authority-Owner')??'')))
 }finally{await h.close()}
})
const headers=(token=randomBytes(32).toString('base64url'))=>({'Content-Type':'application/json',Authorization:'Bearer '+token,[RUNTIME_HEADER]:RUNTIME_CONTRACT,[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT})
test('original semantic HTTP commits an admitted action once after lost response and disk reopen',async()=>{
 let calls=0
 const interpreter=createOriginalActionInterpreter(async()=>++calls%2===1?{kind:'action',actionId:'repair-starter'}:{valid:true,issues:[]})
 const h=await harness(()=>true,interpreter),auth=headers()
 const call=async(path:string,b?:unknown)=>{const r=await fetch(h.base+'/api/original'+path,{method:b===undefined?'GET':'POST',headers:auth,body:b===undefined?undefined:JSON.stringify(b)});return {status:r.status,data:await r.json()}}
 try{
  const head:OriginalHead=(await call('/sessions',{enrollment_id:randomUUID(),locale:'zh'})).data
  const path='/sessions/'+head.id,body={...intent(head,'repair-starter'),action_id:randomUUID(),expected_version:0,sceneId:head.sceneId,type:'free-input',text:'我来把这台坏掉的机器修好',mode:'live'}
  delete (body as any).action
  h.lose('/actions');await assert.rejects(call(path+'/actions',body));assert.equal(calls,2)
  h.reopen();const replay=await call(path+'/actions',body)
  assert.equal(replay.status,200);assert.equal(replay.data.accepted,true);assert.equal(replay.data.head.version,1);assert.equal(replay.data.head.save.stats.condition,87)
  assert.deepEqual(replay.data.interpretation,{input:body.text,actionId:'repair-starter'});assert.equal(calls,2)
  assert.deepEqual((await call(path)).data,replay.data.head);assert.equal((await call(path+'/events?after=0')).data.events.length,1)
  const rejected=await call(path+'/actions',{...body,action_id:randomUUID(),expected_version:1,text:'不要检修启动机'})
  assert.equal(rejected.status,409);assert.equal(rejected.data.error,'ORIGINAL_ACTION_REQUIRES_COMMITMENT');assert.equal(calls,2)
  assert.deepEqual((await call(path)).data,replay.data.head)
 }finally{await h.close()}
})
test('original browser client clears a refused input without losing progress or blocking the next action',async()=>{
 const h=await harness(),connection=originalSessionHttp(memory(),lock,fetch,h.base)
 try{
  const head=await connection.client.enroll('zh'),draft=intent(head,'repair-starter',true)
  const result=await connection.client.send(head,{...draft,text:'不要检修启动机'})
  assert.equal(result.accepted,false);assert.equal(result.rejectionCode,'ORIGINAL_ACTION_REQUIRES_COMMITMENT');assert.deepEqual(result.head,head);assert.equal(connection.client.hasPending(),false)
  const accepted=await connection.client.send(head,intent(head,'repair-starter'))
  assert.equal(accepted.accepted,true);assert.equal(accepted.head.version,1);assert.equal(accepted.head.save.stats.condition,87)
 }finally{await h.close()}
})
test('original dialogue client recovers lost replies and recalls the same speaker after disk reopen',async()=>{
 const h=await harness(),store=memory();let c=originalSessionHttp(store,lock,fetch,h.base)
 try{
  const start=await c.client.enroll('zh'),e=world.entities.find(e=>e.scene===start.sceneId&&world.characters.find(p=>p.id==='ada-mechanic')!.entities.includes(e.id))!
  const b={type:'dialogue',target:e.id,position:e.approach,text:'我担心乘客们睡不好。'}
  h.lose('/actions');await assert.rejects(c.client.send(start,b));assert.equal(c.client.hasPending(),true)
  h.reopen();c=originalSessionHttp(store,lock,fetch,h.base);const recovered=await c.client.recover()
  assert.equal(recovered.head.version,1);assert.equal(recovered.head.save.scene,0);assert.equal(c.client.hasPending(),false)
  assert.deepEqual({...recovered.head.save,blocks:start.save.blocks},start.save)
  const recalled=await c.client.send(recovered.head,{...b,text:'你还记得我刚才说什么吗？'})
  assert.ok(recalled.head.save.blocks.at(-1)!.text.includes(b.text));assert.equal(recalled.head.version,2);assert.equal(recalled.head.save.scene,0)
  const repaired=await c.client.send(recalled.head,intent(recalled.head,'repair-starter'))
  assert.equal(repaired.head.version,3);assert.equal(repaired.head.save.scene,1);assert.equal(repaired.head.save.stats.condition,87)
  h.reopen();assert.deepEqual(await c.client.enroll('zh'),repaired.head)
 }finally{await h.close()}
})
test('original HTTP isolates owners and cartridges while existing carriage route remains functional',async()=>{
 const h=await harness(),auth=headers();const call=async(path:string,b?:unknown,hs=auth)=>{const r=await fetch(h.base+path,{method:b===undefined?'GET':'POST',headers:hs,body:b===undefined?undefined:JSON.stringify(b)});return {status:r.status,data:await r.json()}}
 try{
  const enrollment={enrollment_id:randomUUID(),locale:'en'},original=await call('/api/original/sessions',enrollment),carriage=await call('/api/lab/sessions',enrollment)
  assert.equal(original.status,200);assert.equal(carriage.status,200);assert.notEqual(original.data.id,carriage.data.id);assert.equal(original.data.save.version,8);assert.equal(carriage.data.save.version,10)
  const path='/api/original/sessions/'+original.data.id
  assert.equal((await call(path,undefined,headers())).status,404)
  assert.equal((await call('/api/lab/sessions/'+original.data.id)).status,404)
  assert.equal((await call('/api/original/sessions/'+carriage.data.id)).status,404)
  const edit={action_id:randomUUID(),expected_version:0,sceneId:'carriage',position:{x:72,y:184},type:'action',target:'cabinet',action:'open-cabinet'}
  // Use the actual live layout, rather than borrowing original geometry.
  const {approachPoints}=await import('../src/scene-layout');edit.position=approachPoints.cabinet
  const accepted=await call('/api/lab/sessions/'+carriage.data.id+'/actions',edit);assert.equal(accepted.status,200);assert.equal(accepted.data.accepted,true)
  assert.equal((await call(path)).data.version,0);h.reopen();assert.equal((await call(path)).data.version,0);assert.equal((await call('/api/lab/sessions/'+carriage.data.id)).data.version,1)
 }finally{await h.close()}
})
test('original HTTP release, presentation, capability, contract and body gates reject before writing',async()=>{
 const h=await harness(originalPresentationUnavailable),auth=headers(),url=h.base+'/api/original/sessions',body=JSON.stringify({enrollment_id:randomUUID(),locale:'en'})
 try{
  assert.equal((await createHandler(true,false,false)(new Request(url,{method:'POST',headers:auth,body}),h.env)).status,404)
  assert.equal((await fetch(url,{method:'POST',body})).status,401)
  assert.equal((await fetch(url,{method:'POST',headers:{...auth,[ORIGINAL_RUNTIME_HEADER]:'old'},body})).status,409)
  assert.equal((await fetch(url,{method:'POST',headers:auth,body:'['})).status,400)
  assert.equal((await fetch(url,{method:'POST',headers:auth,body:'x'.repeat(6001)})).status,413)
  assert.equal((await fetch(url,{method:'POST',headers:auth,body:JSON.stringify({enrollment_id:randomUUID(),locale:'fr'})})).status,400)
  const blocked=await fetch(url,{method:'POST',headers:auth,body});assert.equal(blocked.status,409);assert.equal((await blocked.json()).error,'ORIGINAL_PRESENTATION_NOT_READY')
  const listing=await fetch(url,{headers:auth});assert.deepEqual(await listing.json(),{sessions:[]})
  assert.equal((await fetch(url,{method:'DELETE',headers:auth,body:'{}'})).status,405)
 }finally{await h.close()}
})
