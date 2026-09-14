import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {createHash} from 'node:crypto'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalBoundWorldPlan} from '../src/original-world-plan'
import {originalEquipmentAnimation,originalEquipmentBodies,originalEquipmentSlots} from '../src/original-equipment-art'
import {originalWorldWalkable,originalWorldWalkabilitySnapshot} from '../src/original-world-space'
import {findGridPath} from '../src/grid-path'
import {yardPumpResource} from '../src/original-yard-pump-art'
const runtime=originalTrainRuntime(()=>true),out=join(tmpdir(),'rpg-diesel-scenes');mkdirSync(out,{recursive:true})
const png=readFileSync('public/'+yardPumpResource.path.slice(2));assert.equal(png.length,yardPumpResource.bytes);assert.equal(createHash('sha256').update(png).digest('hex'),yardPumpResource.sha256)
let walks=0
for(const pact of ['medical','work','forced'] as const){
 let h=runtime.initial('zh',randomUUID());assert.equal(h.assets?.version,1);if(h.assets?.version!==1)throw Error('FIXTURE')
 const legacy=structuredClone(h);assert.ok(!originalEquipmentSlots('train-at-graystone-yard',legacy.assets).some(s=>s.entityId==='yard-pump'))
 assert.deepEqual(runtime.upgrade(legacy).assets,legacy.assets)
 h.assets.fixedEquipment={...h.assets.fixedEquipment,'yard-pump':'yard-pump-v1'}
 const steps=['repair-starter','commit-valley-route','river-survey','river-rescue-powered','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led','tunnel-ventilate','tunnel-depart','yard-meet']
 const path:string[]=[]
 async function step(id:string){
  const e=originalBoundWorldPlan(h.assets).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!;assert.ok(e,id)
  const route=findGridPath(h.position,e.approach,originalWorldWalkabilitySnapshot(h));assert.ok(route.length,id+' reachable');assert.ok(route.every(p=>originalWorldWalkable(h,p)));walks++
  h=(await runtime.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,type:'action',action:id},()=>{throw Error('UNEXPECTED_MODEL')})).head;path.push(id)
 }
 for(const id of steps)await step(id)
 const before=structuredClone(h),body=originalEquipmentBodies(h.sceneId,h.assets).find(b=>b.id==='yard-pump')!;assert.ok(body)
 const world=originalBoundWorldPlan(h.assets),scene=world.scenes.find(s=>s.id===h.sceneId)!
 for(const e of world.entities.filter(e=>e.scene===h.sceneId)){const previous={...h,assets:legacy.assets};if(findGridPath(scene.spawn,e.approach,originalWorldWalkabilitySnapshot(previous)).length)assert.ok(findGridPath(scene.spawn,e.approach,originalWorldWalkabilitySnapshot(h)).length,e.id+' preserved')}
 assert.equal(originalEquipmentAnimation(h.save,'yard-pump',0,h.assets),'stopped')
 writeFileSync(join(out,'yard-pump-'+pact+'.json'),JSON.stringify({head:before,path}))
 await step(pact==='forced'?'yard-force-pump':`yard-${pact}-pact`)
 assert.equal(originalEquipmentAnimation(h.save,'yard-pump',0,h.assets),pact==='work'?'repaired':pact==='forced'?'forced':'stopped')
 assert.equal(h.save.stats.fuel,before.save.stats.fuel+({medical:16,work:12,forced:20}[pact]))
 h=runtime.upgrade(JSON.parse(JSON.stringify(h)));assert.deepEqual(originalEquipmentBodies(h.sceneId,h.assets).find(b=>b.id==='yard-pump'),body)
 assert.equal(originalEquipmentAnimation(h.save,'yard-pump',0,h.assets),pact==='work'?'repaired':pact==='forced'?'forced':'stopped')
}
console.log(JSON.stringify({journeys:3,walks,states:['stopped','repaired','forced'],legacyUnchanged:true,scope:'Actual authored routes and restored snapshots; renderer review still required'}))
