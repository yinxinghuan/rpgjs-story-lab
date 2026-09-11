import test from 'node:test'
import assert from 'node:assert/strict'
import {originalGameEntities,originalReadingBlocks,originalGameObjective} from '../src/original-game-projection'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainRoom} from '../src/original-train-spatial-plan'
import {randomUUID} from 'node:crypto'
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
