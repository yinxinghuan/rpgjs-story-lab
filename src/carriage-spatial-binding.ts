import {compileSpatialBinding,type SpatialBindingDefinition} from './spatial-binding'
import {entities,MAP_VERSION,walkable,type EntityId} from './contract'
import {scenes,sceneIds,approachPoints,portalArrivals,type SceneId} from './scene-layout'
import {DISPATCHER} from './contacts'
import type {StoryCartridge} from './vendor/story/types'
/** Exported from runtime configuration, never a separately maintained QA world. */
export function carriageSpatialDefinition():SpatialBindingDefinition{return {
 version:1,cartridgeId:'carriage-07',mapVersion:MAP_VERSION,interactionDistance:70,
 scenes:sceneIds.map(id=>({id,spawn:{...scenes[id].spawn}})),
 entities:(Object.keys(entities) as EntityId[]).map(id=>({id,scene:entities[id].scene,position:{x:entities[id].x,y:entities[id].y},approach:{...approachPoints[id]},states:entities[id].states,actions:entities[id].actions})),
 portals:Object.entries(portalArrivals).map(([actionId,p])=>({actionId,scene:p.scene,position:{...p.position}})),
 characters:[{id:'lin',kind:'physical',entities:['lin']},{id:'zhou-yu',kind:'physical',entities:['zhou-yu']},{id:DISPATCHER,kind:'mediated',entities:['radio','callpoint']}],
}}
export const bindCarriageStory=(story:StoryCartridge)=>compileSpatialBinding(story,carriageSpatialDefinition(),(scene,p)=>walkable(p,scene as SceneId))
