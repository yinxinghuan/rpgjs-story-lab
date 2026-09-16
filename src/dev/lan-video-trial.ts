/** Local renderer experiment only: one real leftward cycle, no mirrored directions. */
import atlasUrl from '../../doc/oldstreet-lan-video-walk/cdn-retry/trial-atlas.png'
import {moveWithCollision,type Point} from '../vendor/space-motion/distance-motion'
export {atlasUrl}
export function sheet(image:string){
 const frame=(x:number,y:number)=>({frameX:x,frameY:y,time:0,anchor:[.5,328/352],scale:[.22,.22],x:16,y:28})
 return {id:'oldstreet-lan',image,width:1280,height:1056,framesWidth:5,framesHeight:3,textures:{
  stand:{animations:({direction}:{direction:'up'|'down'|'left'|'right'})=>[[frame({down:0,left:1,right:2,up:3}[direction],0)]]},
  ...Object.fromEntries(Array.from({length:10},(_,i)=>['video-'+i,{animations:()=>[[frame(i%5,1+Math.floor(i/5))]]}]))
 }}
}
export class LanVideoTrial{
 position:Point
 pose='stand'
 running=false
 distance=0
 constructor(readonly home:Point){this.position={...home}}
 start(){this.position={...this.home};this.distance=0;this.running=true;this.pose='stand'}
 update(dt:number,paused:boolean,walkable:(p:Point)=>boolean){
  if(paused||!this.running||!Number.isFinite(dt)||dt<=0||dt>.25){this.pose='stand';return}
  const step=moveWithCollision(this.position,{x:-Math.min(24*dt,24-this.distance),y:0},walkable)
  this.position=step.position;this.distance+=step.distance
  if(step.distance===0||this.distance>=24-1e-6){this.running=false;this.pose='stand'}
  else this.pose='video-'+Math.floor((this.distance%20)/2)
 }
}
