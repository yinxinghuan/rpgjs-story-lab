import test from 'node:test'
import assert from 'node:assert/strict'
import type {StoryCartridge} from '../src/vendor/original-train/types'
import {lastTrainToDawn, lastTrainToDawnEn} from '../src/vendor/original-train/cartridges/lastTrainToDawn'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {applyDomainResolution, resolveDomainAction} from '../src/vendor/original-train/engine/domainRules'

for (const original of [lastTrainToDawn, lastTrainToDawnEn]) {
  test(`exploration rules operate without fabricated survival metrics (${original.locale})`, () => {
    // Synthetic content uses the same Core, with no new reducer or storage.
    const cartridge: StoryCartridge = {...original, statDefinitions: [], domainRules: {rules: [{
      id: 'open-box', intent: 'open-box', match: ['open-box'], requirements: [],
      effects: [{type: 'fact', id: 'box-open', value: true},
        {type: 'inventory', action: 'add', itemId: 'lens', count: 1, item: {id: 'lens', label: 'Lens', count: 1}},
        {type: 'stat', id: 'fuel', delta: 10}],
      successText: 'The box opens.', successChoices: ['', '', ''],
    }]}}
    const save = createInitialSave(cartridge)
    assert.deepEqual(save.stats, {})
    applyDomainResolution(save, cartridge, resolveDomainAction(save, cartridge, 'open-box'))
    assert.equal(save.facts['box-open'], true)
    assert.equal(save.inventory.find(item => item.id === 'lens')?.count, 1)
    assert.deepEqual(save.stats, {})
    assert.deepEqual(JSON.parse(JSON.stringify(save)).stats, {})
  })
  test(`existing train resources retain their authored values (${original.locale})`, () => {
    const save = createInitialSave(original)
    assert.deepEqual(save.stats, {fuel: 68, condition: 82, morale: 58})
    assert.equal(original.statDefinitions.length, 3)
  })
}
