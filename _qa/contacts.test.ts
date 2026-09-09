import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {Service,type Head} from '../server/service'
import {currentScene,states,sceneContract,validateProposal,type EntityId} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import {objectiveCopy} from '../src/ui-copy'
import {dispatcherIntro,DISPATCHER,knowsDispatcher,radioContactAvailable,upgradeContactFacts} from '../src/contacts'
import {dialoguePages} from '../src/dialogue-pages'
import {localReply} from '../src/contract'
const owner='power-tester'
function body(h:Head,target:EntityId,action:string){return {action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],type:'action',target,action}}
async function ready(db:Service,locale:'zh'|'en'='zh'){
 let h=db.create(owner,randomUUID(),locale)
 for(const [target,action] of [['cabinet','open-cabinet'],['cabinet','take-fuse'],['lin','meet-lin'],['panel','repair'],['exit','leave'],['supply','open-supply'],['supply','take-battery'],['record','read-record'],['forward','enter-cab'],['radio','install-battery']] as [EntityId,string][]){const r=await db.action(owner,h.id,body(h,target,action));assert.equal(r.accepted,true,action);h=r.head}
 return h
}

for(const locale of ['zh','en'] as const)test(`radio contact ${locale}: visible introduction, memory, permissions and recovery`,async()=>{
 const db=new Service(':memory:');let h=await ready(db,locale)
 const act=async(t:EntityId,a:string)=>{const r=await db.action(owner,h.id,body(h,t,a));h=r.head;return r}
 assert.equal(knowsDispatcher(h.save),false);assert.equal(h.save.characters.some(c=>c.id===DISPATCHER),false)
 assert.equal((await act('radio','ask-dispatch')).accepted,false)
 assert.equal((await act('radio','brief-dispatch')).accepted,false)
 const hidden={kind:'dialogue',entityIds:['radio'],claims:[],text:locale==='zh'?'许岚说你好。':'Xu Lan says hello.'}
 assert.ok(validateProposal(hidden,h.save,'radio').includes('UNREVEALED_CONTACT'))
 await act('radio','route-radio')
 const request=body(h,'radio','send-signal'),intro=await db.action(owner,h.id,request);h=intro.head
 assert.equal(intro.accepted,true);assert.ok(intro.text.startsWith(dispatcherIntro(locale)))
 const pages=dialoguePages(intro.text,locale)
 assert.ok(pages[0].includes(dispatcherIntro(locale)))
 assert.equal(knowsDispatcher(h.save),true);assert.equal(h.save.characters.filter(c=>c.id===DISPATCHER).length,1)
 assert.equal(h.save.partyMemberIds.includes(DISPATCHER),false)
 assert.deepEqual(JSON.parse(JSON.stringify(intro)),await db.action(owner,h.id,request))
 assert.equal((await act('radio','meet-dispatch')).accepted,false)
 assert.equal((await act('radio','brief-dispatch')).accepted,true)
 const facts=structuredClone(h.save.facts),stats=structuredClone(h.save.stats)
 assert.equal((await act('radio','brief-dispatch')).accepted,false)
 const reply=await act('radio','ask-dispatch');assert.equal(reply.accepted,true)
 assert.match(reply.text,locale==='zh'?/你说林/:/You said Lin/)
 assert.deepEqual(h.save.facts,facts);assert.deepEqual(h.save.stats,stats)
 assert.equal(knowsDispatcher(db.get(owner,h.id).save),true)
 assert.deepEqual(validateProposal(localReply('hi',h.save,'radio'),h.save,'radio'),[])
 assert.equal(sceneContract(h.save,'radio').contacts.length,1)
 assert.ok(validateProposal({...hidden,entityIds:[DISPATCHER],claims:[{entityId:DISPATCHER,state:'standing'}]},h.save,'radio').includes('STATE_MISMATCH'))
 assert.ok(validateProposal({...hidden,text:'Xu Lan stands beside you.'},h.save,'radio').includes('CONTACT_NOT_PHYSICAL'))
 await act('cabBack','back-baggage');assert.equal(radioContactAvailable(h.save),false)
 assert.equal(sceneContract(h.save,'supply').contacts.length,0)
 await assert.rejects(()=>db.action(owner,h.id,body(h,'radio','ask-dispatch')),/OFF_SCENE_ENTITY/)
 assert.ok(validateProposal({...hidden,entityIds:[DISPATCHER]},h.save,'supply').includes('CONTACT_UNAVAILABLE'))
 db.db.close()
})
test('old acknowledged journey introduces on demand without inventing history or changing completion',async()=>{
 const db=new Service(':memory:');let h=await ready(db)
 h.save.facts.rescue_sent=true;h.save.facts.signal_acknowledged=true
 delete h.save.facts.dispatcher_introduced;delete h.save.facts.dispatcher_briefed
 const before=structuredClone(h);db.write(owner,h);h=db.get(owner,h.id)
 assert.equal(knowsDispatcher(h.save),false);assert.deepEqual(h.save.blocks,before.save.blocks)
 const r=await db.action(owner,h.id,body(h,'radio','meet-dispatch'));h=r.head
 assert.equal(r.accepted,true);assert.equal(knowsDispatcher(h.save),true)
 assert.equal(h.save.facts.rescue_sent,true);assert.equal(h.save.facts.power_chosen,false)
 assert.deepEqual(h.save.stats,before.save.stats);assert.equal(h.save.scene,before.save.scene+1)
 const known=structuredClone(h.save);assert.equal(upgradeContactFacts(known),false)
 const incorrect=structuredClone(h.save);incorrect.blocks=before.save.blocks;incorrect.relationships=[];incorrect.partyMemberIds=[]
 assert.equal(upgradeContactFacts(incorrect),true);assert.equal(knowsDispatcher(incorrect),false)
 const established=structuredClone(h.save);established.blocks=[];established.partyMemberIds.push(DISPATCHER)
 upgradeContactFacts(established);assert.equal(knowsDispatcher(established),true)
 db.db.close()
})

test('model report memory contains only the actual report and grants no remote entity',async()=>{
 const db=new Service(':memory:');let h=await ready(db)
 for(const action of ['route-lights','send-signal'])h=(await db.action(owner,h.id,body(h,'radio',action))).head
 assert.deepEqual(sceneContract(h.save,'radio').contacts[0].reports,[])
 h=(await db.action(owner,h.id,body(h,'radio','brief-dispatch'))).head
 const before=structuredClone(h.save),context=sceneContract(h.save,'radio')
 assert.equal(context.contacts[0].reports.length,1);assert.equal(context.contacts[0].reports[0].source,'player-report');assert.match(context.contacts[0].reports[0].content,/林留在客厢看护电路/)
 assert.equal(context.entities.some(e=>e.id==='lin'),false)
 assert.ok(validateProposal({kind:'dialogue',entityIds:['lin'],claims:[],text:'林现在回答了你。'},h.save,'radio').includes('OFF_SCENE_ENTITY'))
 assert.deepEqual(h.save,before)
 h=(await db.action(owner,h.id,body(h,'cabBack','back-baggage'))).head
 assert.deepEqual(sceneContract(h.save,'supply').contacts,[]);db.db.close()
})

test('reports told over the radio are not inherited by a physical character',async()=>{
 const db=new Service(':memory:');let h=await ready(db)
 const act=async(t:EntityId,a:string)=>{const r=await db.action(owner,h.id,body(h,t,a));assert.ok(r.accepted);h=r.head}
 for(const action of ['route-lights','send-signal','brief-dispatch'])await act('radio',action)
 const radio=sceneContract(h.save,'radio');assert.equal(radio.conversation.speakerId,DISPATCHER);assert.deepEqual(radio.conversation.reports,radio.contacts[0].reports);assert.equal(radio.conversation.reports.length,1)
 await act('cabBack','back-baggage');await act('zhou-yu','meet-attendant')
 const before=structuredClone(h.save),person=sceneContract(h.save,'zhou-yu');assert.equal(person.conversation.speakerId,'zhou-yu');assert.deepEqual(person.conversation.reports,[]);assert.deepEqual(person.contacts,[]);assert.deepEqual(h.save,before)
 await act('forward','enter-cab');assert.equal(sceneContract(h.save,'radio').conversation.reports.length,1);db.db.close()
})
