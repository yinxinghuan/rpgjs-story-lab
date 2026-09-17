import {OldStreetSidePassage,OldStreetSideDoorLeaf} from './old-street-side-passage'
import {roomSidePassages} from './old-street-side-door-layout'
import {useId} from 'react'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetEnvironmentArt,type OldStreetEnvironmentArt} from './old-street-environment-art'
import {oldStreetRoomWalls,oldStreetWallReveal} from './old-street-room-walls'
import {OldStreetShopEnvironment} from './old-street-shop-environment'
import {OldStreetPhotoEnvironment} from './old-street-photo-environment'
import {OldStreetShedEnvironment} from './old-street-shed-environment'
import {oldStreetShopWallRegions} from './old-street-shop-environment-layout'
const palettes:Record<string,{face:string;cap:string;edge:string;trim:string}>={
 street:{face:'#8e8d75',cap:'#b4ac8e',edge:'#545f4d',trim:'#6d7159'},
 yard:{face:'#8f9075',cap:'#b9b195',edge:'#555f4d',trim:'#6c745d'},
 roof:{face:'#7d8981',cap:'#aeb4a4',edge:'#45564f',trim:'#606e65'},
 shop:{face:'#797660',cap:'#b2a586',edge:'#514b3d',trim:'#67533a'},
 laundry:{face:'#8b957e',cap:'#b1b59a',edge:'#58614f',trim:'#69765f'},
 photo:{face:'#929881',cap:'#b8b49b',edge:'#565e50',trim:'#6a563e'},
 shed:{face:'#7c8268',cap:'#aba78a',edge:'#4c5544',trim:'#66543d'},
 cellar:{face:'#717668',cap:'#9a9b85',edge:'#454e45',trim:'#525d51'},
 darkroom:{face:'#616b61',cap:'#939889',edge:'#3c4943',trim:'#4b554b'},
 archive:{face:'#888b74',cap:'#b2aa8b',edge:'#535b4c',trim:'#736348'},
}
type Props={room:OldStreetRoom;facts:StorySave['facts'];art?:OldStreetEnvironmentArt;compositeShop?:boolean;actor?:{x:number;y:number};locale?:'zh'|'en'}
/** Static north/side architecture is behind the sortable RPG scene. */
export function OldStreetRoomWalls({room,facts,art=oldStreetEnvironmentArt,compositeShop=false,actor,locale='zh'}:Props){
 const passages=roomSidePassages(room,facts),walls=oldStreetRoomWalls(room,facts);if(!walls)return null
 const {floor:f,north,west,east}=walls,s=walls.size,p=palettes[room]
 return <g data-room-walls={room}>
  {north.map((r,i)=><g key={i}>
   <rect x={r.start} y={f.y-s.back} width={r.length} height={s.back} fill={p.face}/>
   {walls.outdoor&&<OutdoorMasonry x={r.start} y={f.y-s.back+s.thickness} width={r.length} height={s.back-s.thickness} image={art.stoneStair}/>}
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
   {rows.map((r,i)=>passages.some(d=>d.side===(side===0?'W':'E'))?<SideWallSegment key={i} x={x} start={r.start} length={r.length} width={s.thickness} height={s.foreground} palette={p} art={art} endFace={i<rows.length-1}/>:<g key={i}><rect x={x} y={r.start} width={s.thickness} height={r.length} fill={p.cap}/><path d={`M${x+(side===0?s.thickness:0)} ${r.start}v${r.length}`} stroke={p.edge} strokeWidth="2"/><path d={`M${x+3} ${r.start}v${r.length}`} stroke={p.face}/></g>)}
  </g>)}
  {passages.map(door=><g key={door.id}><OldStreetSidePassage door={door} art={art}/><OldStreetSideDoorLeaf door={door} art={art} closed={Boolean(door.gate&&!facts[door.gate])} actor={actor} locale={locale}/></g>)}
 </g>
}
/** Equal-height foreground wall, with a small actor-following visibility window. */
export function OldStreetRoomForeground({room,facts,art=oldStreetEnvironmentArt,actor,locale='zh'}:Props){
 const id=useId().replace(/:/g,''),reveal=oldStreetWallReveal(room,facts,actor)
 const passages=roomSidePassages(room,facts),walls=oldStreetRoomWalls(room,facts);if(!walls)return null
 const {floor:f,south}=walls,s=walls.size,p=palettes[room],top=f.y+f.h-s.foreground
 return <g data-room-foreground={room}>
  {passages.map(door=><OldStreetSidePassage key={door.id} door={door} art={art} foreground/>)}
  {passages.map(door=><OldStreetSideDoorLeaf key={door.id} door={door} art={art} closed={Boolean(door.gate&&!facts[door.gate])} actor={actor} locale={locale} foreground/>)}
  {([{side:'W',x:f.x-s.thickness,rows:walls.west},{side:'E',x:f.x+f.w,rows:walls.east}]).filter(v=>passages.some(d=>d.side===v.side)).map(v=><g key={v.side}>{v.rows.slice(1).map((r,i)=><SideWallSegment key={i} x={v.x} start={r.start} length={r.length} width={s.thickness} height={s.foreground} palette={p} art={art} endFace={i<v.rows.length-2}/>)}</g>)}
  <defs><radialGradient id={id+'fade'}><stop offset="0" stopColor="black" stopOpacity=".8"/><stop offset=".58" stopColor="black" stopOpacity=".8"/><stop offset="1" stopColor="black" stopOpacity="0"/></radialGradient><mask id={id+'mask'} maskUnits="userSpaceOnUse" x="0" y="0" width="384" height="576"><rect width="384" height="576" fill="white"/>{reveal&&<circle cx={reveal.x} cy={reveal.y} r={reveal.radius} fill={`url(#${id}fade)`}/>}</mask></defs>
  <g mask={`url(#${id}mask)`}>{south.map((r,i)=><g key={i}>
  <rect x={r.start} y={top} width={r.length} height={s.foreground+s.thickness} fill={p.face}/>
  <rect x={r.start} y={top} width={r.length} height={s.thickness} fill={p.cap}/>
  {walls.outdoor?<OutdoorMasonry x={r.start} y={top+s.thickness} width={r.length} height={s.foreground} image={art.stoneStair}/>:<svg x={r.start} y={top+s.thickness} width={r.length} height={s.foreground} viewBox="8 176 236 56" preserveAspectRatio="none" overflow="hidden" opacity=".2"><image href={art.photoWall} width="768" height="256" style={{imageRendering:'pixelated'}}/></svg>}
  <path d={`M${r.start} ${top}h${r.length}M${r.start} ${f.y+f.h+s.thickness}h${r.length}`} stroke={p.edge} strokeWidth="2"/>
  <path d={`M${r.start+1} ${top+2}h${Math.max(0,r.length-2)}`} stroke="#d0c6a4" opacity=".5"/>
  <path d={`M${r.start} ${top+s.thickness}h${r.length}`} stroke={p.edge}/>
  <rect x={r.start} y={f.y+f.h+4} width={r.length} height="4" fill={p.trim}/>
  {/* Short end faces make a doorway read as a cut through a wall. */}
  <path d={`M${r.start} ${top}v${s.foreground+s.thickness}M${r.start+r.length} ${top}v${s.foreground+s.thickness}`} stroke={p.edge} strokeWidth="2"/>
 </g>)}</g></g>
}

/** A clean stone patch already admitted with the stairs; no pink backdrop or stair silhouette. */
function OutdoorMasonry({x,y,width,height,image}:{x:number;y:number;width:number;height:number;image:string}){
 const id='os-masonry-'+useId().replace(/:/g,'')
 return <g><defs><pattern id={id} width="48" height="24" x={x} y={y} patternUnits="userSpaceOnUse">
  {[0,12].map(row=><svg key={row} x="0" y={row} width="48" height="12" viewBox="170 62 160 40" preserveAspectRatio="none" overflow="hidden" opacity=".55"><image href={image} width="512" height="512" style={{imageRendering:'pixelated'}}/></svg>)}
  <path d="M0 0H48M0 12H48M24 0V12M0 12V24" stroke="#555e4d" strokeWidth=".8" opacity=".45"/>
 </pattern></defs><rect x={x} y={y} width={width} height={height} fill={`url(#${id})`}/></g>
}

/** A raised side-wall cap and its exposed south-facing end, using scene plaster. */
function SideWallSegment({x,start,length,width,height,palette:p,art,endFace=false}:{x:number;start:number;length:number;width:number;height:number;palette:typeof palettes[string];art:OldStreetEnvironmentArt;endFace?:boolean}){
 const top=start-height,end=start+length
 return <g data-side-wall-segment={endFace?'far-end-face':'near-occluder'}>
  <rect x={x} y={top} width={width} height={length} fill={p.cap}/>
  <path d={`M${x} ${top}v${length}M${x+width} ${top}v${length}`} stroke={p.edge} strokeWidth="1"/>
  <path d={`M${x+2} ${top}v${length}`} stroke="#d0c6a4" opacity=".5"/>
  {endFace&&<g><rect x={x} y={end-height} width={width} height={height} fill={p.face}/><svg x={x} y={end-height} width={width} height={height} viewBox="8 16 30 216" preserveAspectRatio="none" overflow="hidden" opacity=".3"><image href={art.photoWall} width="768" height="256" style={{imageRendering:'pixelated'}}/></svg><path d={`M${x} ${end-height}h${width}v${height}h${-width}Z`} fill="none" stroke={p.edge}/><rect x={x} y={end-4} width={width} height="4" fill={p.trim}/></g>}
 </g>
}
