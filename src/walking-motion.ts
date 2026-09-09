// World distance is the shared clock for movement and the player's foot poses.
export const WALK_SPEED = 110
export const STRIDE_DISTANCE = 55
type Point = { x: number; y: number }
type CanWalk = (point: Point) => boolean
const EPSILON = 1e-7

export function walkingPose(distance: number) {
  const phase = Math.floor(((distance % STRIDE_DISTANCE) / STRIDE_DISTANCE) * 4)
  return `stride-${[0, 1, 2, 1][phase]}`
}

export function moveWithCollision(position: Point, delta: Point, canWalk: CanWalk) {
  let next = { ...position }
  let distance = 0
  // Sweep at most one world pixel per substep, including after a slow frame.
  const steps = Math.max(1, Math.ceil(Math.hypot(delta.x, delta.y)))
  for (let i = 0; i < steps; i++) {
    const before = next
    const horizontal = { x: next.x + delta.x / steps, y: next.y }
    if (canWalk(horizontal)) next = horizontal
    const vertical = { x: next.x, y: next.y + delta.y / steps }
    if (canWalk(vertical)) next = vertical
    distance += Math.hypot(next.x - before.x, next.y - before.y)
  }
  return { position: next, distance }
}

export function advanceRoute(position: Point, route: readonly Point[], budget: number, canWalk: CanWalk) {
  let next = { ...position }, distance = 0, consumed = 0
  let direction = { x: 0, y: 0 }, blocked = false
  while (consumed < route.length) {
    const target = route[consumed]
    const dx = target.x - next.x, dy = target.y - next.y, remaining = Math.hypot(dx, dy)
    if (remaining < EPSILON) { consumed++; continue }
    if (budget < EPSILON) break
    const amount = Math.min(remaining, budget)
    const intended = { x: dx / remaining * amount, y: dy / remaining * amount }
    const result = moveWithCollision(next, intended, canWalk)
    const actual = { x: result.position.x - next.x, y: result.position.y - next.y }
    if (result.distance > EPSILON) direction = actual
    next = result.position
    distance += result.distance
    budget -= amount
    if (Math.hypot(actual.x - intended.x, actual.y - intended.y) > EPSILON) {
      blocked = true
      break
    }
    if (amount >= remaining - EPSILON) consumed++
  }
  return { position: next, distance, consumed, direction, blocked, arrived: consumed === route.length }
}
