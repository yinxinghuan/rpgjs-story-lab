import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalStoryPreviewDefinition,originalScenePreviewPlugin} from '../server/original-scene-preview'
import {originalBoundSceneResources,originalRendererMapIds,originalEnvironmentVersion,originalSceneBackgroundVersion,assertOriginalAssetBindings,ORIGINAL_BACKGROUND_PLATFORM,type OriginalAssetBindings} from '../src/original-asset-releases'
import {GRAYSTONE_BACKGROUND,originalEnvironmentLayouts,originalEnvironmentMapXml} from '../src/original-environment-layouts'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalWorldWalkable} from '../src/original-world-space'
const yard='train-at-graystone-yard',north='train-at-dead-station'
const oldAssets:OriginalAssetBindings={version:1,backgrounds:{[north]:ORIGINAL_BACKGROUND_PLATFORM}}

test('new room art is bound independently; old snapshots and map bytes stay unchanged',()=>{
 const base=originalStoryPreviewDefinition(),r=originalTrainRuntime(()=>true),h=r.initial('zh',randomUUID()),old=originalBoundSceneResources(base,oldAssets),next=originalBoundSceneResources(base,h.assets)
 assert.equal(originalSceneBackgroundVersion(h.assets,yard),GRAYSTONE_BACKGROUND);assert.equal(originalSceneBackgroundVersion(oldAssets,yard),undefined)
 assert.deepEqual(originalRendererMapIds(oldAssets),{});assert.deepEqual(originalRendererMapIds(h.assets),{[yard]:'graystone-yard-78f22e9b'});
 const incomplete=structuredClone(base);incomplete.scenes[yard].assets=incomplete.scenes[yard].assets.filter(a=>a.kind!=='map');assert.throws(()=>originalBoundSceneResources(incomplete,h.assets),/MAP_SLOT_MISSING/);
 assert.notEqual(originalEnvironmentVersion(oldAssets),originalEnvironmentVersion(h.assets));assert.deepEqual(old.scenes[yard],base.scenes[yard])
 assert.equal(next.scenes[yard].assets.find(a=>a.kind==='map')!.sha256,originalEnvironmentLayouts[GRAYSTONE_BACKGROUND].map.sha256)
 assert.notEqual(next.scenes[yard].assets.find(a=>a.kind==='background')!.sha256,old.scenes[yard].assets.find(a=>a.kind==='background')!.sha256)
 for(const scene of Object.keys(base.scenes))if(![north,yard].includes(scene))assert.deepEqual(next.scenes[scene],base.scenes[scene])
 for(const backgrounds of [{[north]:ORIGINAL_BACKGROUND_PLATFORM,[yard]:ORIGINAL_BACKGROUND_PLATFORM},{[north]:ORIGINAL_BACKGROUND_PLATFORM,'train-at-tunnel':GRAYSTONE_BACKGROUND}])assert.throws(()=>assertOriginalAssetBindings({version:1,backgrounds}),/UNSUPPORTED/)
 const emitted:any[]=[];originalScenePreviewPlugin(true).generateBundle.call({emitFile:(a:any)=>emitted.push(a)})
 for(const asset of next.scenes[yard].assets){const file=emitted.find(a=>a.fileName===asset.path.slice(2));assert.ok(file);assert.equal(createHash('sha256').update(file.source).digest('hex'),asset.sha256)}
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
