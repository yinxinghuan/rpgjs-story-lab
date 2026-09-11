import {assertOriginalClientHead} from '../src/original-session-client'
import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalStoryPreviewDefinition,originalScenePreviewPlugin} from '../server/original-scene-preview'
import {originalBoundSceneResources,originalRendererMapIds,originalEnvironmentVersion,originalSceneBackgroundVersion,assertOriginalAssetBindings,ORIGINAL_BACKGROUND_PLATFORM,currentOriginalBackgrounds,type OriginalAssetBindings} from '../src/original-asset-releases'
import {GRAYSTONE_BACKGROUND,originalEnvironmentLayouts,originalEnvironmentMapXml} from '../src/original-environment-layouts'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalWorldWalkable} from '../src/original-world-space'
const yard='train-at-graystone-yard',north='train-at-dead-station'
const oldAssets:OriginalAssetBindings={version:1,backgrounds:{[north]:ORIGINAL_BACKGROUND_PLATFORM}}

test('new room art is bound independently; old snapshots and map bytes stay unchanged',()=>{
 const base=originalStoryPreviewDefinition(),r=originalTrainRuntime(()=>true),h=r.initial('zh',randomUUID()),old=originalBoundSceneResources(base,oldAssets),next=originalBoundSceneResources(base,h.assets)
 assert.equal(originalSceneBackgroundVersion(h.assets,yard),GRAYSTONE_BACKGROUND);assert.equal(originalSceneBackgroundVersion(oldAssets,yard),undefined)
 assert.deepEqual(originalRendererMapIds(oldAssets),{});assert.deepEqual(originalRendererMapIds(h.assets),Object.fromEntries(Object.entries(originalEnvironmentLayouts).map(([id,l])=>[l.scene,l.map.path.slice(6,-4)])));
 const incomplete=structuredClone(base);incomplete.scenes[yard].assets=incomplete.scenes[yard].assets.filter(a=>a.kind!=='map');assert.throws(()=>originalBoundSceneResources(incomplete,h.assets),/MAP_SLOT_MISSING/);
 assert.notEqual(originalEnvironmentVersion(oldAssets),originalEnvironmentVersion(h.assets));assert.deepEqual(old.scenes[yard],base.scenes[yard])
 assert.equal(next.scenes[yard].assets.find(a=>a.kind==='map')!.sha256,originalEnvironmentLayouts[GRAYSTONE_BACKGROUND].map.sha256)
 assert.notEqual(next.scenes[yard].assets.find(a=>a.kind==='background')!.sha256,old.scenes[yard].assets.find(a=>a.kind==='background')!.sha256)
 for(const scene of Object.keys(base.scenes))if(!Object.hasOwn(currentOriginalBackgrounds,scene))assert.deepEqual(next.scenes[scene],base.scenes[scene])
 for(const backgrounds of [{[north]:ORIGINAL_BACKGROUND_PLATFORM,[yard]:ORIGINAL_BACKGROUND_PLATFORM},{[north]:ORIGINAL_BACKGROUND_PLATFORM,'train-at-tunnel':GRAYSTONE_BACKGROUND}])assert.throws(()=>assertOriginalAssetBindings({version:1,backgrounds}),/UNSUPPORTED/)
 const emitted:any[]=[];originalScenePreviewPlugin(true).generateBundle.call({emitFile:(a:any)=>emitted.push(a)})
 for(const room of Object.values(next.scenes))for(const asset of room.assets){const file=emitted.find(a=>a.fileName===asset.path.slice(2));assert.ok(file);assert.equal(createHash('sha256').update(file.source).digest('hex'),asset.sha256)}
})
test('the actual roof silhouette blocks only its own image version, with matching TMX and unchanged story',async()=>{
 const r=originalTrainRuntime(()=>true),world=originalTrainChapterSpatialPlan();let h=r.initial('en',randomUUID())
 for(const action of ['repair-starter','commit-quarry-route']){const entity=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;h=(await r.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:entity.approach,target:entity.id,type:'action',action},()=>true)).head}
 assert.equal(h.sceneId,yard);const old={...structuredClone(h),assets:oldAssets,position:{x:62,y:234}},point=old.position
 assert.equal(originalWorldWalkable(old,point),true);assert.equal(originalWorldWalkable(h,point),false);assert.throws(()=>r.position(h,point),/INVALID_POSITION/)
 assert.deepEqual(r.upgrade(old),old)
 const safe=r.upgrade({...h,position:point});assert.deepEqual(safe.save,h.save);assert.ok(originalWorldWalkable(safe,safe.position));assert.notDeepEqual(safe.position,point)
 const xml=originalEnvironmentMapXml(GRAYSTONE_BACKGROUND);assert.match(xml,/x="60" y="246" width="14" height="14"/);assert.match(xml,/x="60" y="394" width="14" height="4"/)
 for(const entity of world.entities.filter(e=>e.scene===yard))assert.ok(originalWorldWalkable(h,entity.approach),entity.id)
})

test('forest route continues through every bound room to the ending, preserving versions and reachable interactions',async()=>{
 const {environmentStoryRoute}=await import('./environment-story-route'),r=originalTrainRuntime(()=>true),world=originalTrainChapterSpatialPlan();let h=r.initial('zh',randomUUID());const assets=structuredClone(h.assets),seen=new Set<string>()
 for(const action of environmentStoryRoute){
  // Flood-fill actual footprint space, including character and equipment bodies.
  const start=world.scenes.find(s=>s.id===h.sceneId)!.spawn,queue=[start],visited=new Set([start.x+','+start.y]);
  for(let n=0;n<queue.length;n++){const p=queue[n];for(const [dx,dy]of [[2,0],[-2,0],[0,2],[0,-2]]){const q={x:p.x+dx,y:p.y+dy},k=q.x+','+q.y;if(!visited.has(k)&&originalWorldWalkable(h,q)){visited.add(k);queue.push(q)}}}
  for(const entity of world.entities.filter(e=>e.scene===h.sceneId&&e.actions.length)){assert.ok(originalWorldWalkable(h,entity.approach),action+': '+entity.id);assert.ok(queue.some(p=>Math.hypot(p.x-entity.approach.x,p.y-entity.approach.y)<=2),action+': disconnected '+entity.id)}
  const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;assert.ok(e,action)
  h=(await r.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action},()=>true)).head
  assert.deepEqual(h.assets,assets);assert.deepEqual(r.upgrade(h),h);seen.add(h.sceneId)
 }
 assert.equal(h.save.finale.status,'ready');for(const scene of Object.keys(currentOriginalBackgrounds))if(scene!==north)assert.ok(seen.has(scene),scene)
})

test('image-bound full geometry opens removed hut floor, blocks guardrail edge and keeps legacy saves unchanged',async()=>{
 const {environmentStoryRoute}=await import('./environment-story-route'),{originalBoundWorldPlan}=await import('../src/original-world-plan'),r=originalTrainRuntime(()=>true);let h=r.initial('en',randomUUID())
 for(const action of environmentStoryRoute){if(action==='bridge-inspect')break;const e=originalBoundWorldPlan(h.assets).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;h=(await r.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action},()=>true)).head}
 assert.equal(h.sceneId,'train-at-flood-bridge');const old={...structuredClone(h),assets:oldAssets},floor={x:62,y:275},water={x:62,y:80}
 assert.equal(originalWorldWalkable(old,floor),false);assert.equal(originalWorldWalkable(h,floor),true);assert.deepEqual(r.position(h,floor),floor)
 const atFloor={...h,position:floor};assertOriginalClientHead(atFloor);assert.deepEqual(r.upgrade(atFloor),atFloor)
 assert.equal(originalWorldWalkable(old,water),true);assert.equal(originalWorldWalkable(h,water),false);assert.throws(()=>r.position(h,water),/INVALID_POSITION/);assert.throws(()=>assertOriginalClientHead({...h,position:water}),/UNSUPPORTED/)
 for(const p of [{x:NaN,y:275},{x:-1,y:275},{x:380,y:275},{x:62,y:570}])assert.throws(()=>r.position(h,p),/INVALID_POSITION/)
 assert.deepEqual(r.upgrade(old),old)
})

test('both train fates reach a vehicle-free junction with version-bound safe character placements',async()=>{
 const {environmentStoryRoute}=await import('./environment-story-route'),{originalBoundWorldPlan}=await import('../src/original-world-plan'),{originalEnvironmentWalkable}=await import('../src/original-environment-layouts'),{originalGameEntities}=await import('../src/original-game-projection'),{originalCharacterBodies}=await import('../src/original-character-space')
 for(const anchor of [false,true]){const r=originalTrainRuntime(()=>true);let h=r.initial('zh',randomUUID());const steps=environmentStoryRoute.filter(a=>!anchor||a!=='town-repair').map(a=>anchor&&a==='bridge-rail-crossing'?'bridge-anchor-crossing':anchor&&a==='junction-settle-basic'?'junction-bridge-basic':a)
  for(const action of steps){const e=originalBoundWorldPlan(h.assets).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;h=(await r.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action},()=>true)).head}
  assert.equal(h.save.facts['bridge-train-fate'],anchor?'anchored':'preserved');assert.equal(h.save.finale.status,'ready')
  const plan=originalBoundWorldPlan(h.assets),scene=h.sceneId,id=originalSceneBackgroundVersion(h.assets,scene),lin=plan.entities.find(e=>e.id===scene+'-lin-scout')!,ren=plan.entities.find(e=>e.id===scene+'-ren-medic')!
  assert.equal(lin.position.y,300);assert.equal(ren.position.y,300);assert.equal(originalBoundWorldPlan(oldAssets).entities.find(e=>e.id===lin.id)!.position.y,270)
  const projected=originalGameEntities(h).find(e=>e.id===lin.id)!;assert.deepEqual(projected.position,lin.position);assert.deepEqual(projected.approach,lin.approach)
  const body=originalCharacterBodies(h).find(b=>b.id==='lin-scout')!;assert.equal(body.y,285);assert.equal(originalEnvironmentWalkable(id,scene,{x:body.x,y:body.y}),true)
  for(const e of [lin,ren])assert.ok(originalEnvironmentWalkable(id,scene,{x:e.position.x-4.5,y:e.position.y-15}));assert.deepEqual(r.upgrade(h),h)
 }
})
