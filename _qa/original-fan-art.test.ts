import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomUUID} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {fanArt,originalFanState,originalFanSheets,fanRotationPose,fanRotorScale} from '../src/original-fan-art'
import {originalFixedEquipment,assertOriginalAssetBindings} from '../src/original-asset-releases'
import {originalEquipmentAnimation,originalEquipmentBodies,originalEquipmentSlots} from '../src/original-equipment-art'
import {originalWorldWalkable} from '../src/original-world-space'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalVisualContext} from '../server/original-visual-context'
import {findGridPath} from '../src/grid-path'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('fan parts preserve immutable images, real alpha, a transparent hub and one stable housing',()=>{
 const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex'),source=readFileSync('doc/platform-art-candidates/20260912/tunnel-fan-parts-01/candidate.png')
 assert.equal(hash(source),'8fdd576bd4bc1982436e99a93c04ef1e545ec890d046a75cb5a99e05304dc16a')
 for(const part of [fanArt.housing,fanArt.rotor]){const b=readFileSync('public/'+part.path.slice(2)),p=PNG.sync.read(b);assert.equal(hash(b),part.sha256);assert.equal(b.length,part.bytes);assert.equal(p.width,320);assert.equal(p.height,640);assert.equal(p.data[3],0)}
 const rotor=PNG.sync.read(readFileSync('public/art/fan-rotor-v1.png'));assert.equal(rotor.data[(320*320+160)*4+3],0)
 let radius=0;for(let y=0;y<640;y++)for(let x=0;x<320;x++)if(rotor.data[(y*320+x)*4+3]>200)radius=Math.max(radius,Math.hypot(x-160,y-320))
 const body=PNG.sync.read(readFileSync('public/art/fan-housing-v1.png'));let opening=100
 for(let d=0;d<360;d++){let r=0;for(;r<100;r++){const x=Math.round(160+Math.cos(d*Math.PI/180)*r),y=Math.round(411+Math.sin(d*Math.PI/180)*r),i=(y*320+x)*4;if(Math.max(body.data[i],body.data[i+1],body.data[i+2])>25)break}opening=Math.min(opening,r-1)}
 assert.ok(radius*fanRotorScale<opening*.11,'Every blade stays within the actual dark aperture through a full rotation')
 const [housing,wheel]=originalFanSheets('housing.png','rotor.png');assert.deepEqual(Object.keys(housing.textures),['stand']);assert.equal(wheel.image,'rotor.png')
 assert.equal(fanRotationPose(0),'spin-0');assert.equal(fanRotationPose(300),'spin-9');assert.equal(fanRotationPose(600),'spin-18');assert.equal(fanRotationPose(1200),'spin-0')
})
for(const policy of ['retained','abandoned'])test(`fan art/collision follows ${policy} without upgrading legacy devices or recharging fuel`,async()=>{
 const runtime=originalTrainRuntime(()=>true),world=originalTrainChapterSpatialPlan();let h=runtime.initial('zh',randomUUID())
 for(const action of ['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart']){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;h=(await runtime.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action},()=>true)).head}
 assert.equal(originalFixedEquipment(h.assets)['tunnel-fan'],'tunnel-fan-parts-v1');assert.equal(originalFanState(h.save),'stopped')
 const occupied={x:105,y:150},before=structuredClone(h);assert.equal(originalWorldWalkable(h,occupied),false);assert.throws(()=>runtime.position(h,occupied),/INVALID_POSITION/)
 const old=structuredClone(h);delete (old.assets as any).fixedEquipment;assertOriginalAssetBindings(old.assets);assert.equal(originalWorldWalkable(old,occupied),true);assert.deepEqual(runtime.upgrade(old),old);assert.deepEqual(originalEquipmentSlots(old.sceneId,old.assets),[])
 for(const e of world.entities.filter(e=>e.scene===h.sceneId))assert.ok(findGridPath(h.position,e.approach,p=>originalWorldWalkable(h,p)).length,e.id)
 for(const action of ['tunnel-inspect','tunnel-doctor-led',policy==='retained'?'tunnel-ventilate':'tunnel-discard']){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;h=(await runtime.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action},()=>true)).head}
 assert.equal(originalFanState(h.save),policy==='retained'?'running':'stopped');assert.equal(originalEquipmentAnimation(h.save,'housing',300),'stand');assert.equal(originalEquipmentAnimation(h.save,'rotor',300),policy==='retained'?'spin-9':'stopped')
 assert.equal(h.save.stats.fuel,before.save.stats.fuel-(policy==='retained'?8:0));assert.deepEqual(originalEquipmentBodies(h.sceneId,h.assets),originalEquipmentBodies(before.sceneId,before.assets));assert.deepEqual(h.assets,before.assets)
 assert.equal(originalVisualContext(h,'ada-mechanic').equipment[0].state,originalFanState(h.save));assert.deepEqual(runtime.upgrade(h),h)
 for(const fixedEquipment of [null,[],{'starter':'tunnel-fan-parts-v1'},{'tunnel-fan':'bad'}])assert.throws(()=>assertOriginalAssetBindings({...h.assets,fixedEquipment}),/UNSUPPORTED/)
})
