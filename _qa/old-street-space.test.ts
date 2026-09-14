import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge, oldStreetActionId, type OldStreetRoom} from '../src/old-street-cartridge'
import {bindOldStreet, oldStreetSpatialPlan, oldStreetDoors, oldStreetPath, oldStreetWalkable, oldStreetProps} from '../src/old-street-space'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {resolveDomainAction, applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
import {prepareDoorTravel} from '../src/spatial-door-travel'

for (const cleared of [false, true]) test(`every authored interaction can be approached in blockout, crates cleared=${cleared}`, () => {
  const cartridge = oldStreetCartridge('zh'), save = createInitialSave(cartridge)
  save.facts['crates-cleared'] = cleared
  const plan = oldStreetSpatialPlan(save), binding = bindOldStreet('zh', save)
  assert.equal(binding.actionIds().length, cartridge.domainRules!.rules.length)
  for (const entity of plan.entities) {
    const start = plan.scenes.find(s => s.id === entity.scene)!.spawn
    const route = oldStreetPath(entity.scene, start, entity.approach, save)
    assert.ok(route.length, `unreachable ${entity.id}`)
    assert.ok(route.every(p => oldStreetWalkable(entity.scene, p, save)))
    for (const id of entity.actions) assert.ok(binding.admits(id, entity.id, entity.scene, route.at(-1)!))
  }
})

for (const choice of ['roof', 'cellar']) test(`real pathfinder and bound door preparation support ${choice} route and shortcut return`, () => {
  const cartridge = oldStreetCartridge('zh'), plan = oldStreetSpatialPlan()
  let state = {save: createInitialSave(cartridge), scene: 'street', position: plan.scenes.find(s => s.id === 'street')!.spawn}
  function approach(id: string) {
    const binding = bindOldStreet('zh', state.save), target = binding.targetFor(id, state.scene)
    const entity = oldStreetSpatialPlan(state.save).entities.find(e => e.id === target)!
    assert.ok(entity)
    const route = oldStreetPath(state.scene, state.position, entity.approach, state.save)
    assert.ok(route.length, `no walking path to ${id}`)
    state.position = route.at(-1)!
    assert.ok(binding.admits(id, target!, state.scene, state.position))
    return {binding, target: target!}
  }
  function go(room: OldStreetRoom) {
    const door = oldStreetDoors().find(d => d.room === state.scene && d.destination.room === room)!
    assert.ok(door)
    const {binding, target} = approach(door.actionId)
    state = prepareDoorTravel(state.save, cartridge, binding, {...state, target, actionId: door.actionId})
    assert.equal(state.scene, room)
    assert.ok(oldStreetWalkable(room, state.position, state.save))
    state = JSON.parse(JSON.stringify(state))
  }
  function act(name: string) {
    const id = oldStreetActionId(name)
    approach(id)
    const resolution = resolveDomainAction(state.save, cartridge, id)!
    assert.equal(resolution.status, 'accepted', name)
    applyDomainResolution(state.save, cartridge, resolution)
  }
  if (choice === 'cellar') {
    go('yard'); go('laundry'); act('borrow-trolley'); go('yard'); act('clear-crates'); go('cellar'); go('shed')
  } else {go('photo'); go('roof'); go('shed')}
  act('borrow-key'); act('lift-latch'); go('yard'); go('shop'); act('unlock-letter'); act('take-letter'); go('street'); act('leave')
  assert.equal(state.save.facts.departed, true)
})

test('closed stairs reject travel and crate relocation changes collision without consuming the trolley', () => {
  const cartridge = oldStreetCartridge('zh'), save = createInitialSave(cartridge)
  save.map.forEach(n => {n.current = n.id === 'yard'})
  const door = oldStreetDoors().find(d => d.room === 'yard' && d.destination.room === 'cellar')!
  const input = {scene: 'yard', position: door.approach, target: door.id, actionId: door.actionId}
  assert.throws(() => prepareDoorTravel(save, cartridge, bindOldStreet('zh', save), input), /DOOR_CLOSED/)
  const crates = oldStreetProps.find(p => p.id === 'crates')!
  assert.equal(oldStreetWalkable('yard', crates.position, save), false)
  save.inventory.push({id: 'trolley', label: 'Trolley', count: 1})
  applyDomainResolution(save, cartridge, resolveDomainAction(save, cartridge, oldStreetActionId('clear-crates')))
  assert.equal(oldStreetWalkable('yard', crates.position, save), true)
  assert.equal(save.inventory.find(i => i.id === 'trolley')?.count, 1)
  assert.equal(prepareDoorTravel(save, cartridge, bindOldStreet('zh', save), input).scene, 'cellar')
})

test('served Tiled maps match the same floor contract and retain an event layer', async () => {
  const {readFileSync} = await import('node:fs')
  const {oldStreetFloors, oldStreetTmx} = await import('../src/old-street-space')
  for (const room of Object.keys(oldStreetFloors) as OldStreetRoom[]) {
    const map = readFileSync(new URL(`../public/map/oldstreet-${room}.tmx`, import.meta.url), 'utf8')
    assert.equal(map, oldStreetTmx(room))
    assert.match(map, /<objectgroup /)
  }
})
