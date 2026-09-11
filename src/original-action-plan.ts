import type {OriginalAssetBindings} from './original-asset-releases'
import {assertOriginalAssetBindings} from './original-asset-releases'
import {originalTrainChapterSpatialPlan} from './original-train-spatial-plan'
export type OriginalActionPlan={status:'prepared'|'committed';sessionId:string;action_id:string;expected_version:number;sceneId:string;destinationScene:string;mapVersion:string;resolvedActionId:string;assets?:OriginalAssetBindings}
const world=originalTrainChapterSpatialPlan()
export function assertOriginalActionPlan(value:any,body:Record<string,any>,id:string):asserts value is OriginalActionPlan{
 const p=value as OriginalActionPlan
 assertOriginalAssetBindings(p?.assets)
 const entity=world.entities.find(e=>e.id===body.target&&e.scene===body.sceneId)
 if(!p||!['prepared','committed'].includes(p.status)||p.sessionId!==id||p.action_id!==body.action_id||p.expected_version!==body.expected_version||p.sceneId!==body.sceneId||p.mapVersion!==world.mapVersion||!entity?.actions.includes(p.resolvedActionId)||!world.scenes.some(s=>s.id===p.destinationScene)||p.destinationScene!==p.sceneId&&!world.portals.some(portal=>portal.fromScene===p.sceneId&&portal.scene===p.destinationScene&&portal.actionId===p.resolvedActionId))throw Error('PREPARATION_RESPONSE_MISMATCH')
}
