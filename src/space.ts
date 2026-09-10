import type {RpgPlayer} from '@rpgjs/server'
import {createRpgRenderer} from './rpg-renderer'
import {bindSpace,reportPosition,reportDestination} from './space-bridge'
import {SPAWN,walkable,safePosition} from './contract'
import {scenes,sceneIds,type SceneId} from './scene-layout'
import {findPath} from './pathfinding'
import {worldObjects,objectSheets,objectId,objectAnimation,type ObjectProjection} from './world-objects'
import {isBalancedArt} from './art-variant'
import {heroSheet,mechanicSheet,attendantSheet} from './sprite-config'
const artEvents=new Map<string,RpgPlayer>(),artProjection=new Map<string,ObjectProjection>()
// RPG-JS sorts characters by y + hitbox.h. Art events use a 1px nonblocking
// hitbox and a bottom-anchored crop; collision continues to use scene-layout.
function applyObject(event:RpgPlayer,projection:ObjectProjection){
 // Keep one stable graphic: this beta renderer can lose nodes when graphics arrays change.
 if(event.graphics()[0]!==projection.id)event.setGraphic(projection.id)
 event.animationFixed=true
 const animation=objectAnimation(projection)
 if(event.animationName()!==animation)event.animationName.set(animation)
 if(event.tint()!==projection.tint)event.tint.set(projection.tint)
 event.syncChanges()
}
function setObjects(scene:SceneId,objects:ObjectProjection[]){for(const object of objects){if(!object.id.startsWith('art-'+scene+'-'))continue;artProjection.set(object.id,object);const event=artEvents.get(object.id);if(event)applyObject(event,object)}}
function objectEvents(scene:SceneId){return worldObjects[scene].map(object=>{const id=objectId(scene,object.id);return {id,x:Math.round(object.rect.x+object.rect.w/2),y:object.depth-1,event:{onInit(this:RpgPlayer){this.setHitbox(1,1);this.through=true;artEvents.set(id,this);applyObject(this,artProjection.get(id)??{id,state:object.states[0],visible:!object.parent,tint:'#d4d4d4'})}}}})}
declare const __QA_PERFORMANCE__:boolean
createRpgRenderer({host:document.getElementById('rpg')!,width:384,height:576,sceneIds,initialScene:'carriage',initialPosition:SPAWN,heroGraphic:'hero',spritesheets:[heroSheet,mechanicSheet,attendantSheet,...objectSheets(isBalancedArt?'balanced':'baseline')],
 walkable:(p,s)=>walkable(p,s as SceneId),safePosition:(p,s)=>safePosition(p,s as SceneId),findPath:(a,b,s)=>findPath(a,b,s as SceneId),
 mapEvents:scene=>{const id=scene as SceneId,s=scenes[id];return [...objectEvents(id),...(s.npc&&s.resident?[{id:s.resident.id,x:s.npc.x-4.5,y:s.npc.y-15,event:{onInit(this:RpgPlayer){this.setGraphic(s.resident!.graphic);this.setHitbox(9,15)}}}]:[])]},
 onPosition:reportPosition,onDestination:reportDestination,
 onReady:runtime=>bindSpace({...runtime,setObjects,scene:()=>runtime.scene() as SceneId,renderedScene:()=>runtime.renderedScene() as SceneId|null}),
 onEngine:engine=>{if(__QA_PERFORMANCE__)void import('../_qa/performance-probe').then(m=>m.attachPerformanceProbe(engine))},
})
