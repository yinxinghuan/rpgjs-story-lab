/** Execute original source rules with synthetic saves through the same adapter
 * used by the live carriage. Not an art/renderer or production migration test. */
import {resolve,join} from 'node:path'
import {pathToFileURL} from 'node:url'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {compileSpatialBinding} from '../src/spatial-binding'
import {executeBoundStoryTurn} from '../src/bound-story-turn'
import {originalTrainSpatialPlan,originalTrainPlanWalkable,originalTrainRoom} from '../src/original-train-spatial-plan'
const root=process.argv[2];if(!root)throw Error('Pass original source directory; no saved journey is accepted')
const source=resolve(root),load=(file:string)=>import(pathToFileURL(join(source,file)).href)
const original=await load('src/story/cartridges/lastTrainToDawn.ts'),reducer=await load('src/story/engine/reducer.ts'),engine=await load('src/story/engine/executeTurn.ts'),domain=await load('src/story/engine/domainRules.ts')
const world=originalTrainSpatialPlan(),results=[]
for(const locale of ['zh','en'] as const)for(const route of ['valley','quarry','forest']){
 const c=locale==='zh'?original.lastTrainToDawn:original.lastTrainToDawnEn,binding=compileSpatialBinding(c,world,originalTrainPlanWalkable)
 let save=reducer.createInitialSave(c),sceneId=originalTrainRoom('dead-station'),position={x:192,y:430}
 const finale=structuredClone(save.finale),opening=structuredClone(save.blocks),actions=[]
 for(const id of ['replace-brake-hose','inspect-brakes','replace-brake-hose','repair-starter','repair-starter','salvage-fuel-shed','commit-'+route+'-route','use-master-switch-key']){
  const rule=c.domainRules.rules.find((r:any)=>r.id===id),target=binding.targetFor(id,sceneId)!,entity=world.entities.find(e=>e.id===target)!
  const input=rule.match[0],snapshot=JSON.stringify(save),resolution=domain.resolveDomainAction(save,c,input)
  assert.equal(resolution.ruleId,id)
  const bound=await executeBoundStoryTurn({save,binding,sceneId,target,position:entity.approach,
   execute:async(detached,admit)=>{
    admit(id)
    const result=await engine.executeStoryTurn({save:detached,cartridge:c,action:input,generator:{send:async()=>{throw Error('AUTHORED_SOURCE_ONLY')}}})
    assert.equal(result.source,'domain')
    return {save:result.save,acceptedActionId:resolution.status==='accepted'?id:null}
   },
   assertPresentation:(_before,after)=>{assert.equal(after.cartridgeId,c.id);assert.equal(after.version,8);assert.deepEqual(after.finale,finale)},
  })
  assert.equal(JSON.stringify(save),snapshot);save=bound.result.save;sceneId=bound.sceneId;position=bound.position
  actions.push({id,accepted:resolution.status==='accepted'})
 }
 assert.equal(save.facts['starter-repaired'],true);assert.equal(save.facts['brake-hose-replaced'],true)
 assert.equal(save.inventory.find((i:any)=>i.id==='spare-hose')?.count??0,0)
 assert.equal(save.inventory.find((i:any)=>i.id==='sealed-diesel')?.count,2)
 assert.equal(save.facts['route-family'],route);assert.deepEqual(save.finale,finale)
 for(const block of opening)assert.deepEqual(save.blocks.find((b:any)=>b.id===block.id),block)
 assert.deepEqual(save.characters.map((p:any)=>p.id),['ada-mechanic'])
 assert.ok(binding.characterEntities('ada-mechanic',sceneId).length===1)
 assert.ok(binding.targetFor('use-master-switch-key',sceneId))
 const restored=JSON.parse(JSON.stringify({save,sceneId,position}));assert.equal(binding.locate(restored.save,restored.sceneId),sceneId)
 results.push({locale,route,actions,sourceVersion:save.version,sceneId,position,stats:save.stats,sourceFinalePreserved:true,openingPreserved:true,hiddenCharactersRemainHidden:true,resumeMapping:true})
}
const files=['src/story/cartridges/lastTrainToDawn.ts','src/story/engine/executeTurn.ts','src/story/engine/reducer.ts','src/story/types.ts']
console.log(JSON.stringify({result:'pass',kind:'original-engine-spatial-turns',sourceFiles:Object.fromEntries(files.map(f=>[f,createHash('sha256').update(readFileSync(join(source,f))).digest('hex')])),results,limits:['authoring geometry; no original room art admitted','not an RPG-JS renderer pass','no production save import','no model requests','later chapters and finale execution still require integration']},null,2))
