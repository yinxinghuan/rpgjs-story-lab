import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomUUID} from 'node:crypto'
import {dieselFacts,dieselReleases,dieselResource,originalDieselState,type DieselEntity} from '../src/original-diesel-art'
import {originalEquipmentSlots,originalEquipmentBodies,originalEquipmentAnimation} from '../src/original-equipment-art'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalBoundWorldPlan} from '../src/original-world-plan'
import {assertOriginalAssetBindings} from '../src/original-asset-releases'
import {originalWorldWalkable,originalWorldWalkabilitySnapshot} from '../src/original-world-space'
import {findGridPath} from '../src/grid-path'

test('new journeys bind reviewed diesel art; older snapshots retain previous equipment',()=>{
 const bytes=readFileSync('public/'+dieselResource.path.slice(2))
 assert.equal(bytes.length,dieselResource.bytes)
 assert.equal(createHash('sha256').update(bytes).digest('hex'),dieselResource.sha256)
 const head=originalTrainRuntime(()=>true).initial('zh',randomUUID())
 if(head.assets?.version!==1)throw Error('fixture requires base bindings')
 for(const {entityId} of Object.values(dieselReleases)){
  assert.ok(head.assets.fixedEquipment?.[entityId]);delete head.assets.fixedEquipment![entityId]
 }
 const restored=originalTrainRuntime(()=>true).upgrade(head)
 assert.deepEqual(restored.assets,head.assets)
 for(const e of originalBoundWorldPlan(head.assets).entities.filter(e=>Object.hasOwn(dieselFacts,e.id))){
  assert.ok(!originalEquipmentSlots(e.scene,head.assets).some(s=>s.entityId===e.id))
  assert.ok(!originalEquipmentBodies(e.scene,head.assets).some(s=>s.id===e.id))
 }
})

test('reserve collision preserves existing spawn-to-interaction paths in all five scenes',()=>{
 const runtime=originalTrainRuntime(()=>true),head=runtime.initial('zh',randomUUID())
 if(head.assets?.version!==1)throw Error('fixture requires base bindings')
 const legacy=structuredClone(head)
 if(legacy.assets?.version!==1)throw Error('fixture requires base bindings')
 for(const {entityId} of Object.values(dieselReleases))delete legacy.assets.fixedEquipment![entityId]
 head.assets.fixedEquipment={...head.assets.fixedEquipment,...Object.fromEntries(Object.entries(dieselReleases).map(([release,{entityId}])=>[entityId,release]))}
 const world=originalBoundWorldPlan(head.assets)
 for(const scene of world.scenes.filter(s=>world.entities.some(e=>e.scene===s.id&&Object.hasOwn(dieselFacts,e.id)))){
  const before={...legacy,sceneId:scene.id},after={...head,sceneId:scene.id}
  const oldWalkable=originalWorldWalkabilitySnapshot(before),newWalkable=originalWorldWalkabilitySnapshot(after)
  assert.equal(newWalkable(scene.spawn),true,scene.id+' spawn')
  for(const entity of world.entities.filter(e=>e.scene===scene.id)){
   const oldPath=findGridPath(scene.spawn,entity.approach,oldWalkable)
   if(!oldPath.length)continue // Existing inaccessible targets are not evidence about the new obstacle.
   const path=findGridPath(scene.spawn,entity.approach,newWalkable)
   assert.ok(path.length,scene.id+' -> '+entity.id)
   assert.ok(path.every(newWalkable),entity.id+' collision-free path')
  }
 }
 assert.deepEqual(runtime.upgrade(legacy).assets,legacy.assets,'old journey bindings are not upgraded implicitly')
})

for(const [release,{entityId}] of Object.entries(dieselReleases))test(`${entityId}: refuelling commits once, empty tank and collision survive restoration`,async()=>{
 const runtime=originalTrainRuntime(()=>true),h=runtime.initial('zh',randomUUID())
 assert.equal(h.assets?.version,1);if(h.assets?.version!==1)throw Error('fixture requires base bindings')
 h.assets.fixedEquipment={...h.assets.fixedEquipment,[entityId]:release}
 assertOriginalAssetBindings(h.assets)
 const e=originalBoundWorldPlan(h.assets).entities.find(e=>e.id===entityId)!
 h.sceneId=e.scene;h.position=e.approach
 const node=originalBoundWorldPlan(h.assets).scenes.find(s=>s.id===e.scene)!.storyLocationId
 if(entityId==='bridge-reserve')h.save.facts['bridge-approach-reached']=true
 for(const n of h.save.map)n.current=n.id===node
 assert.ok(h.save.map.some(n=>n.current),'synthetic fixture must select actual chapter')
 h.save.stats.fuel=20
 const body=originalEquipmentBodies(e.scene,h.assets).find(b=>b.id===entityId)!
 assert.ok(body);assert.equal(originalWorldWalkable(h,{x:body.x,y:body.y}),false)
 assert.equal(originalWorldWalkable(h,e.approach),true)
 assert.ok(findGridPath(e.approach,{x:e.approach.x+20,y:e.approach.y},p=>originalWorldWalkable(h,p)).length)
 const before=originalEquipmentSlots(e.scene,h.assets)
 assert.equal(originalEquipmentAnimation(h.save,entityId,0,h.assets),'full')
 const request={action_id:randomUUID(),expected_version:h.version,sceneId:e.scene,position:e.approach,target:entityId,type:'action' as const,action:e.actions![0]}
 const result=await runtime.prepare(h,request,()=>true)
 assert.equal(result.accepted,true);assert.equal(result.head.save.stats.fuel,32)
 assert.equal(originalDieselState(result.head.save,entityId as DieselEntity),'empty')
 const restored=runtime.upgrade(JSON.parse(JSON.stringify(result.head)))
 assert.deepEqual(originalEquipmentSlots(restored.sceneId,restored.assets),before)
 assert.deepEqual(originalEquipmentBodies(restored.sceneId,restored.assets).find(b=>b.id===entityId),body)
 assert.equal(originalEquipmentAnimation(restored.save,entityId,5000,restored.assets),'empty')
 await assert.rejects(()=>runtime.prepare(restored,{...request,action_id:randomUUID(),expected_version:restored.version},()=>true))
 assert.equal(restored.save.stats.fuel,32)
})
