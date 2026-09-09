/** Synthetic production canary. Capabilities live only in this process, never in output/files. */
import assert from 'node:assert/strict'
import {randomBytes,randomUUID} from 'node:crypto'
import {approachPoints} from '../src/scene-layout'
import {currentScene,type EntityId} from '../src/contract'
import type {Head} from '../src/journey-runtime'
const base=process.argv[2]
if(!base||!process.argv.includes('--allow-new-test-journeys'))throw Error('Pass the exact HTTPS game URL and --allow-new-test-journeys; writes isolated synthetic journeys.')
const url=new URL(base)
if(url.protocol!=='https:'||url.search||url.hash)throw Error('Expected an HTTPS game URL without query/hash')
const api=new URL('./api/lab',url.href.endsWith('/')?url.href:url.href+'/').href
const owner=randomBytes(32).toString('base64url'),other=randomBytes(32).toString('base64url')
let calls=0
async function call(path:string,body?:unknown,token=owner,expected=200){
 calls++
 const r=await fetch(api+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)})
 assert.equal(r.status,expected,`${path.replace(/[a-f0-9-]{36}/g,'<session>')} HTTP status`)
 return r.json()
}
const health=await call('/health');assert.equal(health.production,true);assert.equal(health.identityMode,'anonymous-capability-v1')
await call('/sessions',undefined,'',401)
const endings=[]
for(const route of ['radio','lights']){
 const enrollment={enrollment_id:randomUUID(),locale:route==='radio'?'zh':'en'}
 let h:Head=await call('/sessions',enrollment)
 assert.deepEqual(await call('/sessions',enrollment),h)
 await call('/sessions',{...enrollment,locale:enrollment.locale==='zh'?'en':'zh'},owner,409)
 await call('/sessions/'+h.id,undefined,other,404)
 const steps:[EntityId,string][]=[['cabinet','open-cabinet'],['cabinet','take-fuse'],['lin','meet-lin'],['panel','repair'],['exit','leave'],['supply','open-supply'],['supply','take-battery'],['record','read-record'],['forward','enter-cab'],['radio','install-battery'],['radio','route-'+route],['radio','call-yard'],['radio','send-signal'],['cabBack','back-baggage'],['back','back-carriage']]
 if(route==='lights')steps.push(['panel','set-beacon'])
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
 assert.equal(h.save.inventory.filter(i=>['fuse','battery'].includes(i.id)).reduce((n,i)=>n+i.count,0),0)
 assert.deepEqual(await call('/sessions/'+h.id),h)
 const events=(await call('/sessions/'+h.id+'/events?after=0')).events
 assert.equal(events.length,steps.length)
 assert.deepEqual(events.map((e:any)=>e.cursor),Array.from({length:steps.length},(_,i)=>i+1))
 assert.deepEqual((await call('/sessions/'+h.id+'/events?after='+steps.length)).events,[])
 endings.push({route,actions:steps.length,version:h.version,scene:currentScene(h.save),rescueSent:true})
}
assert.equal((await call('/sessions')).sessions.length,2)
assert.deepEqual((await call('/sessions',undefined,other)).sessions,[])
console.log(JSON.stringify({at:new Date().toISOString(),base:url.href,health,calls,endings,checks:['enrollment-replay','enrollment-conflict','action-replay','action-id-conflict','stale-version','stale-position','owner-isolation','event-cursors','head-reopen','two-endings','consumed-inventory'],result:'pass'},null,2))
