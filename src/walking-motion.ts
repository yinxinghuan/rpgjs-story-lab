// This game's calibration; reusable geometry and gait live in the vendored kernel.
import { createDistancePoseSelector } from './vendor/space-motion/distance-motion'
export { moveWithCollision, advanceRoute } from './vendor/space-motion/distance-motion'
export const WALK_SPEED = 110
export const STRIDE_DISTANCE = 55
export const walkingPose = createDistancePoseSelector(STRIDE_DISTANCE, ['stride-0', 'stride-1', 'stride-2', 'stride-1'])
