import {test} from 'node:test'
import assert from 'node:assert/strict'
import {ProgressiveSceneReadiness} from '../src/progressive-scene-readiness'
import type {SceneResourceManifest} from '../src/scene-readiness'
const manifest:SceneResourceManifest={version:'test',scenes:{room:{version:'one',assets:[{kind:'map',path:'./room.tmx',sha256:'map',bytes:1},{kind:'background',path:'./room.png',sha256:'art',bytes:1}]}}}
test('a verified map becomes playable while its background is still pending',async()=>{
 let finish!:(v:string)=>void
 const r=new ProgressiveSceneReadiness(manifest,async a=>a.kind==='background'?new Promise<string>(resolve=>{finish=resolve}):undefined)
 assert.throws(()=>r.activate('room'),/NOT_VALIDATED/)
 await r.prepare('room');r.activate('room')
 assert.equal(r.background('room'),undefined);assert.equal(r.backgroundState('room'),'loading')
 finish('blob:scenery');await r.prepareBackground('room')
 assert.equal(r.background('room'),'blob:scenery');assert.equal(r.backgroundState('room'),'ready');r.dispose()
})
test('a map failure prevents admission and never begins scenery download',async()=>{
 const loads:string[]=[]
 const r=new ProgressiveSceneReadiness(manifest,async a=>{loads.push(a.kind);throw Error('mismatched map')})
 await assert.rejects(r.prepare('room'));assert.throws(()=>r.activate('room'));assert.deepEqual(loads,['map']);r.dispose()
})
test('failed background keeps the map usable; explicit retry coalesces and reuses map',async()=>{
 let fail=true,maps=0,art=0
 const r=new ProgressiveSceneReadiness(manifest,async a=>{if(a.kind==='map'){maps++;return}art++;if(fail)throw Error('HTTP');return 'blob:recovered'})
 await r.prepare('room');await assert.rejects(r.prepareBackground('room'))
 assert.equal(r.backgroundState('room'),'failed');r.activate('room')
 await r.prepare('room',true);assert.equal(art,1)
 fail=false;await Promise.all([r.prepareBackground('room',true),r.prepareBackground('room',true)])
 assert.equal(maps,1);assert.equal(art,2);assert.equal(r.background('room'),'blob:recovered');r.dispose()
})
test('slow background times out without blocking map activation or becoming ready late',async()=>{
 let finish!:(v:string)=>void
 const r=new ProgressiveSceneReadiness(manifest,async a=>a.kind==='map'?undefined:new Promise<string>(resolve=>{finish=resolve}),()=>{},15)
 await r.prepare('room');await assert.rejects(r.prepareBackground('room'));r.activate('room')
 finish('blob:late');await new Promise(resolve=>setTimeout(resolve,0))
 assert.equal(r.background('room'),undefined);assert.equal(r.backgroundState('room'),'failed');r.dispose()
})
test('unknown or map-less rooms never become playable',async()=>{
 const r=new ProgressiveSceneReadiness(manifest,async()=>undefined)
 await assert.rejects(r.prepare('unmade'),/UNREGISTERED_SCENE/)
 const malformed=structuredClone(manifest);malformed.scenes.room.assets=malformed.scenes.room.assets.filter(a=>a.kind==='background')
 await assert.rejects(new ProgressiveSceneReadiness(malformed,async()=>undefined).prepare('room'),/INVALID_SCENE_RESOURCES/);r.dispose()
})
test('late resources from disposed loaders cannot publish or notify a new journey',async()=>{
 let finish!:(v:string)=>void,changes=0
 const r=new ProgressiveSceneReadiness(manifest,async a=>a.kind==='map'?undefined:new Promise<string>(resolve=>{finish=resolve}),()=>{changes++})
 await r.prepare('room');const pending=r.prepareBackground('room');r.dispose();const before=changes;finish('blob:old')
 await assert.rejects(pending);assert.equal(changes,before);assert.equal(r.background('room'),undefined)
})
