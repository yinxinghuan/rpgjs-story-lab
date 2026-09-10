import {RendererTransition} from './renderer-transition'
import {Direction} from '@rpgjs/common'
import {startGame,provideClientGlobalConfig,provideClientModules,provideRpg,type RpgClientEngine} from '@rpgjs/client'
import {createServer,provideServerModules,type RpgPlayer} from '@rpgjs/server'
import {provideTiledMap as tiledClient} from '@rpgjs/tiledmap/client'
import {provideTiledMap as tiledServer} from '@rpgjs/tiledmap/server'
import {WALK_SPEED,STRIDE_DISTANCE,walkingPose,moveWithCollision,advanceRoute} from './walking-motion'
export type RendererPoint={x:number;y:number}
type Position=RendererPoint
type SceneId=string
export type RpgRendererRuntime={position:()=>Position;renderedPosition:()=>Position|null;move:(x:number,y:number)=>void;walkTo:(p:Position,onArrival?:()=>void)=>boolean;pause:(v:boolean)=>void;restore:(p:Position,scene?:string)=>Promise<void>;scene:()=>string;renderedScene:()=>string|null;renderedEvents:()=>string[];destroy:()=>void}
export type RpgRendererOptions={host:HTMLElement;width:number;height:number;sceneIds:string[];initialScene:string;initialPosition:Position;heroGraphic:string;spritesheets:any[];mapEvents:(scene:string)=>any[];walkable:(p:Position,scene:string)=>boolean;safePosition:(p:Position,scene:string)=>Position;findPath:(start:Position,end:Position,scene:string)=>Position[];onReady:(runtime:RpgRendererRuntime)=>void;onPosition:(p:Position)=>void;onDestination:(p:Position|null)=>void;onEngine?:(engine:RpgClientEngine)=>void}
// This RPG-JS beta owns page-global providers. A second instance needs a page
// reload until complete provider/client disposal has been proven.
let created=false
export function createRpgRenderer(options:RpgRendererOptions){
 if(created)throw Error('RPG_RENDERER_ALREADY_CREATED')
 if(options.host.id!=='rpg'||!options.sceneIds.includes(options.initialScene)||!options.walkable(options.initialPosition,options.initialScene))throw Error('INVALID_RENDERER_BOOTSTRAP')
 created=true
 const {host,sceneIds,initialScene,initialPosition,walkable,safePosition,findPath,onReady:bindSpace,onPosition:reportPosition,onDestination:reportDestination}=options
let client:RpgClientEngine|undefined,player:RpgPlayer|undefined
let activeScene:SceneId=initialScene,changing=false,loadedScene:SceneId|null=null
let loadedMap:{events:()=>Record<string,unknown>}|null=null
const transitions=new RendererTransition<SceneId,Position>(initialScene,{
 changeMap:async(scene,p)=>Boolean(await player!.changeMap(scene,p)),
 teleport:async p=>player!.teleport(p),
 commit:(scene,p)=>{activeScene=scene;pos=p;player!.syncChanges();project();reportPosition(pos)},
})
let paused=true,stick={x:0,y:0},pos={...initialPosition},last=0,frame=0,strideDistance=0
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
const frameBox=host.parentElement!
// Logical world coordinates stay fixed; only the physical backing buffer grows.
// Render at the displayed CSS scale × device density, rather than enlarging a
// previously downsampled actor. Cap at ~6M pixels to bound the full-map buffer.
function renderResolution(){return Math.min(5.2,Math.max(1,Math.ceil(frameBox.clientWidth/options.width*(window.devicePixelRatio||1)*4)/4))}
function syncViewport(){const scale=frameBox.clientWidth/options.width;host.style.transform=`scale(${scale})`;frameBox.style.setProperty('--world-scale',String(scale));const renderer=client?.renderer,resolution=renderResolution();if(renderer&&Math.abs(renderer.resolution-resolution)>.001)renderer.resize(options.width,options.height,resolution)}
const resize=new ResizeObserver(syncViewport);resize.observe(frameBox)
window.addEventListener('resize',syncViewport)
const server=createServer({providers:[tiledServer(),provideServerModules([{player:{onJoinMap(p,map){player=p;p.setGraphic(options.heroGraphic);p.setHitbox(9,15);p.animationFixed=true;transitions.joinedScene(map.id.replace(/^map-/, '') as SceneId)},async onConnected(p){
 player=p;p.setGraphic(options.heroGraphic);p.setHitbox(9,15);p.animationFixed=true;await p.changeMap(initialScene,pos)
 bindSpace({position:()=>({...pos}),renderedPosition:()=>{const s=client?.getCurrentPlayer();return s?{x:s.x(),y:s.y()}:null},
  move:(x,y)=>{stick={x,y};if(x||y)cancelRoute()},walkTo:(p,callback)=>{if(paused||changing)return false;const path=findPath(pos,p,activeScene);if(!path.length)return false;route=path;arrive=callback;reportDestination(path[path.length-1]);return true},
  pause:v=>{paused=v;keys.clear();stick={x:0,y:0};if(v){cancelRoute();stand()}},
  scene:()=>activeScene,renderedScene:()=>loadedScene,renderedEvents:()=>Object.keys(loadedMap?.events()??{}),restore:async(p,scene=initialScene)=>{changing=true;cancelRoute();keys.clear();stick={x:0,y:0};stand();try{await transitions.restore(scene,safePosition(p,scene))}finally{changing=false}},
  destroy:()=>{transitions.dispose();cancelAnimationFrame(frame);resize.disconnect();window.removeEventListener('resize',syncViewport);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clearInput);document.removeEventListener('visibilitychange',visibilityChanged)}})
 }},maps:sceneIds.map(id=>({id,events:options.mapEvents(id)}))}])]})
startGame({providers:[provideClientGlobalConfig({prediction:{enabled:false},bootstrapCanvasOptions:{antialias:false,backgroundAlpha:0,autoDensity:true,resolution:renderResolution()}}),tiledClient({basePath:'./map'}),provideClientModules([{sceneMap:{onAfterLoading(map){const id=client?.activeRoom()?.name?.replace(/^map-/, '') as SceneId;if(sceneIds.includes(id)){loadedScene=id;loadedMap=map as unknown as {events:()=>Record<string,unknown>};transitions.loadedScene(id)}}},spritesheets:options.spritesheets,engine:{onStart(engine){client=engine;options.onEngine?.(engine);engine.width.set(String(options.width));engine.height.set(String(options.height));engine.stopProcessingInput=true;engine.renderer.background.alpha=0;syncViewport()}}}]),provideRpg(server)]})
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

}
