/** Current platform candidate at actual scene scale; local debug entry only. */
import {laundryActorUrl as atlasUrl} from '../old-street-laundry-art'
import {createDistancePoseSelector,moveWithCollision,type Point} from '../vendor/space-motion/distance-motion'
import {oldStreetResidentGait} from '../old-street-resident-motion'
export {atlasUrl}
type Facing='up'|'down'|'left'|'right'
export {laundryActorSheet as sheet} from '../old-street-laundry-art'
const gait=createDistancePoseSelector(oldStreetResidentGait.cycleDistance,['stride-0','stand','stride-2','stand'])
export class LanVideoTrial{
 position:Point
 pose='stand'
 running=false
 distance=0
 direction:Facing='left'
 constructor(readonly home:Point){this.position={...home}}
 start(direction:Facing='left'){this.direction=direction;this.distance=0;this.running=true;this.pose='stand'}
 update(dt:number,paused:boolean,walkable:(p:Point)=>boolean){
  if(paused||!this.running||!Number.isFinite(dt)||dt<=0||dt>.25){this.pose='stand';return}
  const amount=Math.min(oldStreetResidentGait.speed*dt,24-this.distance),delta={left:{x:-amount,y:0},right:{x:amount,y:0},up:{x:0,y:-amount},down:{x:0,y:amount}}[this.direction]
  const step=moveWithCollision(this.position,delta,walkable)
  this.position=step.position;this.distance+=step.distance
  if(step.distance===0||this.distance>=24-1e-6){this.running=false;this.pose='stand'}
  else this.pose=gait(this.distance)
 }
}
