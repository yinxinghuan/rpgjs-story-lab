import {OldStreetBuildingEdges,OldStreetEntranceEaves} from '../src/old-street-boundaries'
import React,{useEffect,useRef,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {createRpgRenderer,type RpgRendererRuntime} from '../src/rpg-renderer'
import {actorSheet} from '../src/actor-sheet'
import {actorArt} from '../src/art-catalog'
import {oldStreetBody,oldStreetHeroScale,oldStreetStride,oldStreetFloors,oldStreetDoors,oldStreetWalkable,oldStreetSafePosition} from '../src/old-street-space'
import {oldStreetInteriorRooms} from '../src/old-street-room-walls'
import {OldStreetFloor} from '../src/old-street-floor'
import {OldStreetRoomWalls,OldStreetRoomForeground} from '../src/old-street-room-walls-view'
import {OldStreetDoorways} from '../src/old-street-door-view'
import {oldStreetEnvironmentArt as art} from '../src/old-street-environment-art'
import {findGridPath} from '../src/grid-path'
import type {OldStreetRoom} from '../src/old-street-cartridge'
const reviewRooms:OldStreetRoom[]=['street','yard','roof',...oldStreetInteriorRooms]
const facts={'darkroom-ready':true,'archive-ready':true},save={facts},initial='laundry',foot=(room:OldStreetRoom)=>{const f=oldStreetFloors[room];return{x:f.x+40,y:f.y+f.h-oldStreetBody.h-2}}
function Review(){
 const [room,setRoom]=useState<OldStreetRoom>(initial),[walls,setWalls]=useState(true),[ready,setReady]=useState(false),[pos,setPos]=useState(foot(initial)),[width,setWidth]=useState(Math.min(innerWidth,440)),runtime=useRef<RpgRendererRuntime>()
 useEffect(()=>{const resize=()=>setWidth(Math.min(innerWidth,440));window.addEventListener('resize',resize);const hero=actorArt.balanced.hero
 createRpgRenderer({host:document.getElementById('rpg')!,width:384,height:576,sceneIds:reviewRooms,mapIds:Object.fromEntries(reviewRooms.map(r=>[r,'oldstreet-'+r])),initialScene:initial,initialPosition:foot(initial),heroGraphic:'hero',heroBody:oldStreetBody,strideLength:oldStreetStride,spritesheets:[actorSheet('hero',hero.path,hero.width,hero.height,hero.baselines,oldStreetHeroScale,hero.centers,{x:8,y:26})],mapEvents:()=>[],walkable:(p,r)=>oldStreetWalkable(r,p,save),safePosition:(p,r)=>oldStreetSafePosition(r,p,save),findPath:(a,b,r)=>findGridPath(a,b,p=>oldStreetWalkable(r,p,save)),onPosition:setPos,onDestination:()=>{},onReady:r=>{runtime.current=r;r.pause(false);setReady(true)}})
 return()=>{runtime.current?.destroy();window.removeEventListener('resize',resize)}
 },[])
 const change=async(next:OldStreetRoom)=>{setReady(false);await runtime.current?.restore(foot(next),next);setRoom(next);setReady(true)}
 const doorway=oldStreetDoors().find(d=>d.room===room&&d.side==='S')
 return <main><header style={{padding:8,display:'flex',flexWrap:'wrap',gap:8}}><label>Room <select disabled={!ready} value={room} onChange={e=>void change(e.target.value as OldStreetRoom)}>{reviewRooms.map(r=><option key={r}>{r}</option>)}</select></label><label><input type="checkbox" checked={walls} onChange={e=>setWalls(e.target.checked)}/>Walls</label><button disabled={!ready} onClick={()=>runtime.current?.walkTo({...foot(room),x:foot(room).x+32})}>Walk along wall</button><button disabled={!ready||!doorway} onClick={()=>void runtime.current?.restore({x:doorway!.position.x-8,y:oldStreetFloors[room].y+oldStreetFloors[room].h-28},room)}>Stand in doorway</button><button disabled={!ready} onClick={()=>void runtime.current?.restore(foot(room),room)}>Stand by wall</button></header><p style={{margin:8}}>Synthetic renderer · {room} · {Math.round(pos.x)},{Math.round(pos.y)} · {ready?'ready':'loading'}</p><div style={{width,height:width*1.5,position:'relative',margin:'auto',overflow:'hidden'}} onPointerDown={e=>{const box=e.currentTarget.getBoundingClientRect();runtime.current?.walkTo({x:(e.clientX-box.left)*384/width,y:(e.clientY-box.top)*384/width})}}>
 <svg viewBox="0 0 384 576" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none'}}><OldStreetBuildingEdges room={room}/><OldStreetFloor room={room} pixelShop compositeShop/>{walls&&<OldStreetRoomWalls room={room} facts={facts} compositeShop/>}<OldStreetDoorways room={room} facts={facts} woodImage={art.doorWood} stoneImage={art.stoneStair}/></svg>
 <div id="rpg" style={{position:'absolute',width:384,height:576,transformOrigin:'top left',pointerEvents:'none',zIndex:1}}/>
 {walls&&<svg viewBox="0 0 384 576" style={{position:'absolute',inset:0,width:'100%',height:'100%',pointerEvents:'none',zIndex:2}}><OldStreetRoomForeground room={room} facts={facts} actor={pos}/><OldStreetEntranceEaves room={room} image={art.streetEdges} variants={art.roofVariants}/></svg>}
 </div></main>
}
createRoot(document.getElementById('root')!).render(<Review/>);
