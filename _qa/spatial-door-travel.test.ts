import test from 'node:test'
import assert from 'node:assert/strict'
import {compileSpatialBinding, type SpatialBindingDefinition} from '../src/spatial-binding'
import {prepareDoorTravel, type DoorTravelInput} from '../src/spatial-door-travel'
import {lastTrainToDawn} from '../src/vendor/original-train/cartridges/lastTrainToDawn'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import type {DomainActionRule, DomainEffect, StoryCartridge} from '../src/vendor/original-train/types'

// Synthetic geometry exercises the real Core contract, not a second game or
// an assertion that the new story's art/Session/renderer has been admitted.
function setup() {
  const makeRule = (id: string, effects: DomainEffect[] = []): DomainActionRule => ({
    id, intent: id, match: [id], requirements: [{type: 'fact', id: 'door-open', equals: true, reason: 'Closed'}],
    effects, successText: 'Arrival text that ordinary travel must not append', successChoices: ['', '', ''],
  })
  const cartridge: StoryCartridge = {...lastTrainToDawn, id: 'door-contract-fixture', characters: [], initialPartyMemberIds: [],
    initialMap: [{id: 'shop', label: 'Shop', current: true}, {id: 'street', label: 'Street'}],
    initialFacts: {'door-open': true}, domainRules: {rules: [
      makeRule('up'), makeRule('down'), makeRule('outside', [{type: 'map', nodeId: 'street'}]),
      makeRule('inside', [{type: 'map', nodeId: 'shop'}]), makeRule('inspect'),
    ]},
  }
  const plan: SpatialBindingDefinition = {
    version: 1, cartridgeId: cartridge.id, mapVersion: 'door-fixture-1', interactionDistance: 24,
    scenes: [
      {id: 'ground', storyLocationId: 'shop', spawn: {x: 30, y: 30}},
      {id: 'upper', storyLocationId: 'shop', spawn: {x: 30, y: 30}},
      {id: 'street', spawn: {x: 30, y: 30}},
    ],
    entities: [
      {id: 'stairs-up', scene: 'ground', actions: ['up']},
      {id: 'stairs-down', scene: 'upper', actions: ['down']},
      {id: 'front-door', scene: 'ground', actions: ['outside']},
      {id: 'shop-door', scene: 'street', actions: ['inside']},
      {id: 'box', scene: 'ground', actions: ['inspect']},
    ].map(e => ({...e, states: ['open'], position: {x: 50, y: 50}, approach: {x: 45, y: 45}})),
    portals: [
      {actionId: 'up', scene: 'upper', position: {x: 45, y: 45}},
      {actionId: 'down', scene: 'ground', position: {x: 45, y: 45}},
      {actionId: 'outside', scene: 'street', position: {x: 45, y: 45}},
      {actionId: 'inside', scene: 'ground', position: {x: 45, y: 45}},
    ], characters: [],
  }
  let blockedRoom = ''
  const binding = compileSpatialBinding(cartridge, plan, (room, p) => room !== blockedRoom && p.x >= 0 && p.y >= 0 && p.x < 100 && p.y < 100)
  const save = createInitialSave(cartridge)
  save.choices = [{id: 'open-question', label: 'An unfinished investigation'}]
  const input: DoorTravelInput = {actionId: 'up', target: 'stairs-up', scene: 'ground', position: {x: 45, y: 45}}
  return {cartridge, binding, save, input, block(room: string) {blockedRoom = room}}
}

test('twenty same-location room crossings preserve the entire story save and recover exact room separately', () => {
  const s = setup(), before = structuredClone(s.save)
  let state = {save: s.save, scene: 'ground', position: s.input.position}
  for (let i = 0; i < 20; i++) {
    const previous = structuredClone(state.save)
    const upstairs = state.scene === 'ground'
    state = prepareDoorTravel(state.save, s.cartridge, s.binding, {
      ...state, actionId: upstairs ? 'up' : 'down', target: upstairs ? 'stairs-up' : 'stairs-down',
    })
    assert.equal(state.scene, upstairs ? 'upper' : 'ground')
    assert.deepEqual(state.save, previous)
    // Serialization is a preparation-level recovery check, not Session proof.
    state = JSON.parse(JSON.stringify(state))
    assert.equal(s.binding.locate(state.save, state.scene), state.scene)
  }
  assert.equal(state.scene, 'ground')
  assert.deepEqual(state.save, JSON.parse(JSON.stringify(before)))
  assert.deepEqual(s.save, before)
})

test('cross-location doors update only location and map visitation, with corresponding return', () => {
  const s = setup(), before = structuredClone(s.save)
  const out = prepareDoorTravel(s.save, s.cartridge, s.binding, {...s.input, actionId: 'outside', target: 'front-door'})
  assert.equal(out.scene, 'street')
  assert.equal(out.save.location, 'Street')
  const back = prepareDoorTravel(out.save, s.cartridge, s.binding, {...out, actionId: 'inside', target: 'shop-door'})
  assert.equal(back.scene, 'ground')
  assert.ok(back.save.map.every(n => n.visited))
  const {map: _map, location: _location, ...rest} = back.save
  const {map: _oldMap, location: _oldLocation, ...original} = before
  assert.deepEqual(rest, original)
  assert.deepEqual(s.save, before)
})

test('current lock and arrival occupancy are checked on every attempt without mutating the input', () => {
  const s = setup()
  s.save.facts['door-open'] = false
  const closed = structuredClone(s.save)
  assert.throws(() => prepareDoorTravel(s.save, s.cartridge, s.binding, s.input), /DOOR_CLOSED/)
  assert.deepEqual(s.save, closed)
  s.save.facts['door-open'] = true
  s.block('upper')
  assert.throws(() => prepareDoorTravel(s.save, s.cartridge, s.binding, s.input), /DOOR_ARRIVAL_BLOCKED/)
  s.block('')
  assert.equal(prepareDoorTravel(s.save, s.cartridge, s.binding, s.input).scene, 'upper')
})

test('forged scene, target, remote feet and wrong story cannot cross a door', () => {
  const s = setup(), before = structuredClone(s.save)
  for (const input of [
    {...s.input, scene: 'street'}, {...s.input, target: 'box'},
    {...s.input, position: {x: 0, y: 0}}, {...s.input, position: {x: NaN, y: 45}},
  ]) assert.throws(() => prepareDoorTravel(s.save, s.cartridge, s.binding, input))
  assert.throws(() => prepareDoorTravel({...s.save, cartridgeId: 'other-player-story'}, s.cartridge, s.binding, s.input), /DOOR_STORY_MISMATCH/)
  assert.deepEqual(s.save, before)
})

test('ordinary inspection and mixed-effect story actions cannot impersonate a doorway', () => {
  const s = setup(), before = structuredClone(s.save)
  assert.throws(() => prepareDoorTravel(s.save, s.cartridge, s.binding, {...s.input, actionId: 'inspect', target: 'box'}), /DOOR_HAS_NO_ARRIVAL/)
  s.cartridge.domainRules!.rules[0].effects.push({type: 'fact', id: 'chapter-complete', value: true})
  assert.throws(() => prepareDoorTravel(s.save, s.cartridge, s.binding, s.input), /DOOR_TRAVEL_MUST_ONLY_MOVE/)
  assert.deepEqual(s.save, before)
})

test('ambiguous duplicate rule ids cannot bypass the compiled doorway contract', () => {
  const s = setup()
  s.cartridge.domainRules!.rules.push(structuredClone(s.cartridge.domainRules!.rules[0]))
  assert.throws(() => prepareDoorTravel(s.save, s.cartridge, s.binding, s.input), /DOOR_TRAVEL_MUST_ONLY_MOVE/)
})

test('plain movement does not run unrelated turn-derived inventory updates', () => {
  const s = setup()
  s.save.inventory = [{id: 'clock', label: 'Clock', count: 1, metrics: [{id: 'charge', label: 'Charge', value: '2'}]}]
  s.cartridge.domainRules!.derivedItemMetrics = [{itemId: 'clock', metricId: 'charge', label: 'Charge', factId: 'clock-used', maximum: 9, mode: 'remaining-from-used'}]
  const before = structuredClone(s.save)
  const next = prepareDoorTravel(s.save, s.cartridge, s.binding, s.input)
  assert.deepEqual(next.save, before)
})
