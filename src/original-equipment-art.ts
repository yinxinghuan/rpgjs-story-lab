import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import type {StorySave} from './vendor/original-train/types'
import type {SceneResource} from './scene-readiness'

export const starterResource:SceneResource={kind:'background',path:'./art/starter-states-v1.png',sha256:'320bdfa057fc5b9069245664740b9cf0d9d8e19e8c830ea8116a31eb9fe9aebe',bytes:294319,width:640,height:640}
export const starterArt={graphic:'original-starter-v1',foot:{x:160,y:544},scale:40/326,body:{x:-20,y:-14,w:40,h:18}}
const starter=originalTrainChapterSpatialPlan().entities.find(e=>e.id==='starter')!
export function originalEquipmentSlots(scene:string){return scene===starter.scene?[{id:'art-starter',entityId:starter.id,x:starter.position.x,y:starter.position.y-1}]:[]}
export function originalEquipmentBodies(scene:string){return originalEquipmentSlots(scene).map(s=>({id:s.entityId,x:s.x+starterArt.body.x,y:s.y+1+starterArt.body.y,w:starterArt.body.w,h:starterArt.body.h}))}
export function originalStarterState(save:StorySave){return save.facts['starter-repaired']===true?'repaired':'broken'}
export function originalStarterSheet(image:string){
 const frame=(column:number)=>({animations:()=>[[{time:0,frameX:column,frameY:0,anchor:[.5,544/640],scale:[starterArt.scale,starterArt.scale],x:0,y:1}]]})
 return {id:starterArt.graphic,image,width:640,height:640,framesWidth:2,framesHeight:1,textures:{broken:frame(0),repaired:frame(1)}}
}
