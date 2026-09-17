import React,{useId} from 'react'
import {OldStreetFloor} from '../src/old-street-floor'
import {OldStreetRoomWalls,OldStreetRoomForeground} from '../src/old-street-room-walls-view'
import {OldStreetBuildingEdges,OldStreetEntranceEaves} from '../src/old-street-boundaries'
import {oldStreetEnvironmentArt as art} from '../src/old-street-environment-art'
import {oldStreetDoors} from '../src/old-street-space'
import {OldStreetEntranceArt} from '../src/old-street-entrance-art'
export type Side='W'|'E'|'N'|'S'
type Door=ReturnType<typeof oldStreetDoors>[number]
export type EntranceOption={id:string;title:string;front:string;side:string;note:string;scale?:number;leafForeground?:{x:number;y:number;width:number;height:number}}
const hero=new URL('./art/overhead/hero-gait-v2.png',document.baseURI).href
function Hero({x,y,side}:{x:number;y:number;side:Side}){const row={N:3,S:0,W:1,E:2}[side];return <svg x={x-181*.24} y={y-330*.24} width={362*.24} height={362*.24} viewBox={`362 ${row*362} 362 362`} overflow="hidden"><image href={hero} width="1086" height="1448" style={{imageRendering:'pixelated'}}/></svg>}
function Candidate({option,door:d,foreground=false,closed=false}:{option:EntranceOption;door:Door;foreground?:boolean;closed?:boolean}){
 const id=useId().replace(/:/g,''),side=d.side==='W'||d.side==='E'
 if(foreground&&(side||d.side!=='S'))return null
 const scale=side?(option.id==='A'?.22:.17):(option.scale??.22),rotation=side?(d.side==='W'?-90:90):0
 const base=side?0:d.side==='S'?8:0,source=side?option.side:option.front
 return <g data-option={option.id} transform={`translate(${d.position.x} ${d.position.y+base}) rotate(${rotation}) scale(${scale})`}>
  <defs><clipPath id={id}><rect x="0" y="0" width="384" height="442"/>{!closed&&<rect {...(option.leafForeground??{x:240,y:400,width:100,height:110})}/>}</clipPath></defs>
  <g transform={`translate(-192 ${side?-256:-450})`}><g clipPath={foreground?`url(#${id})`:undefined}><svg width="384" height="512" viewBox={`${side?0:closed?0:384} 0 384 512`} overflow="hidden"><image href={source} width="768" height="512" style={{imageRendering:'pixelated'}}/></svg></g></g>
 </g>
}
export function Scene({option,side,walls,baseline,closed=false}:{option:EntranceOption;side:Side;walls:boolean;baseline:boolean;closed?:boolean}){
 const room=side==='W'||side==='E'?'street':'shop',d=oldStreetDoors().find(d=>d.room===room&&d.side===side)!,{x,y}=d.position
 const foot=side==='W'?{x:x+40,y:y+16}:side==='E'?{x:x-40,y:y+16}:side==='N'?{x,y:y+55}:{x,y:y-25}
 const view=side==='W'?`${x-54} ${y-72} 138 148`:side==='E'?`${x-84} ${y-72} 138 148`:`${x-69} ${y-98} 138 148`
 return <svg className="scene" viewBox={view} aria-label={`${option.id} ${option.title} ${side} 场景对照`}>
  <rect width="384" height="576" fill="#25302d"/>
  {walls&&<OldStreetBuildingEdges room={room}/>}<OldStreetFloor room={room} pixelShop compositeShop/>
  {baseline?<OldStreetEntranceArt door={d} closed={closed} art={art}/>:<Candidate option={option} door={d} closed={closed}/>}
  {walls&&<OldStreetRoomWalls room={room} facts={{}} compositeShop/>}
  <Hero {...foot} side={side}/>
  {baseline?<OldStreetEntranceArt door={d} closed={closed} art={art} foreground/>:<Candidate option={option} door={d} closed={closed} foreground/>}
  {walls&&<><OldStreetRoomForeground room={room} facts={{}}/><OldStreetEntranceEaves room={room} image={art.streetEdges}/></>}
 </svg>
}
