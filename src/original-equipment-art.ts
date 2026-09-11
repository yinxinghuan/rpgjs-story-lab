import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import type {StorySave} from './vendor/original-train/types'
import type {SceneResource} from './scene-readiness'
import type {OriginalAssetBindings} from './original-asset-releases'
import {deviceReleasePath} from './device-publication'

export const starterResource:SceneResource={kind:'background',path:'./art/starter-states-v1.png',sha256:'320bdfa057fc5b9069245664740b9cf0d9d8e19e8c830ea8116a31eb9fe9aebe',bytes:294319,width:640,height:640}
export const starterArt={graphic:'original-starter-v1',foot:{x:160,y:544},scale:40/326,body:{x:-20,y:-14,w:40,h:18}}
const starter=originalTrainChapterSpatialPlan().entities.find(e=>e.id==='starter')!
export function originalEquipmentSlots(scene:string){return scene===starter.scene?[{id:'art-starter',entityId:starter.id,x:starter.position.x,y:starter.position.y-1}]:[]}
export function originalEquipmentBodies(scene:string,assets?:OriginalAssetBindings){const g=assets?.version===3?assets.starter.review.geometry:undefined;return originalEquipmentSlots(scene).map(s=>g?{id:s.entityId,x:s.x-g.footprint.width/2,y:s.y+1-12,w:g.footprint.width,h:g.footprint.depth}:{id:s.entityId,x:s.x+starterArt.body.x,y:s.y+1+starterArt.body.y,w:starterArt.body.w,h:starterArt.body.h})}
export function originalEquipmentResource(assets?:OriginalAssetBindings):SceneResource{if(assets?.version!==3)return starterResource;const r=assets.starter;return {kind:'background',path:deviceReleasePath(r.id)+'/file',sha256:r.sha256,bytes:r.bytes,width:r.width,height:r.height}}
export function originalStarterState(save:StorySave){return save.facts['starter-repaired']===true?'repaired':'broken'}
export function originalStarterSheet(image:string,assets?:OriginalAssetBindings){
 const g=assets?.version===3?assets.starter.review.geometry:undefined,cw=g?.cellWidth??320,ch=g?.cellHeight??640,foot=g?.foot??starterArt.foot,scale=g?.scale??starterArt.scale
 const frame=(column:number)=>({animations:()=>[[{time:0,frameX:column,frameY:0,anchor:[foot.x/cw,foot.y/ch],scale:[scale,scale],x:0,y:1}]]})
 return {id:starterArt.graphic,image,width:cw*2,height:ch,framesWidth:2,framesHeight:1,textures:{broken:frame(0),repaired:frame(1)}}
}
