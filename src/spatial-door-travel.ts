import type {StorySave, StoryCartridge} from './vendor/original-train/types'
import {resolveDomainAction, applyDomainResolution} from './vendor/original-train/engine/domainRules'
import type {compileSpatialBinding, SpatialPoint} from './spatial-binding'

type Binding = ReturnType<typeof compileSpatialBinding>
export interface DoorTravelInput {
  actionId: string
  target: string
  scene: string
  position: SpatialPoint
}

/** Prepare an ordinary doorway crossing using the current authoritative save.
 * The caller supplies its admitted world, then commits save + room + feet in
 * one existing Session transaction. This function neither stores nor narrates.
 * Multiple physical rooms may share one story location: those doors have no
 * map effect but still require an explicit, compiled portal and arrival point.
 */
export function prepareDoorTravel(
  save: StorySave,
  cartridge: StoryCartridge,
  binding: Binding,
  input: DoorTravelInput,
) {
  if (save.cartridgeId !== binding.cartridgeId || cartridge.id !== binding.cartridgeId) {
    throw Error('DOOR_STORY_MISMATCH')
  }
  binding.locate(save, input.scene)
  if (!binding.admits(input.actionId, input.target, input.scene, input.position)) {
    throw Error('DOOR_UNREACHABLE')
  }
  const rules = cartridge.domainRules?.rules.filter(rule => rule.id === input.actionId) ?? []
  const rule = rules[0]
  if (rules.length !== 1 || rule.effects.length > 1 || rule.effects.some(effect => effect.type !== 'map')) {
    throw Error('DOOR_TRAVEL_MUST_ONLY_MOVE')
  }
  const travelCartridge = {
    ...cartridge,
    domainRules: {rules: [{...rule, match: [input.actionId]}]},
  }
  const resolution = resolveDomainAction(save, travelCartridge, input.actionId)
  if (!resolution || resolution.status !== 'accepted') throw Error('DOOR_CLOSED')
  const next = structuredClone(save)
  // Do not run unrelated turn-derived inventory metrics during plain movement.
  applyDomainResolution(next, travelCartridge, resolution)
  // The core normally supplies new turn choices. Crossing an ordinary door is
  // not a new narrative turn, and must leave the player's pending choices alone.
  next.choices = structuredClone(save.choices)
  const arrival = binding.assertTransition(save, next, input.actionId, input.scene)
  if (!arrival) throw Error('DOOR_HAS_NO_ARRIVAL')
  if (!binding.validPosition(arrival.scene, arrival.position)) throw Error('DOOR_ARRIVAL_BLOCKED')
  return {save: next, scene: arrival.scene, position: arrival.position}
}
