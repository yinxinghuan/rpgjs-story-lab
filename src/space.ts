import { RendererTransition } from './renderer-transition'
import { Direction } from '@rpgjs/common'
import { startGame, provideClientGlobalConfig, provideClientModules, provideRpg, type RpgClientEngine } from '@rpgjs/client'
import { createServer, provideServerModules, type RpgPlayer } from '@rpgjs/server'
import { provideTiledMap as tiledClient } from '@rpgjs/tiledmap/client'
import { provideTiledMap as tiledServer } from '@rpgjs/tiledmap/server'
import { bindSpace, reportPosition, reportDestination } from './space-bridge'
import { SPAWN, walkable, safePosition, type Position } from './contract'
import { scenes,sceneIds,type SceneId } from './scene-layout'
import { findPath } from './pathfinding'
import {worldObjects,objectSheets,objectId,objectAnimation,type ObjectProjection} from './world-objects'
import {isBalancedArt} from './art-variant'
import { heroSheet,mechanicSheet,attendantSheet } from './sprite-config'
import { WALK_SPEED, STRIDE_DISTANCE, walkingPose, moveWithCollision, advanceRoute } from './walking-motion'
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
let client:RpgClientEngine|undefined,player:RpgPlayer|undefined
let activeScene:SceneId='carriage',changing=false,loadedScene:SceneId|null=null
let loadedMap:{events:()=>Record<string,unknown>}|null=null
const transitions=new RendererTransition<SceneId,Position>('carriage',{
 changeMap:async(scene,p)=>Boolean(await player!.changeMap(scene,p)),
 teleport:async p=>player!.teleport(p),
 commit:(scene,p)=>{activeScene=scene;pos=p;player!.syncChanges();project();reportPosition(pos)},
})
let paused=true,stick={x:0,y:0},pos={...SPAWN},last=0,frame=0,strideDistance=0
let route:Position[]=[],arrive:(()=>void)|undefined
const keys=new Set<string>()
function cancelRoute(){route=[];arrive=undefined;reportDestination(null)}
function project(){const sprite=client?.getCurrentPlayer();if(sprite&&player){if(sprite.x()!==pos.x)sprite.x.set(pos.x);if(sprite.y()!==pos.y)sprite.y.set(pos.y);if(sprite.direction()!==player.direction())sprite.direction.set(player.direction());sprite.animationFixed=true;if(sprite.animationName()!==player.animationName())sprite.animationName.set(player.animationName())}}
function stand(){strideDistance=0;if(player&&player.animationName()!=='stand')player.animationName.set('stand');project()}
const down=(e:KeyboardEvent)=>{if(!(e.target as HTMLElement)?.matches('input,textarea,select')){const key=e.key.toLowerCase();if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(key)){keys.add(key);cancelRoute();e.preventDefault()}}}
const up=(e:KeyboardEvent)=>keys.delete(e.key.toLowerCase())
window.addEventListener('keydown',down);window.addEventListener('keyup',up)
const clearInput=()=>{keys.clear();stick={x:0,y:0};cancelRoute();stand()}
const visibilityChanged=()=>{if(document.hidden)clearInput()}
window.addEventListener('blur',clearInput)
document.addEventListener('visibilitychange',visibilityChanged)
const host=document.getElementById('rpg')!,frameBox=host.parentElement!
// Logical coordinates stay 384×576; only the physical backing buffer grows.
// Render at the displayed CSS scale × device density, rather than enlarging a
// previously downsampled actor. Cap at ~6M pixels to bound the full-map buffer.
function renderResolution(){return Math.min(5.2,Math.max(1,Math.ceil(frameBox.clientWidth/384*(window.devicePixelRatio||1)*4)/4))}
function syncViewport(){const scale=frameBox.clientWidth/384;host.style.transform=`scale(${scale})`;frameBox.style.setProperty('--world-scale',String(scale));const renderer=client?.renderer,resolution=renderResolution();if(renderer&&Math.abs(renderer.resolution-resolution)>.001)renderer.resize(384,576,resolution)}
const resize=new ResizeObserver(syncViewport);resize.observe(frameBox)
window.addEventListener('resize',syncViewport)
const server=createServer({providers:[tiledServer(),provideServerModules([{player:{onJoinMap(p,map){player=p;p.setGraphic('hero');p.setHitbox(9,15);p.animationFixed=true;transitions.joinedScene(map.id.replace(/^map-/, '') as SceneId)},async onConnected(p){
 player=p;p.setGraphic('hero');p.setHitbox(9,15);p.animationFixed=true;await p.changeMap('carriage',pos)
 bindSpace({position:()=>({...pos}),renderedPosition:()=>{const s=client?.getCurrentPlayer();return s?{x:s.x(),y:s.y()}:null},
  move:(x,y)=>{stick={x,y};if(x||y)cancelRoute()},walkTo:(p,callback)=>{if(paused||changing)return false;const path=findPath(pos,p,activeScene);if(!path.length)return false;route=path;arrive=callback;reportDestination(path[path.length-1]);return true},
  pause:v=>{paused=v;keys.clear();stick={x:0,y:0};if(v){cancelRoute();stand()}},
  setObjects,scene:()=>activeScene,renderedScene:()=>loadedScene,renderedEvents:()=>Object.keys(loadedMap?.events()??{}),restore:async(p,scene='carriage')=>{changing=true;cancelRoute();keys.clear();stick={x:0,y:0};stand();try{await transitions.restore(scene,safePosition(p,scene))}finally{changing=false}},
  destroy:()=>{transitions.dispose();cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('resize',syncViewport);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clearInput);document.removeEventListener('visibilitychange',visibilityChanged)}})
 }},maps:sceneIds.map(id=>({id,events:[...objectEvents(id),...(scenes[id].npc&&scenes[id].resident?[{id:scenes[id].resident!.id,x:scenes[id].npc!.x-4.5,y:scenes[id].npc!.y-15,event:{onInit(this:RpgPlayer){this.setGraphic(scenes[id].resident!.graphic);this.setHitbox(9,15)}}}]:[])]}))}])]})
startGame({providers:[provideClientGlobalConfig({prediction:{enabled:false},bootstrapCanvasOptions:{antialias:false,backgroundAlpha:0,autoDensity:true,resolution:renderResolution()}}),tiledClient({basePath:'./map'}),provideClientModules([{sceneMap:{onAfterLoading(map){const id=client?.activeRoom()?.name?.replace(/^map-/, '') as SceneId;if(sceneIds.includes(id)){loadedScene=id;loadedMap=map as unknown as {events:()=>Record<string,unknown>};transitions.loadedScene(id)}}},spritesheets:[heroSheet,mechanicSheet,attendantSheet,...objectSheets(isBalancedArt?'balanced':'baseline')],engine:{onStart(engine){client=engine;if(__QA_PERFORMANCE__)void import('../_qa/performance-probe').then(m=>m.attachPerformanceProbe(engine));engine.width.set('384');engine.height.set('576');engine.stopProcessingInput=true;engine.renderer.background.alpha=0;syncViewport()}}}]),provideRpg(server)]})
function tick(time:number){
 const dt=Math.min((time-last)/1000,.04);last=time
 if(player&&!paused&&!changing){
  let x=stick.x+(keys.has('arrowright')||keys.has('d')?1:0)-(keys.has('arrowleft')||keys.has('a')?1:0)
  let y=stick.y+(keys.has('arrowdown')||keys.has('s')?1:0)-(keys.has('arrowup')||keys.has('w')?1:0)
  const len=Math.hypot(x,y);if(len>1){x/=len;y/=len}
  let distance=0,finished=false
  const canWalk=(p:Position)=>walkable(p,activeScene)
  if(!x&&!y&&route.length){
   const result=advanceRoute(pos,route,WALK_SPEED*dt,canWalk)
   pos=result.position;distance=result.distance;x=result.direction.x;y=result.direction.y
   route.splice(0,result.consumed);finished=result.arrived
   if(result.blocked)cancelRoute()
  }else if(x||y){
   const result=moveWithCollision(pos,{x:x*WALK_SPEED*dt,y:y*WALK_SPEED*dt},canWalk)
   x=result.position.x-pos.x;y=result.position.y-pos.y;pos=result.position;distance=result.distance
  }
  if(distance>1e-7){
   strideDistance=(strideDistance+distance)%STRIDE_DISTANCE
   const pose=walkingPose(strideDistance)
   if(player.animationName()!==pose)player.animationName.set(pose)
   player.direction.set(Math.abs(x)>Math.abs(y)?(x>0?Direction.Right:Direction.Left):(y>0?Direction.Down:Direction.Up))
   void player.teleport(pos);player.syncChanges();reportPosition(pos)
  }else stand()
  if(finished){const fn=arrive;arrive=undefined;reportDestination(null);stand();fn?.()}
 }
 project();frame=requestAnimationFrame(tick)
}
frame=requestAnimationFrame(tick)
