import {layeredSheets,layerPose,fanPartsSpec} from './layered-device'
import {layerReleasePath} from './layered-archive-contract'
import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import type {StorySave} from './vendor/original-train/types'
import type {SceneResource} from './scene-readiness'
import {originalStarterRelease,originalFixedEquipment,originalFanRelease,type OriginalAssetBindings} from './original-asset-releases'
import {deviceReleasePath} from './device-publication'
import {fanArt,originalFanState,fanRotationPose} from './original-fan-art'

export const starterResource:SceneResource={kind:'background',path:'./art/starter-states-v1.png',sha256:'320bdfa057fc5b9069245664740b9cf0d9d8e19e8c830ea8116a31eb9fe9aebe',bytes:294319,width:640,height:640}
export const starterArt={graphic:'original-starter-v1',foot:{x:160,y:544},scale:40/326,body:{x:-20,y:-14,w:40,h:18}}
const starter=originalTrainChapterSpatialPlan().entities.find(e=>e.id==='starter')!
const fan=originalTrainChapterSpatialPlan().entities.find(e=>e.id==='tunnel-fan')!
export function originalEquipmentHasArt(id:string,assets?:OriginalAssetBindings){return id==='starter'||id==='tunnel-fan'&&Boolean(originalFanRelease(assets)||originalFixedEquipment(assets)['tunnel-fan'])}
export function originalEquipmentSlots(scene:string,assets?:OriginalAssetBindings){
 return [...(scene===starter.scene?[{id:'art-starter',entityId:starter.id,layer:'starter',graphic:starterArt.graphic,x:starter.position.x,y:starter.position.y-1}]:[]),...(scene===fan.scene&&originalEquipmentHasArt(fan.id,assets)?['housing','rotor'].map(layer=>({id:'art-fan-'+layer,entityId:fan.id,layer,graphic:'original-fan-'+layer+'-v1',x:fan.position.x,y:fan.position.y-1+(layer==='rotor'?.01:0)})):[])]
}
export function originalEquipmentAnimation(save:StorySave,layer:string,elapsed=0,assets?:OriginalAssetBindings){return layer==='housing'?'stand':layer==='rotor'?(originalFanState(save)==='running'?layerPose(elapsed,originalFanRelease(assets)?.spec.periodMs??1200):'stopped'):originalStarterState(save)}
export function originalEquipmentBodies(scene:string,assets?:OriginalAssetBindings){const g=originalStarterRelease(assets)?.review.geometry;const result=originalEquipmentSlots(scene).map(s=>g?{id:s.entityId,x:s.x-g.footprint.width/2,y:s.y+1-12,w:g.footprint.width,h:g.footprint.depth}:{id:s.entityId,x:s.x+starterArt.body.x,y:s.y+1+starterArt.body.y,w:starterArt.body.w,h:starterArt.body.h});if(scene===fan.scene&&originalEquipmentHasArt(fan.id,assets)){const body=originalFanRelease(assets)?.spec.body;result.push(body?{id:fan.id,x:fan.position.x-body.width/2,y:fan.position.y-body.depth,w:body.width,h:body.depth+body.front}:{id:fan.id,x:fan.position.x+fanArt.body.x,y:fan.position.y+fanArt.body.y,w:fanArt.body.w,h:fanArt.body.h})};return result}
export function originalEquipmentResource(assets?:OriginalAssetBindings):SceneResource{const r=originalStarterRelease(assets);if(!r)return starterResource;return {kind:'background',path:deviceReleasePath(r.id)+'/file',sha256:r.sha256,bytes:r.bytes,width:r.width,height:r.height}}
export function originalStarterState(save:StorySave){return save.facts['starter-repaired']===true?'repaired':'broken'}
export function originalStarterSheet(image:string,assets?:OriginalAssetBindings){
 const g=originalStarterRelease(assets)?.review.geometry,cw=g?.cellWidth??320,ch=g?.cellHeight??640,foot=g?.foot??starterArt.foot,scale=g?.scale??starterArt.scale
 const frame=(column:number)=>({animations:()=>[[{time:0,frameX:column,frameY:0,anchor:[foot.x/cw,foot.y/ch],scale:[scale,scale],x:0,y:1}]]})
 return {id:starterArt.graphic,image,width:cw*2,height:ch,framesWidth:2,framesHeight:1,textures:{broken:frame(0),repaired:frame(1)}}
}

export function originalFanResources(assets?:OriginalAssetBindings){const r=originalFanRelease(assets);return (['housing','rotor']as const).map(part=>{const f=r?.[part];return [part,f?{kind:'background' as const,path:layerReleasePath(r!.id)+'/'+part,sha256:f.sha256,bytes:f.bytes,width:f.width,height:f.height}:fanArt[part]]as const})}
export function originalBoundFanSheets(housing:string,rotor:string,assets?:OriginalAssetBindings){const r=originalFanRelease(assets);return layeredSheets('original-fan',housing,rotor,r?.housing.width??320,r?.housing.height??640,r?.spec??fanPartsSpec).map(s=>({...s,id:s.id+'-v1'}))}
