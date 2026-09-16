/** Local renderer experiment only: four real video directions, never mirrored. */
import atlasUrl from '../../doc/oldstreet-lan-video-walk/four-way/trial-atlas.png'
import {moveWithCollision,type Point} from '../vendor/space-motion/distance-motion'
export {atlasUrl}
type Facing='up'|'down'|'left'|'right'
const row={down:0,left:1,right:2,up:3}
export function sheet(image:string){
 const frame=(x:number,y:number)=>({frameX:x,frameY:y,time:0,anchor:[.5,328/352],scale:[.22,.22],x:16,y:28})
 return {id:'oldstreet-lan',image,width:2816,height:1408,framesWidth:11,framesHeight:4,textures:{
  stand:{animations:({direction}:{direction:Facing})=>[[frame(0,row[direction])]]},
  ...Object.fromEntries(Array.from({length:10},(_,i)=>['video-'+i,{animations:({direction}:{direction:Facing})=>[[frame(i+1,row[direction])]]}]))
 }}
}
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
  const amount=Math.min(24*dt,24-this.distance),delta={left:{x:-amount,y:0},right:{x:amount,y:0},up:{x:0,y:-amount},down:{x:0,y:amount}}[this.direction]
  const step=moveWithCollision(this.position,delta,walkable)
  this.position=step.position;this.distance+=step.distance
  if(step.distance===0||this.distance>=24-1e-6){this.running=false;this.pose='stand'}
  else this.pose='video-'+Math.floor((this.distance%20)/2)
 }
}
