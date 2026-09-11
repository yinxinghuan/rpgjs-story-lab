import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomUUID} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalEquipmentSlots,originalEquipmentBodies,originalStarterState,originalStarterSheet,starterResource,starterArt} from '../src/original-equipment-art'
import {originalWorldWalkable} from '../src/original-world-space'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalGameEntities} from '../src/original-game-projection'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {findGridPath} from '../src/grid-path'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('starter art follows the authoritative repair, persists after its action disappears and never grants a fuse',async()=>{
 const runtime=originalTrainRuntime(()=>true),h=runtime.initial('zh',randomUUID())
 assert.equal(originalStarterState(h.save),'broken')
 const result=await runtime.prepare(h,{action_id:randomUUID(),expected_version:0,sceneId:h.sceneId,position:{x:110,y:185},target:'starter',type:'action',action:'repair-starter'},()=>true)
 assert.equal(result.accepted,true);assert.equal(originalStarterState(result.head.save),'repaired')
 assert.equal(result.head.save.stats.condition,h.save.stats.condition+5)
 assert.deepEqual(result.head.save.inventory,h.save.inventory)
 assert.ok(result.head.save.partyMemberIds.includes('ada-mechanic'))
 assert.ok(!originalGameEntities(result.head).some(e=>e.id==='starter'))
 assert.deepEqual(originalEquipmentSlots(result.head.sceneId),originalEquipmentSlots(h.sceneId))
 assert.equal(originalStarterState(runtime.upgrade(result.head).save),'repaired')
 assert.deepEqual(Object.keys(originalStarterSheet('checked.png').textures),['broken','repaired'])
 assert.deepEqual(originalEquipmentSlots('train-at-river-valley'),[])
})
test('device footprint is stable, server-enforced and recoverable for old positions without altering story',()=>{
 const runtime=originalTrainRuntime(()=>true),h=runtime.initial('en',randomUUID()),body=originalEquipmentBodies(h.sceneId)[0],save=JSON.stringify(h.save)
 h.position={x:body.x+4,y:body.y+4}
 assert.equal(originalWorldWalkable(h,h.position),false)
 assert.throws(()=>runtime.position(h,h.position),/INVALID_POSITION/)
 const restored=runtime.upgrade(h)
 assert.ok(originalWorldWalkable(restored,restored.position));assert.notDeepEqual(restored.position,h.position)
 assert.equal(JSON.stringify(restored.save),save);assert.equal(restored.version,h.version)
 for(const entity of originalTrainChapterSpatialPlan().entities.filter(e=>e.scene===h.sceneId)){
  const path=findGridPath(restored.position,entity.approach,p=>originalWorldWalkable(restored,p))
  assert.ok(path.length,entity.id);assert.ok(path.every(p=>originalWorldWalkable(restored,p)),entity.id)
 }
 const repaired=structuredClone(h);repaired.save.facts['starter-repaired']=true
 assert.deepEqual(originalEquipmentBodies(repaired.sceneId),[body])
 assert.equal(originalWorldWalkable(repaired,h.position),false)
})
test('admitted frames preserve copper-coil sources, exclude the rejected fuse state and share contact alignment',()=>{
 const paths=['doc/platform-art-candidates/20260911/starter-edit-02/candidate.png','doc/platform-art-candidates/20260911/starter-repair-03/candidate.png']
 const hashes=['8eb32bb26a859cf20c1647bddb0896c3f8821b53f5aff1e6a71641b1adcde8da','2a55ef71cf18431a9eff62336a265f11d4c4af2e93fc12c77ff0749b4bcd71b2']
 const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
 const inputs=paths.map((p,i)=>{const b=readFileSync(p);assert.equal(hash(b),hashes[i]);return PNG.sync.read(b)})
 const rgba=new Uint8ClampedArray(640*640*4)
 for(let y=0;y<640;y++){rgba.set(inputs[0].data.subarray((y*960+320)*4,(y*960+640)*4),y*640*4);rgba.set(inputs[1].data.subarray(y*320*4,(y+1)*320*4),(y*640+320)*4)}
 const processed=prepareSpritePixels({width:640,height:640,rgba},{columns:2,rows:1,cellWidth:320,cellHeight:640,foot:starterArt.foot,kind:'states',backgroundMode:'pale-neutral',neutralMin:200,chromaMax:20,sourceAnchors:[{x:173,y:463},{x:173,y:468}]})
 const bytes=readFileSync('public/'+starterResource.path.slice(2)),actual=PNG.sync.read(bytes)
 assert.equal(hash(bytes),starterResource.sha256);assert.equal(bytes.length,starterResource.bytes)
 assert.deepEqual(new Uint8ClampedArray(actual.data),processed.raster.rgba)
 assert.equal(actual.data[3],0)
 for(const f of processed.frames){assert.equal(f.sourceAnchor.y+f.offset.y,starterArt.foot.y);assert.equal(f.sourceAnchor.x+f.offset.x,starterArt.foot.x)}
})
