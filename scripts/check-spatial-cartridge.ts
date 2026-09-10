import assert from 'node:assert/strict'
import {cartridge} from '../src/story'
import {bindCarriageStory,carriageSpatialDefinition} from '../src/carriage-spatial-binding'
const bindings=(['zh','en'] as const).map(locale=>bindCarriageStory(cartridge(locale)))
assert.deepEqual(bindings[0].actionIds().sort(),bindings[1].actionIds().sort(),'Bilingual action IDs differ')
const world=carriageSpatialDefinition()
console.log(JSON.stringify({cartridgeId:bindings[0].cartridgeId,mapVersion:bindings[0].mapVersion,scenes:world.scenes.length,entities:world.entities.length,actions:bindings[0].actionIds().length,portals:world.portals.length,physicalCharacters:world.characters.filter(c=>c.kind==='physical').length,mediatedCharacters:world.characters.filter(c=>c.kind==='mediated').length,result:'authoring-binding-pass',limits:['does not decode or visually inspect art','does not prove renderer loading','does not migrate old game saves']},null,2))
