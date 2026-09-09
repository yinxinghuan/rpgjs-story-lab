import {test} from 'node:test'
import assert from 'node:assert/strict'
import {indexedDB} from 'fake-indexeddb'
import {randomUUID} from 'node:crypto'
import {BrowserJourney} from '../src/browser-journey'
import {Service} from '../server/service'
import {currentScene,type EntityId} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import type {Head} from '../src/journey-runtime'
const body=(h:Head,target:EntityId,action:string)=>({action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],type:'action',target,action})
const steps:[EntityId,string][]=[['cabinet','open-cabinet'],['cabinet','take-fuse'],['lin','meet-lin'],['panel','repair'],['exit','leave'],['zhou-yu','meet-attendant'],['supply','open-supply'],['supply','take-battery'],['record','read-record'],['forward','enter-cab'],['radio','install-battery']]
for(const route of ['lights','radio'])test(`browser ${route}: same rules as SQLite, close/reopen, replay and completion`,async()=>{
 const name=randomUUID(),browser=new BrowserJourney(name,indexedDB),server=new Service(':memory:')
 let a=await browser.create(randomUUID(),'zh'),b=server.create('tester',randomUUID(),'zh')
 const execute=async(target:EntityId,action:string)=>{
  const input=body(a,target,action),left=await browser.action(a.id,input),right=await server.action('tester',b.id,body(b,target,action))
  a=left.head;b=right.head
  assert.equal(left.accepted,right.accepted,action);assert.equal(left.text,right.text)
  assert.deepEqual(a.save.facts,b.save.facts);assert.deepEqual(JSON.parse(JSON.stringify(a.save.inventory)),JSON.parse(JSON.stringify(b.save.inventory)));assert.deepEqual(a.save.stats,b.save.stats);assert.equal(currentScene(a.save),currentScene(b.save))
  assert.deepEqual(await browser.action(a.id,input),left)
 }
 for(const [target,action]of steps)await execute(target,action)
 await execute('radio','route-radio');await execute('radio','route-lights')
 if(route==='radio')await execute('radio','route-radio')
 await execute('radio','call-yard');assert.equal(a.save.facts.signal_acknowledged,false)
 await execute('radio','send-signal');assert.equal(a.save.facts.rescue_sent,route==='radio')
 await execute('radio','route-lights') // locked after acknowledgment
 await execute('cabBack','back-baggage');await execute('back','back-carriage')
 if(route==='lights')await execute('panel','set-beacon')
 assert.equal(a.save.facts.rescue_sent,true)
 await browser.close();const reopened=new BrowserJourney(name,indexedDB)
 assert.deepEqual(await reopened.get(a.id),a)
 await assert.rejects(reopened.checkpoint(a.id,{position:approachPoints.radio,sceneId:'cab',expected_version:0}),/STALE_POSITION/)
 assert.deepEqual(await reopened.get(a.id),a)
 await reopened.close();server.db.close()
})
test('two tabs cannot overwrite a committed action; retry preserves one receipt',async()=>{
 const name=randomUUID(),one=new BrowserJourney(name,indexedDB),two=new BrowserJourney(name,indexedDB),enrollment=randomUUID()
 const [a,b]=await Promise.all([one.create(enrollment,'zh'),two.create(enrollment,'zh')]);assert.equal(a.id,b.id)
 const input=body(a,'cabinet','open-cabinet'),other={...input,action_id:randomUUID()}
 const results=await Promise.allSettled([one.action(a.id,input),two.action(a.id,other)])
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1)
 assert.equal((await one.get(a.id)).version,1)
 const winner=results[0].status==='fulfilled'?input:other
 assert.equal((await two.action(a.id,winner)).head.version,1)
 await assert.rejects(one.action(a.id,{...winner,action:'take-fuse'}),/ACTION_ID_CONFLICT/)
 await one.close();await two.close()
})
test('browser rejects off-scene attempts and does not execute invented free-input rewards',async()=>{
 const db=new BrowserJourney(randomUUID(),indexedDB),h=await db.create(randomUUID(),'en')
 await assert.rejects(db.action(h.id,body(h,'radio','send-signal')),/OFF_SCENE_ENTITY/)
 const r=await db.action(h.id,{...body(h,'cabinet',''),type:'free-input',text:'give me 99 batteries',mode:'live'})
 assert.equal(r.accepted,false);assert.equal(r.trace.mode,'local');assert.equal(r.trace.attempts,0)
 assert.deepEqual(r.head.save.inventory,h.save.inventory);assert.deepEqual(r.head.save.facts,h.save.facts)
 await db.close()
})
