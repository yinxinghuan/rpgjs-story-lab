import assert from 'node:assert/strict'
import {cartridge} from '../src/story'
import {bindCarriageStory,carriageSpatialDefinition} from '../src/carriage-spatial-binding'
import {compileOriginalSpatialBinding,originalCartridge} from '../server/original-train-runtime'
import {newOriginalAssetBindings} from '../src/original-asset-releases'
import {originalBoundWorldPlan} from '../src/original-world-plan'
import {findGridPath} from '../src/grid-path'
const bindings=(['zh','en'] as const).map(locale=>bindCarriageStory(cartridge(locale)))
assert.deepEqual(bindings[0].actionIds().sort(),bindings[1].actionIds().sort(),'Bilingual action IDs differ')
const world=carriageSpatialDefinition()
console.log(JSON.stringify({cartridgeId:bindings[0].cartridgeId,mapVersion:bindings[0].mapVersion,scenes:world.scenes.length,entities:world.entities.length,actions:bindings[0].actionIds().length,portals:world.portals.length,physicalCharacters:world.characters.filter(c=>c.kind==='physical').length,mediatedCharacters:world.characters.filter(c=>c.kind==='mediated').length,result:'authoring-binding-pass',limits:['does not decode or visually inspect art','does not prove renderer loading','does not migrate old game saves']},null,2))

// Use the production authority's compiler and actual layout bindings. The
// earlier carriage slice must never stand in for full-game authoring checks.
for(const variant of ['legacy-default','current-enrollment'] as const){
 const assets=variant==='current-enrollment'?newOriginalAssetBindings():undefined
 const plan=originalBoundWorldPlan(assets)
 const [zh,en]=(['zh','en'] as const).map(locale=>compileOriginalSpatialBinding(originalCartridge(locale),assets))
 assert.deepEqual(zh.actionIds().sort(),en.actionIds().sort(),`Original bilingual action IDs differ: ${variant}`)
 assert.deepEqual(zh.characterIds().sort(),en.characterIds().sort(),`Original bilingual characters differ: ${variant}`)
 assert.deepEqual(zh.storyLocationIds().sort(),en.storyLocationIds().sort(),`Original bilingual locations differ: ${variant}`)
 for(const scene of plan.scenes)for(const action of zh.actionIds())assert.equal(zh.targetFor(action,scene.id),en.targetFor(action,scene.id),`Original action target differs: ${scene.id}/${action}`)
 for(const entity of plan.entities){
  const spawn=plan.scenes.find(scene=>scene.id===entity.scene)!.spawn
  const canWalk=(p:{x:number;y:number})=>zh.validPosition(entity.scene,p)
  const path=findGridPath(spawn,entity.approach,canWalk)
  assert.ok(path.length,`Original entity unreachable: ${variant}/${entity.id}`)
  // The path finder samples a grid; inspect intermediate pixels too, so a
  // thin obstacle cannot be skipped just because both grid endpoints fit.
  const points=[spawn,...path,entity.approach]
  for(let i=1;i<points.length;i++){
   const a=points[i-1],b=points[i],steps=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)))
   for(let n=0;n<=steps;n++)assert.ok(canWalk({x:a.x+(b.x-a.x)*n/steps,y:a.y+(b.y-a.y)*n/steps}),`Original route crosses obstacle: ${variant}/${entity.id}`)
  }
 }
 console.log(JSON.stringify({cartridgeId:zh.cartridgeId,variant,mapVersion:zh.mapVersion,scenes:plan.scenes.length,storyLocations:zh.storyLocationIds().length,entities:plan.entities.length,staticRoutesChecked:plan.entities.length,actions:zh.actionIds().length,portals:plan.portals.length,characters:zh.characterIds().length,result:'production-binding-pass',limits:['does not decode or visually inspect art','does not prove renderer loading or dynamic character obstruction','published creator layouts require their own admission','does not prove all story branches reachable']},null,2))
}
