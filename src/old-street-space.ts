import type {Locale, StorySave} from './vendor/original-train/types'
import {oldStreetCartridge, oldStreetConnections, oldStreetTravelId, oldStreetActionId, type OldStreetRoom} from './old-street-cartridge'
import {compileSpatialBinding, type SpatialBindingDefinition, type SpatialPoint} from './spatial-binding'
import {findGridPath} from './grid-path'

type Rect = {x: number; y: number; w: number; h: number}
type Side = 'N' | 'S' | 'E' | 'W'
type Endpoint = {side: Side; fraction: number}
export const oldStreetBody = {w: 9, h: 15}
/** Logical blockout coordinates, not approved art or final room proportions. */
export const oldStreetFloors: Record<OldStreetRoom, Rect> = {
  street: {x: 56, y: 32, w: 272, h: 512}, shop: {x: 80, y: 80, w: 224, h: 416},
  yard: {x: 48, y: 48, w: 288, h: 480}, laundry: {x: 88, y: 112, w: 208, h: 352},
  photo: {x: 72, y: 96, w: 240, h: 384}, cellar: {x: 88, y: 64, w: 208, h: 448},
  roof: {x: 48, y: 96, w: 288, h: 384}, shed: {x: 88, y: 104, w: 208, h: 368},
}
const pair = (a: Side, af: number, b: Side, bf: number): [Endpoint, Endpoint] => [{side: a, fraction: af}, {side: b, fraction: bf}]
const doorPlacement: Record<string, [Endpoint, Endpoint]> = {
  'shop-front': pair('W', .25, 'S', .6), 'studio-front': pair('E', .4, 'S', .5),
  'yard-alley': pair('N', .5, 'S', .5), 'shop-back': pair('N', .55, 'W', .6),
  'laundry-back': pair('W', .3, 'E', .5), 'cellar-steps': pair('N', .3, 'S', .45),
  'studio-stairs': pair('N', .6, 'S', .3), 'riverside-stairs': pair('E', .6, 'N', .5),
  'cellar-exit': pair('N', .65, 'S', .5), 'yard-latch': pair('W', .4, 'E', .5),
}
const grid = (n: number) => Math.round(n / 4) * 4
const pointIn = (room: OldStreetRoom, x: number, y: number) => {
  const r = oldStreetFloors[room]
  return {x: grid(r.x + r.w * x), y: grid(r.y + r.h * y)}
}
function endpoint(room: OldStreetRoom, p: Endpoint) {
  const r = oldStreetFloors[room]
  const position = p.side === 'N' || p.side === 'S'
    ? {x: grid(r.x + r.w * p.fraction), y: p.side === 'N' ? r.y : r.y + r.h}
    : {x: p.side === 'W' ? r.x : r.x + r.w, y: grid(r.y + r.h * p.fraction)}
  const offset = {N: {x: 0, y: 32}, S: {x: 0, y: -32}, E: {x: -32, y: 0}, W: {x: 32, y: 0}}[p.side]
  return {room, position, approach: {x: position.x + offset.x, y: position.y + offset.y}, side: p.side}
}
export function oldStreetDoors() {
  return oldStreetConnections.flatMap(edge => {
    const placements = doorPlacement[edge.id]
    if (!placements) throw Error('OLD_STREET_DOOR_UNPLACED:' + edge.id)
    const a = endpoint(edge.a, placements[0]), b = endpoint(edge.b, placements[1])
    return [[a, b], [b, a]].map(([from, to]) => ({
      id: `door:${edge.id}:${from.room}`, actionId: oldStreetTravelId(edge.id, from.room),
      kind: edge.kind, gate: edge.gate, ...from, destination: to,
    }))
  })
}
type Prop = {id: string; room: OldStreetRoom; position: SpatialPoint; approach: SpatialPoint; actions: string[]; body: Rect}
const prop = (id: string, room: OldStreetRoom, x: number, y: number, actions: string[]): Prop => {
  const position = pointIn(room, x, y)
  return {id, room, position, approach: {x: position.x, y: position.y + 28}, actions: actions.map(oldStreetActionId), body: {x: position.x - 12, y: position.y - 12, w: 32, h: 28}}
}
export const oldStreetProps = [
  prop('drawer', 'shop', .28, .32, ['move-box', 'take-lens', 'inspect-clock']),
  prop('letter-compartment', 'shop', .7, .32, ['unlock-letter', 'take-letter']),
  prop('record-book', 'shop', .3, .65, ['record-clock', 'record-photo', 'withdraw-clock', 'withdraw-photo']),
  prop('trolley', 'laundry', .3, .3, ['borrow-trolley', 'return-trolley']),
  prop('laundry-owner', 'laundry', .66, .65, ['return-clock', 'consent-clock']),
  prop('crates', 'yard', .3, .13, ['clear-crates']),
  prop('watchmaker', 'shed', .65, .45, ['borrow-key', 'return-key', 'take-clock']),
  prop('photo-folder', 'cellar', .3, .4, ['take-photos']),
  prop('viewing-table', 'photo', .3, .3, ['match-photos']),
  prop('photographer', 'photo', .7, .65, ['return-photos', 'consent-photo']),
  prop('street-exit', 'street', .5, .88, ['leave']),
]
const intersects = (a: Rect, b: Rect) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
export function oldStreetObstacleBodies(room: OldStreetRoom, save: Pick<StorySave, 'facts'>): Rect[] {
  return oldStreetProps.filter(p => p.room === room && p.id !== 'street-exit').map(p => {
    // The crate remains visible but moves out of the stair approach, never vanishes.
    if (p.id === 'crates' && save.facts['crates-cleared'] === true) return {...p.body, x: oldStreetFloors.yard.x + 32, y: oldStreetFloors.yard.y + 220}
    return {...p.body}
  })
}
export function oldStreetWalkable(room: string, p: SpatialPoint, save: Pick<StorySave, 'facts'>) {
  const r = oldStreetFloors[room as OldStreetRoom]
  if (!r || !Number.isFinite(p.x) || !Number.isFinite(p.y)) return false
  const feet = {...p, ...oldStreetBody}
  return p.x >= r.x && p.y >= r.y && p.x + feet.w <= r.x + r.w && p.y + feet.h <= r.y + r.h
    && !oldStreetObstacleBodies(room as OldStreetRoom, save).some(body => intersects(feet, body))
}
export const oldStreetPath = (room: string, start: SpatialPoint, end: SpatialPoint, save: Pick<StorySave, 'facts'>) => findGridPath(start, end, p => oldStreetWalkable(room, p, save))
export function oldStreetSpatialPlan(): SpatialBindingDefinition {
  const doors = oldStreetDoors()
  const latch = doors.find(d => d.gate === 'yard-unlatched' && d.room === 'shed')!
  return {version: 1, cartridgeId: oldStreetCartridge('zh').id, mapVersion: 'oldstreet-blockout-1', interactionDistance: 54,
    scenes: (Object.keys(oldStreetFloors) as OldStreetRoom[]).map(id => ({id, spawn: pointIn(id, .5, .52)})),
    entities: [
      ...doors.map(d => ({id: d.id, scene: d.room, position: d.position, approach: d.approach, states: ['open', 'closed'], actions: [d.actionId, ...(d === latch ? [oldStreetActionId('lift-latch')] : [])]})),
      ...oldStreetProps.map(p => ({id: p.id, scene: p.room, position: p.position, approach: p.approach, states: ['initial', 'changed'], actions: p.actions})),
    ], portals: doors.map(d => ({actionId: d.actionId, fromScene: d.room, scene: d.destination.room, position: d.destination.approach})), characters: [],
  }
}
export function bindOldStreet(locale: Locale, save: Pick<StorySave, 'facts'>) {
  return compileSpatialBinding(oldStreetCartridge(locale), oldStreetSpatialPlan(), (room, p) => oldStreetWalkable(room, p, save))
}
