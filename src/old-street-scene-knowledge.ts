import type {StorySave} from './vendor/original-train/types'
import {oldStreetProjectedProps} from './old-street-space'
import {oldStreetPropState} from './old-street-prop-state'
/** Semantic states, shared with map labels. No image-derived appearance claims,
 * future rooms, hidden characters, save history or inventory are included. */
export function oldStreetSceneKnowledge(save:Pick<StorySave,'facts'|'locale'>,sceneId:string){
 return oldStreetProjectedProps(save).filter(p=>p.room===sceneId).flatMap(p=>{
  const label=oldStreetPropState(p.id,save)
  return label?[{id:'visible:'+p.id,text:save.locale==='zh'?`当前房间的物件状态：${label[0]}。`:`Object state in the current room: ${label[1]}.`}]:[]
 })
}
