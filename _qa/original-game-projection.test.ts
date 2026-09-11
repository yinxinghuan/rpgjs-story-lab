import test from 'node:test'
import assert from 'node:assert/strict'
import {originalGameEntities,originalReadingBlocks,originalGameObjective,originalActionDestinations} from '../src/original-game-projection'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainRoom} from '../src/original-train-spatial-plan'
import {randomUUID} from 'node:crypto'
import {originalPlaceLabel} from '../src/original-place-presentation'
const runtime=()=>originalTrainRuntime(()=>true)
test('original map offers real opening actions without future character markers and does not mutate the save',()=>{
 const h=runtime().initial('zh',randomUUID()),before=JSON.stringify(h),entities=originalGameEntities(h)
 assert.ok(entities.some(e=>e.actions.some(a=>a.id==='repair-starter')))
 assert.ok(entities.some(e=>e.actions.some(a=>a.id==='salvage-fuel-shed')))
 assert.deepEqual(entities.filter(e=>e.person).map(e=>e.person!.id),['ada-mechanic'])
 assert.equal(JSON.stringify(h),before)
})
test('original UI projects changed resources and route availability from the accepted server result',async()=>{
 const r=runtime();const h=r.initial('en',randomUUID());const result=await r.prepare(h,{action_id:randomUUID(),expected_version:0,sceneId:h.sceneId,position:{x:110,y:185},target:'starter',type:'action',action:'repair-starter'},()=>true)
 const entities=originalGameEntities(result.head)
 assert.ok(!entities.some(e=>e.actions.some(a=>a.id==='repair-starter')))
 assert.ok(entities.some(e=>e.actions.some(a=>a.id==='commit-valley-route')))
 assert.equal(result.head.save.stats.condition,h.save.stats.condition+5);assert.match(originalGameObjective(result.head),/engine is running/)
})
test('original UI hides actions during finale and keeps only actually present character markers',()=>{
 const h=runtime().initial('zh',randomUUID());h.save.finale.status='ready'
 assert.ok(originalGameEntities(h).every(e=>e.actions.length===0))
 h.sceneId=originalTrainRoom('river-valley');h.save.map=h.save.map.map(m=>({...m,current:m.id==='river-valley'}));h.save.location='河谷';h.save.characters[0].lastKnownLocation='北岬死站';h.save.characters[0].status='known';h.save.partyMemberIds=[]
 assert.equal(originalGameEntities(h).length,0)
})

test('reading projection removes same-turn duplicate prose without erasing changes, dialogue or later repetition',()=>{
 const h=runtime().initial('en',randomUUID())
 h.save.blocks=[{id:'action-1',kind:'event',text:'Repair'},{id:'body-1',kind:'narration',text:'The engine starts.'},{id:'change-1',kind:'change',text:'Condition +5'},{id:'summary-1',kind:'summary',text:'The engine starts.'},{id:'dialogue-1',kind:'dialogue',speaker:'Ada',text:'The engine starts.'},{id:'action-2',kind:'event',text:'Remember'},{id:'body-2',kind:'narration',text:'The engine starts.'}]
 const before=JSON.stringify(h.save),visible=originalReadingBlocks(h.save)
 assert.deepEqual(visible.map(b=>b.id),['action-1','body-1','change-1','dialogue-1','action-2','body-2']);assert.equal(JSON.stringify(h.save),before)
})

test('source branch arrival presents the current objective without rewriting the frozen save',async()=>{
 const r=runtime();let h=r.initial('en',randomUUID())
 h=(await r.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:{x:110,y:185},target:'starter',type:'action',action:'repair-starter'},()=>true)).head
 h=(await r.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:{x:270,y:405},target:'departure-control',type:'action',action:'commit-valley-route'},()=>true)).head
 const before=JSON.stringify(h);assert.match(originalGameObjective(h),/broken bridge/);assert.equal(JSON.stringify(h),before)
})

test('reading projection hides internal fact receipts while preserving real narrative and the saved history',()=>{
 const h=runtime().initial('zh',randomUUID())
 h.save.blocks=[{id:'facts-3',kind:'event',text:'世界记录已更新 · 1 项事实',data:{factIds:'clinic-rescued',factValues:'true'}},{id:'body-3',kind:'narration',text:'担架已经抵达近岸。'},{id:'change-3',kind:'change',text:'车况 -8'}]
 const before=JSON.stringify(h.save)
 assert.deepEqual(originalReadingBlocks(h.save).map(b=>b.id),['body-3','change-3'])
 assert.equal(JSON.stringify(h.save),before)
})

for(const locale of ['zh','en'] as const)test(`near-bank ${locale} display corrects only its old automatic arrival, without rewriting source regions or later arrival`,()=>{
 const h=runtime().initial(locale,randomUUID()),destination=locale==='zh'?'黎明枢纽':'Dawn Junction',arrived=locale==='zh'?'抵达：':'Arrived: '
 h.sceneId='train-at-flood-bridge';h.save.location=destination
 h.save.blocks=[{id:'action-28',kind:'event',text:'Depart'},{id:'transition-28',kind:'narration',text:'Arrive at the junction.',data:{destination}},{id:'town-28-town-depart',kind:'event',text:'The wheels stop on the near bank.'},{id:'effect-28-3',kind:'event',text:arrived+destination},{id:'action-32',kind:'event',text:'Cross'},{id:'effect-32-3',kind:'event',text:arrived+destination}]
 const before=JSON.stringify(h),visible=originalReadingBlocks(h.save)
 assert.match(originalPlaceLabel(h.sceneId,h.save),locale==='zh'?/近岸/:/Near-bank/)
 assert.ok(!visible.some(b=>b.id==='transition-28'))
 assert.match(visible.find(b=>b.id==='effect-28-3')!.text,locale==='zh'?/近岸/:/Near-bank/)
 assert.equal(visible.find(b=>b.id==='effect-32-3')!.text,arrived+destination)
 assert.equal(originalPlaceLabel('train-at-dawn-junction',h.save),destination)
 assert.equal(JSON.stringify(h),before)
})

for(const locale of ['zh','en'] as const)test(`route preparation ${locale} isolates the selected branch for buttons and free input`,async()=>{
 const r=runtime();let h=r.initial(locale,randomUUID())
 h=(await r.prepare(h,{action_id:randomUUID(),expected_version:0,sceneId:h.sceneId,position:{x:110,y:185},target:'starter',type:'action',action:'repair-starter'},()=>true)).head
 const before=JSON.stringify(h),e=originalGameEntities(h).find(e=>e.id==='departure-control')!
 assert.equal(e.actions.length,3)
 for(const a of e.actions){
  const expected=({'commit-valley-route':'river-valley','commit-quarry-route':'graystone-yard','commit-forest-route':'pine-line'} as Record<string,string>)[a.id]
  assert.deepEqual(originalActionDestinations(h,e.id,{action:a.id}),[originalTrainRoom(expected)])
  assert.deepEqual(originalActionDestinations(h,e.id,{text:'  '+a.label+'  '}),[originalTrainRoom(expected)])
  assert.deepEqual(originalActionDestinations(h,'brakes',{action:a.id}),[])
 }
 assert.deepEqual(originalActionDestinations(h,'brakes',{action:'inspect-brakes'}),[])
 assert.deepEqual(originalActionDestinations(h,e.id,{text:'???'}),[])
 assert.equal(JSON.stringify(h),before)
 // The non-selected branches must never even be prepared. A failure there
 // would prevent a valid turn despite all its own resources being available.
 const loaded:string[]=[]
 for(const scene of originalActionDestinations(h,e.id,{action:'commit-valley-route'})){
  loaded.push(scene);if(scene!==originalTrainRoom('river-valley'))throw Error('UNRELATED_SCENE_FAILED')
 }
 assert.deepEqual(loaded,[originalTrainRoom('river-valley')])
})
