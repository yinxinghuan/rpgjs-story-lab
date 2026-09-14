import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge, oldStreetConnections, oldStreetTravelId, oldStreetActionId, oldStreetOutcome, type OldStreetRoom} from '../src/old-street-cartridge'
import {createInitialSave, enterStory} from '../src/vendor/original-train/engine/reducer'
import {resolveDomainAction, applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
import {lastTrainToDawn} from '../src/vendor/original-train/cartridges/lastTrainToDawn'

for (const locale of ['zh', 'en'] as const) {
  function setup() {
    const cartridge = oldStreetCartridge(locale)
    let save = createInitialSave(cartridge)
    const run = (id: string) => {
      const resolution = resolveDomainAction(save, cartridge, id)
      assert.ok(resolution, id)
      if (resolution.status === 'accepted') applyDomainResolution(save, cartridge, resolution)
      return resolution.status
    }
    return {cartridge, get save() {return save}, run,
      action(name: string) {return run(oldStreetActionId(name))},
      go(to: OldStreetRoom) {
        const from = save.map.find(node => node.current)!.id as OldStreetRoom
        const edge = oldStreetConnections.find(e => e.a === from && e.b === to || e.b === from && e.a === to)
        assert.ok(edge, `${from} -> ${to} must be a physical connection`)
        return run(oldStreetTravelId(edge.id, from))
      }, reload() {save = JSON.parse(JSON.stringify(save))},
    }
  }
  for (const route of ['roof', 'cellar'] as const) test(`complete basic letter route via ${route}, with no required optional help (${locale})`, () => {
    const s = setup()
    assert.deepEqual(s.save.stats, {})
    assert.deepEqual(s.save.inventory, [])
    assert.equal(enterStory(s.save, s.cartridge).blocks.some(b => b.kind === 'image'), false)
    if (route === 'roof') {
      for (const room of ['photo', 'roof', 'shed'] as const) assert.equal(s.go(room), 'accepted')
    } else {
      assert.equal(s.go('yard'), 'accepted'); assert.equal(s.go('cellar'), 'rejected')
      assert.equal(s.go('laundry'), 'accepted'); assert.equal(s.action('borrow-trolley'), 'accepted')
      assert.equal(s.go('yard'), 'accepted'); assert.equal(s.action('clear-crates'), 'accepted')
      s.reload()
      for (const room of ['cellar', 'shed'] as const) assert.equal(s.go(room), 'accepted')
    }
    assert.equal(s.save.facts['drawer-open'], false, 'reading the opening drawer is not a hidden travel permit')
    assert.equal(s.action('borrow-key'), 'accepted')
    assert.equal(s.action('lift-latch'), 'accepted')
    for (const room of ['yard', 'shop'] as const) assert.equal(s.go(room), 'accepted')
    assert.equal(s.action('unlock-letter'), 'accepted'); assert.equal(s.action('take-letter'), 'accepted')
    assert.equal(s.action('take-letter'), 'rejected'); s.reload()
    assert.equal(s.go('street'), 'accepted'); assert.equal(s.action('leave'), 'accepted')
    assert.deepEqual(oldStreetOutcome(s.save), {letterDelivered: true, clockReturned: false, photosReturned: false, clockRecorded: false, photoRecorded: false})
    const ended = structuredClone(s.save)
    assert.equal(s.action('leave'), 'rejected'); assert.equal(s.go('shop'), 'rejected')
    assert.deepEqual(s.save, ended)
  })
  test(`optional objects can be returned and records withdrawn before leaving (${locale})`, () => {
    const s = setup()
    for (const room of ['shop'] as const) assert.equal(s.go(room), 'accepted')
    for (const action of ['move-box', 'take-lens'] as const) assert.equal(s.action(action), 'accepted')
    for (const room of ['street', 'photo', 'roof', 'shed'] as const) assert.equal(s.go(room), 'accepted')
    for (const action of ['borrow-key', 'take-clock', 'lift-latch'] as const) assert.equal(s.action(action), 'accepted')
    for (const room of ['yard', 'laundry'] as const) assert.equal(s.go(room), 'accepted')
    assert.equal(s.action('return-clock'), 'accepted', 'ownership can be confirmed directly, without a clue checklist')
    assert.equal(s.action('consent-clock'), 'accepted')
    assert.equal(s.action('borrow-trolley'), 'accepted')
    assert.equal(s.go('yard'), 'accepted'); assert.equal(s.action('clear-crates'), 'accepted')
    assert.equal(s.go('cellar'), 'accepted'); assert.equal(s.action('take-photos'), 'accepted'); s.reload()
    for (const room of ['yard', 'street', 'photo'] as const) assert.equal(s.go(room), 'accepted')
    assert.equal(s.action('return-photos'), 'rejected')
    for (const action of ['match-photos', 'return-photos', 'consent-photo'] as const) assert.equal(s.action(action), 'accepted')
    for (const room of ['street', 'shop'] as const) assert.equal(s.go(room), 'accepted')
    for (const action of ['record-clock', 'record-photo', 'withdraw-photo', 'unlock-letter', 'take-letter'] as const) assert.equal(s.action(action), 'accepted')
    s.reload(); assert.equal(s.go('street'), 'accepted'); assert.equal(s.action('leave'), 'accepted')
    assert.deepEqual(oldStreetOutcome(s.save), {letterDelivered: true, clockReturned: true, photosReturned: true, clockRecorded: true, photoRecorded: false})
    assert.equal(s.save.inventory.some(item => ['clock', 'photos', 'letter'].includes(item.id)), false)
  })
  test(`wrong-place actions and repeated borrowing cannot consume or duplicate critical items (${locale})`, () => {
    const s = setup(), initial = structuredClone(s.save)
    assert.equal(s.action('borrow-key'), 'rejected'); assert.equal(s.action('leave'), 'rejected')
    assert.deepEqual(s.save, initial)
    for (const room of ['photo', 'roof', 'shed'] as const) assert.equal(s.go(room), 'accepted')
    for (let i = 0; i < 3; i++) {
      assert.equal(s.action('borrow-key'), 'accepted'); assert.equal(s.action('borrow-key'), 'rejected')
      assert.equal(s.save.inventory.find(item => item.id === 'letter-key')!.count, 1)
      s.reload(); assert.equal(s.action('return-key'), 'accepted')
      assert.equal(s.action('return-key'), 'rejected')
    }
    assert.equal(s.action('borrow-key'), 'accepted', 'returning the key early must not lock the story')
    assert.equal(s.action('lift-latch'), 'accepted')
    for (const room of ['yard', 'shop'] as const) assert.equal(s.go(room), 'accepted')
    assert.equal(s.action('record-clock'), 'rejected', 'recording needs owner consent')
    assert.equal(s.action('unlock-letter'), 'accepted')
    assert.equal(s.action('take-letter'), 'accepted')
  })
}

test('the existing train opening still queues its original generated image', () => {
  const save = createInitialSave(lastTrainToDawn)
  assert.equal(save.blocks.find(b => b.kind === 'image')?.data?.status, 'idle')
  assert.equal(enterStory(save, lastTrainToDawn).blocks.find(b => b.kind === 'image')?.data?.status, 'queued')
})
