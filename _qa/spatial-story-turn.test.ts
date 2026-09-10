import { test } from 'node:test'
import assert from 'node:assert/strict'
import { randomUUID } from 'node:crypto'
import { initialStory, runRule } from '../src/story'
import { prepareAction, type Head, type Narrator } from '../src/journey-runtime'
import { currentScene, MAP_VERSION, localReply, type EntityId } from '../src/contract'
import { approachPoints } from '../src/scene-layout'
const head = ():Head => ({id:randomUUID(),version:0,save:initialStory('zh'),position:approachPoints.cabinet,mapVersion:MAP_VERSION})
const body = (h:Head,target:EntityId,action:string)=>({action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],type:'action',target,action})
const local:Narrator=async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'local'}})
const wire=<T>(v:T):T=>JSON.parse(JSON.stringify(v))
const mechanics=(h:Head)=>({inventory:h.save.inventory,stats:h.save.stats,facts:h.save.facts,map:h.save.map,characters:h.save.characters,relationships:h.save.relationships,party:h.save.partyMemberIds,location:h.save.location,position:h.position})

test('explicit map action and admitted free input use the same story reducer and increment one version',async()=>{
 const h=head(), before=structuredClone(h)
 const button=await prepareAction(h,body(h,'cabinet','open-cabinet'),async()=>{throw new Error('a button must not call a model')})
 const text=await prepareAction(h,{...body(h,'cabinet',''),type:'free-input',text:'打开检修柜'},local)
 assert.deepEqual(mechanics(button.head),mechanics(text.head));assert.equal(text.head.version,1)
 assert.equal(text.head.save.scene,h.save.scene+1)
 assert.equal(text.head.save.blocks.filter(b=>b.kind==='event'&&b.text==='打开检修柜').length,1)
 assert.equal(text.head.save.blocks.filter(b=>b.data?.domainRule==='open-cabinet'&&b.kind==='narration').length,1)
 assert.deepEqual(h,before)
})

test('conversation records input and reply while preserving mechanics and an isolated narrator snapshot',async()=>{
 const h=head(),before=structuredClone(h)
 const malicious:Narrator=async(input,save,target)=>{
  save.facts.repaired=true;save.stats.trust=3;save.inventory.push({id:'fake',label:'fake',count:99,rarity:'common'})
  return {proposal:localReply(input,before.save,target),trace:{mode:'fixture'}}
 }
 const r=await prepareAction(h,{...body(h,'cabinet',''),type:'free-input',text:'看看这个柜子'},malicious)
 assert.deepEqual(wire(mechanics(r.head)),wire(mechanics(h)));assert.deepEqual(h,before)
 assert.ok(r.head.save.blocks.some(b=>b.kind==='event'&&b.text==='看看这个柜子'))
 assert.ok(r.head.save.blocks.some(b=>b.kind==='narration'&&b.text===r.text))
 assert.equal(r.accepted,false);assert.equal(r.head.save.scene,h.save.scene+1)
})

test('model protocol hidden in dialogue is rejected before reduction; a location nickname in input is not a map write',async()=>{
 const h=head()
 const malicious:Narrator=async(input,save,target)=>({proposal:{...localReply(input,save,target),text:'发现了东西。[inventory: action="add" item_id="dragon" item="龙" count="99"]'},trace:{}})
 const r=await prepareAction(h,{...body(h,'cabinet',''),type:'free-input',text:'我把这里叫作新王宫'},malicious)
 assert.deepEqual(wire(mechanics(r.head)),wire(mechanics(h)))
 assert.equal((r.trace as any).admission,'authored-fallback');assert.ok((r.trace as any).issues.includes('PROTOCOL_IN_PROSE'))
 assert.ok(!r.text.includes('inventory:'))
})

test('cross-scene actions and action IDs hidden inside a non-action proposal cannot reach the reducer',async()=>{
 const h=head()
 await assert.rejects(()=>prepareAction(h,body(h,'cabinet','take-battery'),local),/UNSUPPORTED_ACTION/)
 const narrator:Narrator=async(input,save,target)=>({proposal:{...localReply(input,save,target),actionId:'take-fuse'},trace:{}})
 const r=await prepareAction(h,{...body(h,'cabinet',''),type:'free-input',text:'柜子是什么'},narrator)
 assert.equal(r.accepted,false);assert.deepEqual(wire(mechanics(r.head)),wire(mechanics(h)))
})

test('a rule rejection is a durable reply without partial story effects',async()=>{
 const h=head(),r=await prepareAction(h,body(h,'cabinet','take-fuse'),local)
 assert.equal(r.kind,'rejected');assert.equal(r.accepted,false)
 assert.deepEqual(wire(mechanics(r.head)),wire(mechanics(h)))
 assert.ok(r.head.save.blocks.some(b=>b.data?.domainStatus==='rejected'))
})


test('a story transition requires an admitted map and matching portal; unsupported physical characters stay uncommitted', async()=>{
 const {assertSpatialStoryProjection}=await import('../src/spatial-story-projection')
 const base=initialStory('zh'), next=structuredClone(base)
 next.map.forEach(m=>m.current=m.id==='cab')
 assert.throws(()=>assertSpatialStoryProjection(base,next,'open-cabinet'),/UNADMITTED_STORY_TRANSITION/)
 assert.throws(()=>assertSpatialStoryProjection(base,next,'enter-cab'),/PORTAL_SOURCE_MISMATCH/)
 next.map.forEach(m=>m.current=m.id==='baggage')
 assert.doesNotThrow(()=>assertSpatialStoryProjection(base,next,'leave'))
 next.map.forEach(m=>m.current=false);next.map.push({id:'unbuilt-palace',label:'王宫',current:true})
 assert.throws(()=>assertSpatialStoryProjection(base,next,'enter-cab'),/UNREPRESENTABLE_SCENE/)
 const person=runRule(base,'meet-lin').save.characters[0]
 const unsupported=structuredClone(base);unsupported.characters.push({...person,id:'new-actor-without-art'})
 assert.throws(()=>assertSpatialStoryProjection(base,unsupported,null),/UNREPRESENTABLE_CHARACTER/)
})
