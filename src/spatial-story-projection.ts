import type { StorySave } from './story'
import { actionTarget, entities, states } from './contract'
import { scenes, portalArrivals } from './scene-layout'
import { DISPATCHER } from './contacts'

/** Fail before the session transaction when a story candidate cannot be
 * represented by the admitted spatial world. This never repairs a result by
 * inventing a map, moving an actor or silently choosing another entrance. */
export function assertSpatialStoryProjection(before: StorySave, after: StorySave, actionId: string | null) {
  const source = before.map.filter(node => node.current)
  const target = after.map.filter(node => node.current)
  if (source.length !== 1 || target.length !== 1 || !Object.hasOwn(scenes, source[0].id) || !Object.hasOwn(scenes, target[0].id)) throw new Error('UNREPRESENTABLE_SCENE')
  const arrival = actionId ? portalArrivals[actionId] : undefined
  if (source[0].id !== target[0].id && (!arrival || arrival.scene !== target[0].id)) throw new Error('UNADMITTED_STORY_TRANSITION')
  if (arrival && actionId && entities[actionTarget[actionId]]?.scene !== source[0].id) throw new Error('PORTAL_SOURCE_MISMATCH')
  if (arrival && arrival.scene !== target[0].id) throw new Error('PORTAL_STORY_MISMATCH')
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
}
