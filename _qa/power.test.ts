import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {Service,type Head} from '../server/service'
import {currentScene,states,sceneContract,validateProposal,type EntityId} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import {objectiveCopy} from '../src/ui-copy'
import {linResponse} from '../src/story'
const owner='power-tester'
function body(h:Head,target:EntityId,action:string){return {action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],type:'action',target,action}}
async function ready(db:Service,locale:'zh'|'en'='zh'){
 let h=db.create(owner,randomUUID(),locale)
 for(const [target,action] of [['cabinet','open-cabinet'],['cabinet','take-fuse'],['lin','meet-lin'],['panel','repair'],['exit','leave'],['supply','open-supply'],['supply','take-battery'],['record','read-record'],['forward','enter-cab'],['radio','install-battery']] as [EntityId,string][]){const r=await db.action(owner,h.id,body(h,target,action));assert.equal(r.accepted,true,action);h=r.head}
 return h
}
for(const route of ['lights','radio'] as const)test(`power ${route}: choice, changed route, acknowledgment, consequence, return and persistence`,async()=>{
 const db=new Service(':memory:');let h=await ready(db)
 const act=async(t:EntityId,a:string)=>{const r=await db.action(owner,h.id,body(h,t,a));h=r.head;return r}
 assert.equal((await act('radio','send-signal')).accepted,false)
 assert.equal(h.save.facts.signal_acknowledged,false)
 await act('radio','route-radio');assert.equal(h.save.stats.light,35)
 await act('radio','route-lights');assert.equal(h.save.stats.light,100)
 assert.equal((await act('radio','route-lights')).accepted,false)
 if(route==='radio')await act('radio','route-radio')
 assert.equal(states(h.save).radio,'routed-'+route)
 await act('radio','call-yard');assert.equal(h.save.facts.signal_acknowledged,false)
 const request=body(h,'radio','send-signal'),r=await db.action(owner,h.id,request);h=r.head
 assert.equal(r.accepted,true);assert.equal(h.save.facts.signal_acknowledged,true)
 assert.deepEqual(JSON.parse(JSON.stringify(r)),await db.action(owner,h.id,request))
 const light=h.save.stats.light
 assert.equal((await act('radio',route==='radio'?'route-lights':'route-radio')).accepted,false)
 assert.equal((await act('radio','send-signal')).accepted,false)
 assert.equal(h.save.stats.light,light)
 assert.equal(h.save.facts.rescue_sent,route==='radio')
 if(route==='lights')assert.match(objectiveCopy(h.save,'zh')[0],/引导灯/)
 await act('cabBack','back-baggage');await act('back','back-carriage')
 if(route==='radio'){
  assert.equal(states(h.save).panel,'emergency');assert.match(linResponse(h.save),/应急光/)
  assert.equal((await act('panel','set-beacon')).accepted,false)
 }else{
  assert.equal(states(h.save).panel,'repaired');assert.match(linResponse(h.save),/引导档/)
  const beacon=body(h,'panel','set-beacon'),first=await db.action(owner,h.id,beacon);h=first.head
  assert.equal(first.accepted,true);assert.deepEqual(JSON.parse(JSON.stringify(first)),await db.action(owner,h.id,beacon))
  assert.equal(states(h.save).panel,'beacon');assert.equal(h.save.facts.rescue_sent,true)
  assert.equal((await act('panel','set-beacon')).accepted,false)
 }
 const reloaded=db.get(owner,h.id);assert.deepEqual(reloaded.save.facts,h.save.facts);assert.equal(reloaded.save.stats.light,route==='radio'?35:100)
 assert.equal(h.save.inventory.filter(i=>i.id==='battery').reduce((n,i)=>n+i.count,0),0)
 await act('exit','go-baggage');await act('forward','enter-cab');assert.equal(states(h.save).radio,'connected')
 assert.equal((await act('radio','route-lights')).accepted,false)
 db.db.close()
})
test('power prerequisites and model scene claims cannot skip capabilities',async()=>{
 const db=new Service(':memory:');let h=db.create(owner,randomUUID(),'en')
 assert.equal((await db.action(owner,h.id,body(h,'panel','set-beacon'))).accepted,false)
 h=await ready(db,'en');h.save.facts.record_read=false;db.write(owner,h)
 let r=await db.action(owner,h.id,body(h,'radio','route-radio'));h=r.head
 r=await db.action(owner,h.id,body(h,'radio','send-signal'));h=r.head;assert.equal(r.accepted,false);assert.match(r.text,/dispatch record/)
 const context=sceneContract(h.save,'radio');assert.equal(context.power.route,'radio');assert.equal(context.power.sceneLight,'unchanged')
 assert.ok(validateProposal({kind:'dialogue',entityIds:['radio'],claims:[{entityId:'radio',state:'connected'}],text:'Help has arrived.'},h.save,'radio').includes('STATE_MISMATCH'))
 await assert.rejects(()=>db.action(owner,h.id,{...body(h,'panel','set-beacon'),sceneId:'carriage'}),/OFF_SCENE_ENTITY/)
 db.db.close()
})
test('legacy completed saves retain their ending without inventing a route',async()=>{
 const db=new Service(':memory:');const h=await ready(db);h.save.facts.rescue_sent=true
 for(const k of ['power_chosen','power_radio','signal_acknowledged','beacon_set'])delete h.save.facts[k]
 const original={version:h.version,position:structuredClone(h.position),blocks:structuredClone(h.save.blocks),light:h.save.stats.light}
 db.write(owner,h);const upgraded=db.get(owner,h.id)
 assert.equal(upgraded.save.facts.power_chosen,false);assert.equal(upgraded.save.facts.signal_acknowledged,true);assert.equal(upgraded.save.facts.beacon_set,false);assert.equal(upgraded.save.facts.rescue_sent,true)
 assert.equal(upgraded.version,original.version);assert.deepEqual(upgraded.position,original.position);assert.deepEqual(upgraded.save.blocks,original.blocks);assert.equal(upgraded.save.stats.light,original.light)
 assert.equal((await db.action(owner,h.id,body(upgraded,'radio','route-radio'))).accepted,false)
 assert.deepEqual(db.get(owner,h.id).save.facts,upgraded.save.facts);db.db.close()
})
