import {assertRelayProjection} from './relay-content'
import {bindCarriageStory} from './carriage-spatial-binding'
import {cartridge} from './story'
import type { StorySave } from './story'
import { entities, states } from './contract'
import { DISPATCHER } from './contacts'

/** Fail before the session transaction when a story candidate cannot be
 * represented by the admitted spatial world. This never repairs a result by
 * inventing a map, moving an actor or silently choosing another entrance. */
export function assertSpatialStoryProjection(before: StorySave, after: StorySave, actionId: string | null) {
  const arrival=bindCarriageStory(cartridge(before.locale,before)).assertTransition(before,after,actionId)
  assertRelayProjection(before,after,actionId)
  const oldIds = new Set(before.characters.map(person => person.id))
  for (const person of after.characters) {
    if (!oldIds.has(person.id) && !Object.hasOwn(entities, person.id) && person.id !== DISPATCHER) throw new Error('UNREPRESENTABLE_CHARACTER')
  }
  for (const id of ['lin', 'zhou-yu', DISPATCHER]) {
    const old = before.characters.find(person => person.id === id)
    const next = after.characters.find(person => person.id === id)
    if (old && next && old.name !== next.name) throw new Error('VISUAL_IDENTITY_CHANGED')
  }
  const visual = states(after)
  for (const id of Object.keys(entities) as Array<keyof typeof entities>) {
    if (!(entities[id].states as readonly string[]).includes(visual[id])) throw new Error('UNREPRESENTABLE_ENTITY_STATE')
  }
  return arrival
}
