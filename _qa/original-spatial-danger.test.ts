import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {originalTrainRuntime,originalCartridge} from '../server/original-train-runtime'
import {originalGameEntities} from '../src/original-game-projection'
import {buildDangerDirective} from '../src/vendor/original-train/engine/dangerDirector'

for(const locale of ['zh','en']as const)test(`spatial ${locale}: maintenance keeps exact costs; only the river encounter starts a danger`,async()=>{
 const directives:unknown[]=[]
 const runtime=originalTrainRuntime(()=>true,{send:async(_action,context)=>{directives.push(context.dangerDirective);throw Error('AUTHOR_ONLY')}})
 let h=runtime.initial(locale,randomUUID());const opening=structuredClone(h.save.blocks)
 const perform=async(id:string)=>{const e=originalGameEntities(h).find(e=>e.actions.some(a=>a.id===id))!;assert.ok(e,id);h=(await runtime.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,type:'action',action:id},()=>false)).head}
 for(const id of ['inspect-brakes','replace-brake-hose','repair-starter']){await perform(id);assert.equal(h.save.danger.phase,'calm')}
 // At this point the unbound text director would inject a threat on departure.
 assert.ok(buildDangerDirective(h.save,originalCartridge(locale),'commit-valley-route'))
 await perform('commit-valley-route');assert.equal(h.save.stats.condition,97);assert.equal(h.save.stats.fuel,62);assert.equal(h.save.stats.morale,58);assert.equal(h.save.danger.phase,'calm')
 assert.equal(h.save.inventory.some(i=>i.id==='spare-hose'),false)
 for(const b of opening)assert.deepEqual(h.save.blocks.find(x=>x.id===b.id),b)
 assert.equal(h.save.blocks.some(b=>b.data?.dangerPhase),false)
 assert.deepEqual(directives,[undefined,undefined,undefined,undefined])
 await perform('river-survey');assert.equal(h.save.danger.phase,'warning');assert.ok(h.save.danger.currentThreat)
 await perform('river-rescue-powered');assert.equal(h.save.stats.condition,97);assert.equal(h.save.stats.fuel,56);assert.equal(h.save.danger.phase,'calm')
})
