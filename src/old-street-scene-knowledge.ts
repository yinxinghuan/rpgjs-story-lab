import {roofRecoveryKnowledge} from './old-street-roof-recovery'
import {oldStreetFurniture} from './old-street-furniture'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetProjectedProps} from './old-street-space'
import {oldStreetPropState} from './old-street-prop-state'
/** Semantic states, shared with map labels. No image-derived appearance claims,
 * future rooms, hidden characters, save history or inventory are included. */
export function oldStreetSceneKnowledge(save:Pick<StorySave,'facts'|'locale'>,sceneId:string){
 return [...roofRecoveryKnowledge(save,sceneId),...oldStreetFurniture.filter(p=>p.room===sceneId).map(p=>({id:'scenery:'+p.id,text:p.description[save.locale==='zh'?0:1]})),...oldStreetProjectedProps(save).filter(p=>p.room===sceneId).flatMap(p=>{
  const label=oldStreetPropState(p.id,save)
  return label?[{id:'visible:'+p.id,text:save.locale==='zh'?`当前房间的物件状态：${label[0]}。`:`Object state in the current room: ${label[1]}.`}]:[]
 })]
}
