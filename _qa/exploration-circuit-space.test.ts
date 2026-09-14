import test from 'node:test'
import assert from 'node:assert/strict'
import {bindExplorationCircuit,explorationCircuitSpace,explorationCircuitWalkable,explorationCircuitAdmission} from '../src/exploration-circuit-space'
import {findGridPath} from '../src/grid-path'
import {explorationCircuitRules} from '../src/exploration-circuit-rules'

test('each circuit action binds to one reachable device and rejects distant or other-room input',()=>{
 const binding=bindExplorationCircuit('zh')
 assert.equal(binding.actionIds().length,explorationCircuitRules('zh').length)
 for(const entity of explorationCircuitSpace.entities){
  const scene=explorationCircuitSpace.scenes.find(s=>s.id===entity.scene)!
  assert.ok(findGridPath(scene.spawn,entity.approach,p=>explorationCircuitWalkable(scene.id,p)).length)
  for(const action of entity.actions){
   assert.ok(binding.admits(action,entity.id,entity.scene,entity.approach))
   assert.equal(binding.admits(action,entity.id,entity.scene,{x:70,y:70}),false)
   assert.equal(binding.admits(action,entity.id,entity.scene==='explore-power'?'explore-signal-inside':'explore-power',entity.approach),false)
  }
 }
 assert.equal(explorationCircuitAdmission.ready,false)
})
