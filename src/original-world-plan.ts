import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
import {originalSceneBackgroundVersion,type OriginalAssetBindings} from './original-asset-releases'
import {originalEnvironmentLayouts} from './original-environment-layouts'
import type {SpatialBindingDefinition} from './spatial-binding'
type Entity=SpatialBindingDefinition['entities'][number]
/** Image-specific placement, retaining stable identity, actions and story rules. */
export function originalEntityLayout(assets:OriginalAssetBindings|undefined,e:Entity):Entity{
 const id=originalSceneBackgroundVersion(assets,e.scene),change=id?originalEnvironmentLayouts[id]?.entities?.[e.id]:undefined
 return change?{...e,position:{...change.position},approach:{...change.approach}}:e
}
export function originalBoundWorldPlan(assets?:OriginalAssetBindings){const world=originalTrainChapterSpatialPlan();world.entities=world.entities.map(e=>originalEntityLayout(assets,e));return world}
