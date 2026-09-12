import {test} from 'node:test'
import assert from 'node:assert/strict'
import {originalCartridge,compileOriginalSpatialBinding} from '../server/original-train-runtime'
import {newOriginalAssetBindings} from '../src/original-asset-releases'

test('the production binding used by build and authority rejects a missing original action',()=>{
 const cartridge=structuredClone(originalCartridge('en'))
 cartridge.domainRules!.rules=cartridge.domainRules!.rules.filter(rule=>rule.id!=='repair-starter')
 assert.throws(()=>compileOriginalSpatialBinding(cartridge,newOriginalAssetBindings()),/MISSING_STORY_RULE: repair-starter/)
})

test('the production binding rejects a story destination that disagrees with its map portal',()=>{
 const cartridge=structuredClone(originalCartridge('zh'))
 const rule=cartridge.domainRules!.rules.find(rule=>rule.id==='commit-valley-route')!
 const effect=rule.effects.find(effect=>effect.type==='map')!
 assert.equal(effect.type,'map')
 if(effect.type==='map')effect.nodeId='pine-line'
 assert.throws(()=>compileOriginalSpatialBinding(cartridge,newOriginalAssetBindings()),/PORTAL_RULE_MISMATCH: commit-valley-route/)
})
