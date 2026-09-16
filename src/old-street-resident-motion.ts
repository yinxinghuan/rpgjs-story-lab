import {createDistancePoseSelector,moveWithCollision,type Point} from './vendor/space-motion/distance-motion'

// Residents take short, slow steps. Sprite scale does not describe their stride:
// the old hero-scaled 51-unit cycle took 2.14s and outlasted the first 24-unit walk.
export const oldStreetResidentGait={speed:24,cycleDistance:20} as const
const gait=createDistancePoseSelector(oldStreetResidentGait.cycleDistance,['stride-0','stride-1','stride-2','stride-1'])
/** Cosmetic single-player activity, bounded inside the authored interaction area. */
export class OldStreetResidentMotion {
 position:Point
 direction:'up'|'down'|'left'|'right'='down'
 pose='stand'
 private sign=1
 private rest=3
 private stride=0
 private attending=false
 constructor(readonly home:Point,hero?:Point,readonly axis:'x'|'y'='x',readonly radius=24){
  this.position={...home}
  // The short vertical route can be narrower than two bodies. On restoration,
  // allow a temporary spot behind home rather than spawning on the player.
  const arrivals=axis==='y'?[0,-Math.max(32,radius),radius]:[0,-radius,radius]
  if(hero){for(const offset of arrivals){const p={...home,[axis]:home[axis]+offset};if(!(p.x-12<hero.x+16&&p.x+20>hero.x&&p.y-12<hero.y+26&&p.y+16>hero.y)){this.position=p;break}}}
 }
 update(dt:number,hero:Point,paused:boolean,selected:boolean,walkable:(p:Point)=>boolean){
  this.pose='stand'
  if(!Number.isFinite(dt)||dt<=0||dt>.25){this.stride=0;return}
  const dx=hero.x-this.position.x,dy=hero.y-this.position.y,d=Math.hypot(dx,dy)
  this.attending=selected||d<(this.attending?120:100)
  if(this.attending){this.stride=0;if(d>1)this.direction=Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy>0?'down':'up';return}
  // Interaction pauses locomotion, not attention to the nearby speaker.
  if(paused){this.stride=0;return}
  if(this.rest>0){this.rest=Math.max(0,this.rest-dt);return}
  const remaining=this.home[this.axis]+this.sign*this.radius-this.position[this.axis]
  const delta={x:0,y:0,[this.axis]:Math.sign(remaining)*Math.min(Math.abs(remaining),oldStreetResidentGait.speed*dt)}
  const result=moveWithCollision(this.position,delta,walkable)
  this.position=result.position
  if(result.distance>0){this.stride+=result.distance;this.pose=gait(this.stride);this.direction=this.axis==='x'?(this.sign>0?'right':'left'):(this.sign>0?'down':'up')}
  if(Math.abs(this.position[this.axis]-(this.home[this.axis]+this.sign*this.radius))<.01||result.distance===0){this.sign*=-1;this.rest=3;this.stride=0;this.pose='stand'}
 }
}
