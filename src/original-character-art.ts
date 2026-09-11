import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import {originalCharacterPresent} from './original-character-presence'
import type {StorySave} from './vendor/original-train/types'
import type {SceneResource} from './scene-readiness'

export const adaStandingResource:SceneResource={kind:'background',path:'./art/ada-standing-v1.png',sha256:'c9d268d14c4890014e101124fcb166efd813992e0a956b8417012729bbb12912',bytes:36405,width:320,height:320}
export const originalStandingArt={characterId:'ada-mechanic',graphic:'original-ada-standing-v1',foot:{x:160,y:300},scale:.16,capability:'front-standing-only' as const}
const world=originalTrainChapterSpatialPlan()
export function originalCharacterArtSlots(scene:string){
 const c=world.characters.find(c=>c.id===originalStandingArt.characterId)!
 return world.entities.filter(e=>e.scene===scene&&c.entities.includes(e.id)).map(e=>({entityId:e.id,id:'art-'+e.id,characterId:c.id,x:e.position.x,y:e.position.y-1}))
}
export function originalCharacterArtAnimation(save:StorySave,id:string){return id===originalStandingArt.characterId&&originalCharacterPresent(save,id)?'stand':'hidden'}
export function originalStandingSheet(image:string){
 const frame=(visible:boolean)=>({animations:()=>[[{time:0,frameX:0,frameY:0,anchor:[.5,300/320],scale:[.16,.16],x:0,y:1,opacity:visible?1:0}]]})
 return {id:originalStandingArt.graphic,image,width:320,height:320,framesWidth:1,framesHeight:1,textures:{stand:frame(true),hidden:frame(false)}}
}
