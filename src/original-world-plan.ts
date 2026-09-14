import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import {originalSceneBackgroundVersion,type OriginalAssetBindings} from './original-asset-releases'
import {originalEnvironmentWalkable,originalEnvironmentLayouts} from './original-environment-layouts'
import type {SpatialBindingDefinition} from './spatial-binding'
type Entity=SpatialBindingDefinition['entities'][number]
/** Image-specific placement, retaining stable identity, actions and story rules. */
export function originalEntityLayout(assets:OriginalAssetBindings|undefined,e:Entity):Entity{
 const id=originalSceneBackgroundVersion(assets,e.scene),change=id?originalEnvironmentLayouts[id]?.entities?.[e.id]:undefined
 return change?{...e,position:{...change.position},approach:{...change.approach}}:e
}
export function originalBoundWorldPlan(assets?:OriginalAssetBindings,companionPositions?:Record<string,{x:number;y:number}>,sceneId?:string){
 const world=originalTrainChapterSpatialPlan()
 world.entities=world.entities.map(e=>{
  const placed=originalEntityLayout(assets,e),person=world.characters.find(c=>c.entities.includes(e.id)),p=person&&e.scene===sceneId?companionPositions?.[person.id]:undefined
  if(!p)return placed
  const background=originalSceneBackgroundVersion(assets,e.scene)
  const approach=[{x:p.x,y:p.y+28},{x:p.x,y:p.y-16},{x:p.x+20,y:p.y},{x:p.x-16,y:p.y}].find(q=>originalEnvironmentWalkable(background,e.scene,q)&&Object.entries(companionPositions??{}).every(([id,other])=>id===person?.id||!(q.x+9>other.x&&q.x<other.x+9&&q.y+15>other.y&&q.y<other.y+15)))
  return {...placed,position:{x:p.x+4.5,y:p.y+15},approach:approach??{x:p.x,y:p.y+28}}
 })
 return world
}
