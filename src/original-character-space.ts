import {originalEntityLayout} from './original-world-plan'
import type {OriginalAssetBindings} from './original-asset-releases'
import type {StorySave} from './vendor/original-train/types'
import {originalCharacterPresent} from './original-character-presence'
import {originalTrainChapterSpatialPlan,originalTrainPlanWalkable} from './original-train-spatial-plan'

const world=originalTrainChapterSpatialPlan()
type Point={x:number;y:number}
type Presence={save:StorySave;sceneId:string;assets?:OriginalAssetBindings}
/** Character positions are foot centers; the player position is its hitbox top-left. */
export function originalCharacterBodies(head:Presence){
 return world.characters.filter(c=>originalCharacterPresent(head.save,c.id)).flatMap(c=>{
  const base=world.entities.find(e=>e.scene===head.sceneId&&c.entities.includes(e.id)),e=base?originalEntityLayout(head.assets,base):undefined
  return e?[{id:c.id,entityId:e.id,x:e.position.x-4.5,y:e.position.y-15,w:9,h:15}]:[]
 })
}
export function originalCharacterWalkable(head:Presence,p:Point,ground=(q:Point)=>originalTrainPlanWalkable(head.sceneId,q)){
 return ground(p)&&!originalCharacterBodies(head).some(b=>p.x+9>b.x&&p.x<b.x+b.w&&p.y+15>b.y&&p.y<b.y+b.h)
}
/** Only occupied legacy positions are moved; all story fields stay untouched. */
export function originalCharacterSafePosition(head:Presence,p:Point,walkable=(q:Point)=>originalCharacterWalkable(head,q)):Point{
 if(walkable(p))return {...p}
 // Retain subpixel phase; choose the nearest legal point in the first legal ring.
 for(let radius=1;radius<=48;radius++){
  const ring:Point[]=[]
  for(let offset=-radius;offset<=radius;offset++){
   ring.push({x:p.x+offset,y:p.y-radius},{x:p.x+offset,y:p.y+radius})
   if(Math.abs(offset)<radius)ring.push({x:p.x-radius,y:p.y+offset},{x:p.x+radius,y:p.y+offset})
  }
  ring.sort((a,b)=>Math.hypot(a.x-p.x,a.y-p.y)-Math.hypot(b.x-p.x,b.y-p.y))
  const safe=ring.find(walkable);if(safe)return safe
 }
 throw Error('ORIGINAL_CHARACTER_POSITION_UNAVAILABLE')
}
