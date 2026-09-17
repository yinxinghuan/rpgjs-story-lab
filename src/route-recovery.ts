import {advanceRoute,type Point} from './vendor/space-motion/distance-motion'

/** Recover from a changed obstacle using the same destination and live collider.
 * Only plans a route: movement and arrival remain owned by the renderer tick. */
export function recoverBlockedRoute(position:Point,remaining:readonly Point[],findPath:(a:Point,b:Point)=>Point[],walkable:(p:Point)=>boolean):Point[]{
 const destination=remaining.at(-1)
 if(!destination)return []
 const candidate=findPath(position,destination)
 if(!candidate.length)return []
 const firstStep=advanceRoute(position,candidate,4,walkable)
 return !firstStep.blocked&&(firstStep.distance>0||firstStep.arrived)?candidate:[]
}
