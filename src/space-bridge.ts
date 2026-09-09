import type {ObjectProjection} from './world-objects'
import type {SceneId} from './scene-layout'
import type { Position } from './contract'
export type SpaceRuntime={position:()=>Position;renderedPosition:()=>Position|null;move:(x:number,y:number)=>void;walkTo:(p:Position,onArrival?:()=>void)=>boolean;pause:(paused:boolean)=>void;restore:(p:Position,scene?:SceneId)=>Promise<void>;scene:()=>SceneId;renderedScene:()=>SceneId|null;renderedEvents:()=>string[];setObjects:(scene:SceneId,objects:ObjectProjection[])=>void;destroy:()=>void}
let runtime:SpaceRuntime|null=null
const listeners=new Set<(p:Position)=>void>()
export function bindSpace(value:SpaceRuntime){runtime=value;window.dispatchEvent(new CustomEvent('space-ready',{detail:value}))}
export function getSpace(){return runtime}
export function reportPosition(p:Position){listeners.forEach(fn=>fn(p))}
export function onPosition(fn:(p:Position)=>void){listeners.add(fn);return ()=>{listeners.delete(fn)}}

const destinationListeners=new Set<(p:Position|null)=>void>()
export function reportDestination(p:Position|null){destinationListeners.forEach(fn=>fn(p))}
export function onDestination(fn:(p:Position|null)=>void){destinationListeners.add(fn);return()=>{destinationListeners.delete(fn)}}
