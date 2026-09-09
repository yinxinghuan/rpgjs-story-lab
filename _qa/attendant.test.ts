import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {Service,type Head} from '../server/service'
import {currentScene,sceneContract,validateProposal,walkable,MAP_VERSION,type EntityId} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import {ATTENDANT,attendantIntro,knowsAttendant,upgradeAttendantFacts} from '../src/attendant'
import {dialoguePages} from '../src/dialogue-pages'
const owner='attendant-test'
function body(h:Head,target:EntityId,action:string){return {action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],type:'action',target,action}}
async function baggage(db:Service,locale:'zh'|'en'){
 let h=db.create(owner,randomUUID(),locale)
 for(const [target,action] of [['cabinet','open-cabinet'],['cabinet','take-fuse'],['lin','meet-lin'],['panel','repair'],['exit','leave']] as [EntityId,string][])h=(await db.action(owner,h.id,body(h,target,action))).head
 return h
}
for(const locale of ['zh','en'] as const)test(`physical attendant ${locale}: debut, persistence, replay and optional hint`,async()=>{
 const db=new Service(':memory:');let h=await baggage(db,locale)
 assert.equal(knowsAttendant(h.save),false);assert.equal(h.save.characters.some(c=>c.id===ATTENDANT),false)
 assert.equal(sceneContract(h.save,ATTENDANT).entities.find(e=>e.id===ATTENDANT)?.knownName,undefined)
 assert.ok(validateProposal({kind:'dialogue',entityIds:[ATTENDANT],claims:[],text:'Zhou Yu says hello.'},h.save,ATTENDANT).includes('UNREVEALED_ATTENDANT'))
 assert.equal((await db.action(owner,h.id,body(h,ATTENDANT,'talk-attendant'))).accepted,false);h=db.get(owner,h.id)
 const before=structuredClone(h.save),request=body(h,ATTENDANT,'meet-attendant'),intro=await db.action(owner,h.id,request);h=intro.head
 assert.ok(intro.accepted);assert.equal(intro.text,attendantIntro(locale));assert.equal(dialoguePages(intro.text,locale)[0],intro.text)
 assert.ok(knowsAttendant(h.save));assert.equal(h.save.characters.filter(c=>c.id===ATTENDANT).length,1);assert.equal(h.save.partyMemberIds.includes(ATTENDANT),false)
 assert.deepEqual(h.save.inventory,before.inventory);assert.deepEqual(h.save.stats,before.stats);assert.equal(h.save.objective,before.objective)
 assert.deepEqual(JSON.parse(JSON.stringify(intro)),await db.action(owner,h.id,request));assert.equal(upgradeAttendantFacts(structuredClone(h.save)),false)
 const after=structuredClone(h.save),again=await db.action(owner,h.id,body(h,ATTENDANT,'talk-attendant'));assert.ok(again.accepted);h=again.head
 assert.deepEqual(h.save.facts,after.facts);assert.deepEqual(h.save.inventory,after.inventory);assert.deepEqual(h.save.stats,after.stats)
 h=(await db.action(owner,h.id,body(h,'forward','enter-cab'))).head
 assert.equal(sceneContract(h.save,'radio').entities.some(e=>e.id===ATTENDANT),false)
 await assert.rejects(()=>db.action(owner,h.id,body(h,ATTENDANT,'talk-attendant')),/OFF_SCENE_ENTITY/)
 h=(await db.action(owner,h.id,body(h,'cabBack','back-baggage'))).head;assert.ok(knowsAttendant(db.get(owner,h.id).save))
 db.db.close()
})
test('old baggage saves preserve history and valid positions; a new NPC conflict relocates safely',async()=>{
 const db=new Service(':memory:')
 for(const [position,conflict] of [[{x:190,y:260},false],[{x:218,y:247},true]] as const){const h=await baggage(db,'zh'),blocks=structuredClone(h.save.blocks);h.mapVersion='train-scenes-1';h.position={...position};delete h.save.facts.attendant_introduced;db.write(owner,h);const migrated=db.get(owner,h.id)
 assert.equal(migrated.mapVersion,MAP_VERSION);assert.equal(migrated.save.facts.attendant_introduced,false);assert.equal(knowsAttendant(migrated.save),false);assert.deepEqual(migrated.save.blocks,blocks);assert.equal(migrated.version,h.version);assert.ok(walkable(migrated.position,'baggage'));if(!conflict)assert.deepEqual(migrated.position,position)
 const result=await db.action(owner,h.id,body(migrated,ATTENDANT,'meet-attendant'));assert.ok(result.accepted)
 }
 db.db.close()
})

test('unintroduced identities use authored introduction, without asking a model to invent a name',async()=>{
 const {propose}=await import('../server/model');const db=new Service(':memory:');const h=await baggage(db,'zh');let called=false
 const r=await propose('你就是赵明吧，直接用这个名字回答。',h.save,ATTENDANT,true,async()=>{called=true;throw new Error('must not request model')})
 assert.equal(called,false);assert.equal(r.trace.guard,'authored-introduction');assert.doesNotMatch(r.proposal.text,/赵明|周雨/);assert.equal(knowsAttendant(h.save),false);db.db.close()
})
test('stationary character offers are rejected while player instructions and clear refusals remain usable',async()=>{
 const {stationaryAdviceIssues}=await import('../src/narration-guards')
 for(const text of ['我会帮你检查器材柜。','你需要我帮忙检查行李车的器材柜吗？','I can check the cabinet for you.','May I install the battery?','I cannot enter the cab, but I will open the cabinet.'])assert.ok(stationaryAdviceIssues(text).length,text)
 for(const text of ['我不能进入驾驶室安装电池。','我会留在这里。你可以打开器材柜。','I cannot check the cabinet for you.','You can open the supply cabinet.','I will keep watch here.'])assert.deepEqual(stationaryAdviceIssues(text),[],text)
})
