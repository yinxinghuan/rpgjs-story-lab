import type {ActorReviewTarget} from './actor-sheet-review'
import type {ActorPreview} from './sprite-map-candidate'
import {ACTOR_PREVIEW_HEIGHT} from './sprite-map-candidate'
import type {RendererMotion} from './rpg-renderer'
import {STRIDE_DISTANCE} from './walking-motion'

export const ACTOR_MAP_LAYOUT='north-cape-river-actor-1'
export const ACTOR_MAP_CHECKS=['down','left','right','up','stand','collision','river','return'] as const
export type ActorMapReview={version:1;layout:typeof ACTOR_MAP_LAYOUT;scale:number;bounds:ActorPreview['frameBounds'];checks:string[];visualAccepted:true}
const invalid=()=>{throw Error('ACTOR_MAP_REVIEW_REQUIRED')}
export function assertActorMapReview(r:any,d:ActorReviewTarget):asserts r is ActorMapReview{
 const s=d.spec
 if(!r||Object.keys(r).sort().join(',')!=='bounds,checks,layout,scale,version,visualAccepted'||r.version!==1||r.layout!==ACTOR_MAP_LAYOUT||r.visualAccepted!==true||!s||!Array.isArray(r.checks)||r.checks.length!==ACTOR_MAP_CHECKS.length||ACTOR_MAP_CHECKS.some(c=>!r.checks.includes(c))||!Array.isArray(r.bounds)||r.bounds.length!==12)return invalid()
 for(const b of r.bounds)if(!Array.isArray(b)||b.length!==4||!b.every(Number.isInteger)||b[0]<1||b[1]<1||b[2]<=b[0]||b[3]-b[1]<4||b[2]>=s.cellWidth||b[3]>=s.cellHeight||Math.abs(b[3]-s.foot.y)>2)return invalid()
 const heights=r.bounds.map((b:number[])=>b[3]-b[1]),median=[...heights].sort((a,b)=>a-b)[6]
 if(r.scale!==ACTOR_PREVIEW_HEIGHT/median||heights.some((h:number)=>h<median*.75||h>median*1.25))return invalid()
}
export function actorMapReview(candidate:ActorPreview,checks:string[]):ActorMapReview{
 if(ACTOR_MAP_CHECKS.some(c=>!checks.includes(c)))return invalid()
 return {version:1,layout:ACTOR_MAP_LAYOUT,scale:candidate.scale,bounds:structuredClone(candidate.frameBounds),checks:[...ACTOR_MAP_CHECKS],visualAccepted:true}
}
const home='train-at-dead-station',river='train-at-river-valley'
const poses=['stride-0','stride-1','stride-2']
/** Executed movement is evidence, not an anatomical or visual judgment. */
export class ActorMapTrial{
 private checks=new Set<string>()
 private stopped=new Set<string>()
 private previous:{sample:RendererMotion;time:number}|undefined
 private direction='';private distance=0;private poses=new Set<string>()
 private reset(){this.direction='';this.distance=0;this.poses.clear()}
 sample(s:RendererMotion|null,time:number){
  const old=this.previous;this.previous=undefined
  if(!s||s.paused||s.scene!==s.renderedScene||!s.renderedPosition||![time,s.position.x,s.position.y,s.renderedPosition.x,s.renderedPosition.y].every(Number.isFinite)||s.direction!==s.renderedDirection||s.animation!==s.renderedAnimation||Math.hypot(s.position.x-s.renderedPosition.x,s.position.y-s.renderedPosition.y)>1.5){this.reset();return}
  this.previous={sample:structuredClone(s),time}
  if(!old||old.sample.scene!==s.scene||time<=old.time||time-old.time>250){this.reset();return}
  const dx=s.position.x-old.sample.position.x,dy=s.position.y-old.sample.position.y,distance=Math.hypot(dx,dy)
  if(distance>28){this.reset();return} // Teleports/late samples do not count as walking.
  if(s.animation==='stand'||distance<.001){if(s.animation==='stand'&&this.direction===s.direction&&this.distance>=STRIDE_DISTANCE&&poses.every(p=>this.poses.has(p))&&s.scene===home){this.stopped.add(this.direction);if(['down','left','right','up'].every(d=>this.stopped.has(d)))this.checks.add('stand');if(this.checks.has('river'))this.checks.add('return')}this.reset();return}
  if(!poses.includes(s.animation)){this.reset();return}
  const direction=Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up')
  if(direction!==s.direction||Math.min(Math.abs(dx),Math.abs(dy))>.01){this.reset();return}
  if(this.direction!==direction){this.reset();this.direction=direction}
  this.distance+=distance;this.poses.add(s.animation)
  if(this.distance>=STRIDE_DISTANCE&&poses.every(p=>this.poses.has(p))){if(s.scene===home)this.checks.add(direction);if(s.scene===river)this.checks.add('river')}
 }
 collision(scene:string,blocked:boolean){if(scene===home&&blocked)this.checks.add('collision')}
 result(){return ACTOR_MAP_CHECKS.filter(c=>this.checks.has(c))}
}
