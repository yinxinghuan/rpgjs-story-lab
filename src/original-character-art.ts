import {originalEntityLayout} from './original-world-plan'
import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import {originalCharacterPresent} from './original-character-presence'
import type {StorySave} from './vendor/original-train/types'
import type {SceneResource} from './scene-readiness'
import {originalActorRelease,originalStandingCast,type OriginalAssetBindings} from './original-asset-releases'
import {actorReleasePath} from './actor-publication'
import {Direction} from '@rpgjs/common'

import {adaStandingResource,fixedStandingReleases} from './original-art-identities'
export {adaStandingResource} from './original-art-identities'
export const originalStandingArt={characterId:'ada-mechanic',graphic:'original-ada-standing-v1',foot:{x:160,y:300},scale:.16,capability:'front-standing-only' as const}
const world=originalTrainChapterSpatialPlan()
export function originalCharacterArtSlots(scene:string,assets?:OriginalAssetBindings){
 return world.characters.filter(c=>originalCharacterHasArt(c.id,assets)).flatMap(c=>world.entities.filter(e=>e.scene===scene&&c.entities.includes(e.id)).map(e=>originalEntityLayout(assets,e)).map(e=>({entityId:e.id,id:'art-'+e.id,characterId:c.id,graphic:c.id===originalStandingArt.characterId?originalStandingArt.graphic:originalFixedStandingArt(assets).find(a=>a.characterId===c.id)!.graphic,x:e.position.x,y:e.position.y-1})))
}
export function originalFixedStandingArt(assets?:OriginalAssetBindings){return Object.values(originalStandingCast(assets)).map(id=>fixedStandingReleases[id])}
export function originalCharacterHasArt(id:string|undefined,assets?:OriginalAssetBindings){return id===originalStandingArt.characterId||originalFixedStandingArt(assets).some(a=>a.characterId===id)}
export function originalCharacterArtAnimation(save:StorySave,id:string,assets?:OriginalAssetBindings){return originalCharacterHasArt(id,assets)&&originalCharacterPresent(save,id)?'stand':'hidden'}
export function originalFixedStandingSheet(image:string,a:ReturnType<typeof originalFixedStandingArt>[number]){
 const frame=(visible:boolean)=>({animations:()=>[[{time:0,frameX:0,frameY:0,anchor:[a.foot.x/a.resource.width,a.foot.y/a.resource.height],scale:[a.scale,a.scale],x:0,y:1,opacity:visible?1:0}]]})
 return {id:a.graphic,image,width:a.resource.width,height:a.resource.height,framesWidth:1,framesHeight:1,textures:{stand:frame(true),hidden:frame(false)}}
}
export function originalActorResource(assets?:OriginalAssetBindings):SceneResource{const r=originalActorRelease(assets);return r?{kind:'background',path:actorReleasePath(r.id)+'/file',sha256:r.sha256,bytes:r.bytes,width:r.width,height:r.height}:adaStandingResource}
export function originalActorDirection(from:{x:number;y:number},to:{x:number;y:number}){const x=to.x-from.x,y=to.y-from.y;return Math.abs(x)>Math.abs(y)?x>0?Direction.Right:Direction.Left:y<0?Direction.Up:Direction.Down}
export function originalStandingSheet(image:string,assets?:OriginalAssetBindings){
 const r=originalActorRelease(assets)
 if(r){const cw=r.width/3,ch=r.height/4,frame=(visible:boolean)=>({animations:({direction=Direction.Down}:{direction?:Direction})=>[[{time:0,frameX:1,frameY:{down:0,left:1,right:2,up:3}[direction],anchor:[r.foot.x/cw,r.foot.y/ch],scale:[r.review.scale,r.review.scale],x:0,y:1,opacity:visible?1:0}]]});return {id:originalStandingArt.graphic,image,width:r.width,height:r.height,framesWidth:3,framesHeight:4,textures:{stand:frame(true),hidden:frame(false)}}}
 const frame=(visible:boolean)=>({animations:()=>[[{time:0,frameX:0,frameY:0,anchor:[.5,300/320],scale:[.16,.16],x:0,y:1,opacity:visible?1:0}]]})
 return {id:originalStandingArt.graphic,image,width:320,height:320,framesWidth:1,framesHeight:1,textures:{stand:frame(true),hidden:frame(false)}}
}
