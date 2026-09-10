/** Synthetic production canary. Capabilities live only in this process, never in output/files. */
import assert from 'node:assert/strict'
import {RUNTIME_CONTRACT,RUNTIME_HEADER,RELEASE_ID} from '../src/runtime-contract'
import {activeRelay,relayAction} from '../src/relay-content'
import {randomBytes,randomUUID} from 'node:crypto'
import {approachPoints} from '../src/scene-layout'
import {currentScene,actionTarget,type EntityId} from '../src/contract'
import {DatabaseSync} from 'node:sqlite'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {restoreJourneyToEmptyDatabase} from '../server/journey-backup'
import type {Head} from '../src/journey-runtime'
const base=process.argv[2]
if(!base||!process.argv.includes('--allow-new-test-journeys'))throw Error('Pass the exact HTTPS game URL and --allow-new-test-journeys; writes isolated synthetic journeys.')
const url=new URL(base)
if((url.protocol!=='https:'&&!(process.argv.includes('--loopback')&&url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname)))||url.search||url.hash)throw Error('Expected an HTTPS game URL without query/hash')
const api=new URL('./api/lab',url.href.endsWith('/')?url.href:url.href+'/').href
const owner=randomBytes(32).toString('base64url'),other=randomBytes(32).toString('base64url')
let calls=0
async function call(path:string,body?:unknown,token=owner,expected=200){
 calls++
 const r=await fetch(api+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',[RUNTIME_HEADER]:RUNTIME_CONTRACT,...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)})
 assert.equal(r.headers.get(RUNTIME_HEADER),RUNTIME_CONTRACT)
 assert.equal(r.status,expected,`${path.replace(/[a-f0-9-]{36}/g,'<session>')} HTTP status`)
 return r.json()
}
const health=await call('/health');assert.equal(health.production,true);assert.equal(health.runtimeContract,RUNTIME_CONTRACT);assert.equal(health.release,RELEASE_ID);assert.equal(health.identityMode,'anonymous-capability-v1')
await call('/sessions',undefined,'',401)
const endings=[]
for(const route of ['radio','lights']){
 const enrollment={enrollment_id:randomUUID(),locale:route==='radio'?'zh':'en'}
 let h:Head=await call('/sessions',enrollment)
 assert.deepEqual(await call('/sessions',enrollment),h)
 await call('/sessions',{...enrollment,locale:enrollment.locale==='zh'?'en':'zh'},owner,409)
 await call('/sessions/'+h.id,undefined,other,404)
 const ids=['open-cabinet','take-fuse','meet-lin','repair','leave','meet-attendant',relayAction('offer','zhou-yu'),relayAction('accept','zhou-yu'),'back-carriage',relayAction('deliver','lin'),'go-baggage',relayAction('finish','zhou-yu'),'open-supply','take-battery','read-record','enter-cab','install-battery','route-'+route,'send-signal',...(route==='lights'?['back-baggage','back-carriage','set-beacon','go-baggage','enter-cab']:[]),'begin-reception','back-baggage','check-aisle','read-arrival-code','back-carriage','check-circuit','go-baggage','enter-cab','confirm-arrival','back-baggage','back-carriage','complete-handover','go-baggage','enter-cab','receive-clearance','back-baggage','back-carriage','release-guidance','enter-walkway','report-safe-arrival','return-carriage','enter-walkway']
 const steps:[EntityId,string][]=ids.map(id=>[actionTarget[id],id])
 for(const [target,action] of steps){
  const body={action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],type:'action',target,action}
  const r=await call('/sessions/'+h.id+'/actions',body);assert.equal(r.accepted,true,action);h=r.head
  assert.deepEqual(await call('/sessions/'+h.id+'/actions',body),r)
  if(action==='take-fuse'){
   await call('/sessions/'+h.id+'/actions',{...body,action_id:randomUUID()},owner,409)
   await call('/sessions/'+h.id+'/actions',{...body,action:'open-cabinet'},owner,409)
   await call('/sessions/'+h.id+'/position',{sceneId:'carriage',expected_version:0,position:{x:188,y:330}},owner,409)
  }
 }
 assert.equal(h.save.facts.rescue_sent,true)
 assert.equal(h.save.facts.journey_complete,true);assert.equal(currentScene(h.save),'walkway');assert.equal(activeRelay(h.save)?.phase,'completed')
 assert.equal(h.save.relationships.filter(r=>r.axis==='message-received').length,1);assert.equal(h.save.relationships.filter(r=>r.axis==='message-promise-kept').length,1)
 assert.equal(h.save.inventory.filter(i=>['fuse','battery'].includes(i.id)).reduce((n,i)=>n+i.count,0),0)
 assert.deepEqual(await call('/sessions/'+h.id),h)
 const events=(await call('/sessions/'+h.id+'/events?after=0')).events
 assert.equal(events.length,steps.length)
 assert.deepEqual(events.map((e:any)=>e.cursor),Array.from({length:steps.length},(_,i)=>i+1))
 assert.deepEqual((await call('/sessions/'+h.id+'/events?after='+steps.length)).events,[])
 const backup=await call('/sessions/'+h.id+'/backup')
 await call('/sessions/'+h.id+'/backup',undefined,other,404)
 await call('/sessions/'+h.id+'/backup',{},owner,405)
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 const restored=new ProductionAuthority(db,async()=>{throw Error('NO_MODEL_DURING_RESTORE')})
 const restore=await restoreJourneyToEmptyDatabase(db,backup)
 const backupOwner=backup.payload.journey.owner
 assert.deepEqual(restored.get(backupOwner,h.id),h)
 const previous=backup.payload.receipts[1],action=JSON.parse(previous.digest).body
 assert.deepEqual(await restored.action(backupOwner,h.id,action),JSON.parse(previous.response))
 assert.deepEqual(restored.get(backupOwner,h.id),h);raw.close()
 endings.push({backupRestored:restore.events===steps.length,route,actions:steps.length,version:h.version,scene:currentScene(h.save),rescueSent:true,journeyComplete:true,relayCompleted:true})
}
assert.equal((await call('/sessions')).sessions.length,2)
assert.deepEqual((await call('/sessions',undefined,other)).sessions,[])
console.log(JSON.stringify({at:new Date().toISOString(),base:url.href,health,calls,endings,checks:['enrollment-replay','enrollment-conflict','action-replay','action-id-conflict','stale-version','stale-position','owner-isolation','event-cursors','head-reopen','two-complete-routes','relay-and-relationships','walkway-return','consumed-inventory','cloud-backup-to-fresh-sqlite','restored-receipt-replay','no-http-import'],result:'pass'},null,2))
