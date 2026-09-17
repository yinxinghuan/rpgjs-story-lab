import {useId} from 'react'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetEnvironmentArt,type OldStreetEnvironmentArt} from './old-street-environment-art'
import {oldStreetRoomWalls,roomWallSize,oldStreetWallReveal} from './old-street-room-walls'
import {OldStreetShopEnvironment} from './old-street-shop-environment'
import {OldStreetPhotoEnvironment} from './old-street-photo-environment'
import {OldStreetShedEnvironment} from './old-street-shed-environment'
import {oldStreetShopWallRegions} from './old-street-shop-environment-layout'
const palettes:Record<string,{face:string;cap:string;edge:string;trim:string}>={
 shop:{face:'#797660',cap:'#b2a586',edge:'#514b3d',trim:'#67533a'},
 laundry:{face:'#8b957e',cap:'#b1b59a',edge:'#58614f',trim:'#69765f'},
 photo:{face:'#929881',cap:'#b8b49b',edge:'#565e50',trim:'#6a563e'},
 shed:{face:'#7c8268',cap:'#aba78a',edge:'#4c5544',trim:'#66543d'},
 cellar:{face:'#717668',cap:'#9a9b85',edge:'#454e45',trim:'#525d51'},
 darkroom:{face:'#616b61',cap:'#939889',edge:'#3c4943',trim:'#4b554b'},
 archive:{face:'#888b74',cap:'#b2aa8b',edge:'#535b4c',trim:'#736348'},
}
type Props={room:OldStreetRoom;facts:StorySave['facts'];art?:OldStreetEnvironmentArt;compositeShop?:boolean;actor?:{x:number;y:number}}
/** Static north/side architecture is behind the sortable RPG scene. */
export function OldStreetRoomWalls({room,facts,art=oldStreetEnvironmentArt,compositeShop=false}:Props){
 const walls=oldStreetRoomWalls(room,facts);if(!walls)return null
 const {floor:f,north,west,east}=walls,s=roomWallSize,p=palettes[room]
 return <g data-room-walls={room}>
  {north.map((r,i)=><g key={i}>
   <rect x={r.start} y={f.y-s.back} width={r.length} height={s.back} fill={p.face}/>
   {/* Only the undecorated left strip of the admitted plaster sheet; no copied camera/tool fixtures. */}
   {['laundry','cellar','darkroom','archive'].includes(room)&&<svg x={r.start} y={f.y-s.back} width={r.length} height={s.back} viewBox="8 16 30 216" preserveAspectRatio="none" overflow="hidden" opacity=".28"><image href={art.photoWall} width="768" height="256" style={{imageRendering:'pixelated'}}/></svg>}
  </g>)}
  {room==='shop'&&(compositeShop?<g>{oldStreetShopWallRegions().map((r,i)=><svg key={i} x={r.x} y={r.y} width={r.width} height={r.height} viewBox={`${i===0?90:474} 28 ${i===0?184:215} ${(i===0?184:215)*r.height/r.width}`} preserveAspectRatio="none" overflow="hidden"><image href={art.shopComposite} width="768" height="1152" style={{imageRendering:'pixelated'}}/></svg>)}</g>:<OldStreetShopEnvironment image={art.shopWall}/>)}
  {room==='photo'&&<OldStreetPhotoEnvironment image={art.photoWall}/>}
  {room==='shed'&&<OldStreetShedEnvironment image={art.shedWall}/>}
  {north.map((r,i)=><g key={'trim'+i}>
   <rect x={r.start} y={f.y-s.back} width={r.length} height={s.thickness} fill={p.cap}/>
   <path d={`M${r.start} ${f.y-s.back+1}h${r.length}`} stroke={p.edge}/>
   <rect x={r.start} y={f.y-5} width={r.length} height="5" fill={p.trim}/>
   <path d={`M${r.start} ${f.y-5}h${r.length}`} stroke={p.cap}/>
   <rect x={r.start} y={f.y} width={r.length} height="5" fill="#151f1b" opacity=".16"/>
   {room==='laundry'&&<path d={`M${r.start} ${f.y-20}h${r.length}M${r.start} ${f.y-32}h${r.length}`} stroke={p.edge} opacity=".35"/>}
  </g>)}
  {[{x:f.x-s.thickness,rows:west},{x:f.x+f.w,rows:east}].map(({x,rows},side)=><g key={side}>
   <rect x={x} y={f.y-s.back} width={s.thickness} height={s.back} fill={p.cap}/>
   {rows.map((r,i)=><g key={i}><rect x={x} y={r.start} width={s.thickness} height={r.length} fill={p.cap}/><path d={`M${x+(side===0?s.thickness:0)} ${r.start}v${r.length}`} stroke={p.edge} strokeWidth="2"/><path d={`M${x+3} ${r.start}v${r.length}`} stroke={p.face}/></g>)}
  </g>)}
 </g>
}
/** Equal-height foreground wall, with a small actor-following visibility window. */
export function OldStreetRoomForeground({room,facts,art=oldStreetEnvironmentArt,actor}:Props){
 const id=useId().replace(/:/g,''),reveal=oldStreetWallReveal(room,facts,actor)
 const walls=oldStreetRoomWalls(room,facts);if(!walls)return null
 const {floor:f,south}=walls,s=roomWallSize,p=palettes[room],top=f.y+f.h-s.foreground
 return <g data-room-foreground={room}>
  <defs><radialGradient id={id+'fade'}><stop offset="0" stopColor="black" stopOpacity=".8"/><stop offset=".58" stopColor="black" stopOpacity=".8"/><stop offset="1" stopColor="black" stopOpacity="0"/></radialGradient><mask id={id+'mask'} maskUnits="userSpaceOnUse" x="0" y="0" width="384" height="576"><rect width="384" height="576" fill="white"/>{reveal&&<circle cx={reveal.x} cy={reveal.y} r={reveal.radius} fill={`url(#${id}fade)`}/>}</mask></defs>
  <g mask={`url(#${id}mask)`}>{south.map((r,i)=><g key={i}>
  <rect x={r.start} y={top} width={r.length} height={s.foreground+s.thickness} fill={p.face}/>
  <rect x={r.start} y={top} width={r.length} height={s.thickness} fill={p.cap}/>
  <svg x={r.start} y={top+s.thickness} width={r.length} height={s.foreground} viewBox="8 176 236 56" preserveAspectRatio="none" overflow="hidden" opacity=".2"><image href={art.photoWall} width="768" height="256" style={{imageRendering:'pixelated'}}/></svg>
  <path d={`M${r.start} ${top}h${r.length}M${r.start} ${f.y+f.h+s.thickness}h${r.length}`} stroke={p.edge} strokeWidth="2"/>
  <path d={`M${r.start+1} ${top+2}h${Math.max(0,r.length-2)}`} stroke="#d0c6a4" opacity=".5"/>
  <path d={`M${r.start} ${top+s.thickness}h${r.length}`} stroke={p.edge}/>
  <rect x={r.start} y={f.y+f.h+4} width={r.length} height="4" fill={p.trim}/>
  {/* Short end faces make a doorway read as a cut through a wall. */}
  <path d={`M${r.start} ${top}v${s.foreground+s.thickness}M${r.start+r.length} ${top}v${s.foreground+s.thickness}`} stroke={p.edge} strokeWidth="2"/>
 </g>)}</g></g>
}
