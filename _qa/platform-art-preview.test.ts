import test from 'node:test'
import assert from 'node:assert/strict'
import {originalScenePreviewDefinition,originalScenePreviewPlugin} from '../server/original-scene-preview'
test('platform background comparison keeps the same authoritative rooms and collision maps',()=>{
 const {initialScene,resources,platformResources}=originalScenePreviewDefinition()
 assert.deepEqual(Object.keys(resources.scenes),Object.keys(platformResources.scenes))
 for(const id of Object.keys(resources.scenes)){
  const source=resources.scenes[id].assets,candidate=platformResources.scenes[id].assets
  assert.deepEqual(source.filter(a=>a.kind==='map'),candidate.filter(a=>a.kind==='map'))
  if(id===initialScene){assert.notEqual(source.find(a=>a.kind==='background')!.sha256,candidate.find(a=>a.kind==='background')!.sha256)}
  else assert.deepEqual(source,candidate)
 }
 const emitted:any[]=[];originalScenePreviewPlugin().generateBundle.call({emitFile:(file:any)=>emitted.push(file)})
 assert.equal(emitted.length,6)
 assert.ok(emitted.some(f=>f.fileName==='art/approved/north-cape-8fc11a96.png'))
 for(const scene of Object.values(platformResources.scenes))for(const asset of scene.assets){const file=emitted.find(f=>f.fileName===asset.path.slice(2));assert.ok(file);assert.equal(file.source.length,asset.bytes)}
 assert.ok(!emitted.some(f=>/actor|props/.test(f.fileName)))
})
