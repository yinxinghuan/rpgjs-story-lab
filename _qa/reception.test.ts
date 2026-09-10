import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {initialStory,runRule,type Locale} from '../src/story'
import {prepareAction,type Head,type Narrator} from '../src/journey-runtime'
import {currentScene,actionTarget,localReply,MAP_VERSION} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import {receptionActions,receptionLabels,receptionObjective} from '../src/reception'
import {chapterResult} from '../src/chapter-result'
const narrator:Narrator=async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'authored'}})
function start(locale:Locale='zh'):Head{return {id:randomUUID(),version:0,save:initialStory(locale),mapVersion:MAP_VERSION,position:approachPoints.cabinet}}
async function act(h:Head,id:string,free=false){const target=actionTarget[id];return prepareAction(h,{action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],target,type:free?'free-input':'action',...(free?{text:receptionLabels[id][h.save.locale==='zh'?0:1]}:{action:id})},narrator)}
async function chapterOne(locale:Locale,route:string){let h=start(locale);for(const id of ['open-cabinet','take-fuse','meet-lin','repair','leave','open-supply','take-battery','read-record','enter-cab','install-battery','route-'+route,'send-signal']){const r=await act(h,id);assert.equal(r.accepted,true,id);h=r.head}if(route==='lights'){for(const id of ['back-baggage','back-carriage','set-beacon','go-baggage','enter-cab'])h=(await act(h,id)).head}return h}
for(const locale of ['zh','en'] as const)for(const route of ['radio','lights'])test(`reception ${locale}/${route}: preparation, wrong-answer recovery, relationships and durable continuation`,async()=>{
 let h=await chapterOne(locale,route)
 const initialFacts={...h.save.facts},firstBlocks=structuredClone(h.save.blocks)
 assert.ok(receptionActions(h.save,'radio').includes('begin-reception'))
 const steps=['begin-reception','back-baggage','read-arrival-code','meet-attendant','check-aisle','back-carriage','check-circuit','go-baggage','enter-cab']
 for(const id of steps){const r=await act(h,id,id==='check-aisle');assert.equal(r.accepted,true,id);h=JSON.parse(JSON.stringify(r.head))}
 assert.deepEqual(h.save.blocks.slice(0,firstBlocks.length),firstBlocks)
 assert.equal(h.save.relationships.length,2)
 assert.deepEqual(receptionActions(h.save,'radio'),['confirm-arrival','retry-arrival'])
 const wrong=await act(h,'retry-arrival',true);h=wrong.head
 assert.equal(h.save.facts.arrival_uncertain,true);assert.ok(!h.save.facts.handover_ready)
 assert.equal(h.save.relationships.length,2);assert.deepEqual(h.save.inventory,[])
 h=(await act(h,'confirm-arrival',true)).head
 assert.equal(h.save.facts.handover_ready,true);assert.equal(h.save.facts.arrival_uncertain,false)
 const repeat=await act(h,'confirm-arrival');assert.equal(repeat.accepted,false);assert.equal(repeat.head.save.relationships.length,3)
 for(const id of ['back-baggage','back-carriage','complete-handover'])h=(await act(h,id)).head
 assert.equal(h.save.facts.handover_complete,true);assert.equal(chapterResult(h.save,locale)?.route,'handover')
 assert.equal(h.save.facts.power_radio,initialFacts.power_radio);assert.equal(h.save.facts.beacon_set,initialFacts.beacon_set)
 assert.deepEqual(h.save.relationships.map(r=>r.characterId).sort(),['lin','xu-lan','zhou-yu'])
 assert.equal(new Set(h.save.relationships.map(r=>r.id)).size,3)
 const again=await act(h,'complete-handover');assert.equal(again.accepted,false)
 assert.equal(again.head.save.relationships.length,3);assert.deepEqual(receptionActions(h.save,'lin'),[])
})
test('reception blocks premature actions and unrevealed people, while old completed facts are not invented',async()=>{
 const h=start();assert.deepEqual(receptionActions(h.save,'radio'),[])
 const early=runRule(h.save,'check-circuit');assert.equal(early.accepted,false);assert.equal(early.save.relationships.length,0)
 let legacy=await chapterOne('zh','radio')
 // Synthetic old completion: historical route is unknown. Never map it to lights/radio.
 delete legacy.save.facts.power_chosen;delete legacy.save.facts.power_radio;delete legacy.save.facts.beacon_set
 const before=structuredClone(legacy.save)
 legacy=(await act(legacy,'begin-reception')).head
 assert.equal(legacy.save.facts.power_chosen,undefined);assert.equal(legacy.save.facts.power_radio,undefined)
 assert.deepEqual(legacy.save.blocks.slice(0,before.blocks.length),before.blocks)
 assert.ok(receptionObjective(legacy.save,'zh'))
 const premature=await act(legacy,'confirm-arrival');assert.equal(premature.accepted,false);assert.ok(!premature.head.save.facts.handover_ready)
 legacy=(await act(legacy,'back-baggage')).head
 assert.deepEqual(receptionActions(legacy.save,'zhou-yu'),[])
 assert.equal((await act(legacy,'check-aisle')).accepted,false)
 assert.ok(!legacy.save.characters.some(c=>c.id==='zhou-yu'))
})
