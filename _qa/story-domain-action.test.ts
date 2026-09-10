import { test } from 'node:test'
import assert from 'node:assert/strict'
import { cartridge, initialStory, runRule } from '../src/story'
import { resolveStoryActionById } from '../src/story-domain-action'
import type { StoryCartridge } from '../src/vendor/story/types'

test('map action IDs select the same original rule despite localized or overlapping phrases', () => {
  for (const locale of ['zh', 'en'] as const) {
    const save = initialStory(locale)
    const c = cartridge(locale)
    const open = c.domainRules!.rules.find(rule => rule.id === 'open-cabinet')!
    const text = locale === 'zh' ? '打开设备' : 'Open equipment'
    const configured: StoryCartridge = {
      ...c,
      domainRules: { ...c.domainRules!, rules: [
        { ...open, id: 'unrelated-rule', match: [text], effects: [{ type: 'fact', id: 'wrong-action', value: true }] },
        { ...open, match: [text], matchMode: undefined },
      ] },
    }
    const before = structuredClone({ save, configured })
    const result = resolveStoryActionById(save, configured, 'open-cabinet')
    assert.equal(result.ruleId, 'open-cabinet')
    assert.equal(result.status, 'accepted')
    assert.deepEqual(result.effects, open.effects)
    assert.deepEqual({ save, configured }, before)
    assert.throws(() => resolveStoryActionById(save, configured, text), /UNREGISTERED_ACTION/)
    assert.throws(() => resolveStoryActionById(save, configured, 'Open-Cabinet'), /UNREGISTERED_ACTION/)
  }
})

test('stable action admission retains unmet requirements and repeat rejection without partial effects', () => {
  let save = initialStory('zh')
  const denied = resolveStoryActionById(save, cartridge('zh'), 'take-fuse')
  assert.equal(denied.status, 'rejected')
  assert.deepEqual(denied.effects, [])
  save = runRule(save, 'open-cabinet').save
  save = runRule(save, 'take-fuse').save
  const repeated = resolveStoryActionById(save, cartridge('zh', save), 'take-fuse')
  assert.equal(repeated.status, 'rejected')
  assert.deepEqual(repeated.effects, [])
  assert.equal(save.inventory.find(item => item.id === 'fuse')?.count, 1)
})

test('duplicate stable IDs fail closed instead of choosing the first matching rule', () => {
  const c = cartridge('en')
  const rule = c.domainRules!.rules[0]
  c.domainRules!.rules.push({ ...rule })
  assert.throws(() => resolveStoryActionById(initialStory('en'), c, rule.id), /AMBIGUOUS_ACTION_ID/)
})

test('map action IDs obey story stat floors and only explicitly allowed recovery rules can proceed', () => {
  const c = cartridge('en')
  const save = initialStory('en')
  c.statDefinitions[0].floorRule = {
    threshold: save.stats[c.statDefinitions[0].id],
    enteredText: 'Stop and recover.', blockedText: 'Recover first.',
    recoveryChoices: ['Open cabinet', 'Rest', 'Ask for help'],
    allowedDomainRuleIds: ['open-cabinet'],
  }
  const blocked = resolveStoryActionById(save, c, 'meet-lin')
  assert.equal(blocked.status, 'rejected')
  assert.deepEqual(blocked.effects, [])
  assert.equal(blocked.reasons[0], 'Recover first.')
  assert.equal(resolveStoryActionById(save, c, 'open-cabinet').status, 'accepted')
})
