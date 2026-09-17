import {OldStreetEntranceArt} from './old-street-entrance-art'
import {oldStreetEnvironmentArt,type OldStreetEnvironmentArt} from './old-street-environment-art'
import {oldStreetDoors} from './old-street-space'
import {oldStreetCrateSprite as crateArt,oldStreetCrateScale as crateScale} from './old-street-crate-layout'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
const elevation:Record<OldStreetRoom,number>={archive:-1,darkroom:0,street:0,shop:0,yard:0,laundry:0,photo:0,cellar:-1,roof:1,shed:0}
/** Physical variants share the existing endpoints; decoration cannot create a route. */
export function OldStreetDoorways({room,facts,cratesImage,stoneImage,art=oldStreetEnvironmentArt,foreground=false}:{room:OldStreetRoom;facts:StorySave['facts'];cratesImage?:string;stoneImage?:string;art?:OldStreetEnvironmentArt;foreground?:boolean}){
 return <g>{oldStreetDoors().filter(d=>d.room===room&&(!['darkroom-ready','archive-ready'].includes(d.gate??'')||facts[d.gate!])).map(d=>{
  const closed=Boolean(d.gate&&!facts[d.gate]),angle={N:0,E:90,S:180,W:270}[d.side]
  const outdoor=d.id.includes('riverside-stairs'),up=elevation[d.destination.room]>elevation[room]
  if(foreground)return <OldStreetEntranceArt key={d.id} door={d} closed={closed} art={art} foreground/>
  if(d.kind!=='stairs')return <OldStreetEntranceArt key={d.id} door={d} closed={closed} art={art}/>
  return <g key={d.id} transform={`translate(${d.position.x} ${d.position.y}) rotate(${angle})`}>
   <g>
    <rect x="-24" y="-16" width="48" height="38" fill={outdoor?'#353f40':'#514e43'}/>
    {[0,1,2,3,4].map(i=><g key={i}><rect x="-20" y={-14+i*7} width="40" height="6" fill={outdoor?(up?'#818d89':'#626f6c'):(up?'#b5ac93':'#928971')} opacity={up?.72+i*.055:1-i*.07}/><path d={`M-19 ${-14+i*7}H19`} stroke={outdoor?'#b1b9af':'#d7ceb5'} strokeWidth="1"/></g>)}
    {stoneImage&&!outdoor&&<g>
      {[0,1,2,3,4].map(i=><svg key={i} x="-20" y={-14+i*7} width="40" height="6" viewBox={['142 178 228 30','136 259 240 31','125 340 260 29'][i%3]} preserveAspectRatio="none" overflow="hidden"><image href={stoneImage} width="512" height="512" style={{imageRendering:'pixelated'}}/></svg>)}
      <path d="M-20-14H20M-20-7H20M-20 0H20M-20 7H20M-20 14H20" stroke="#4d493c" strokeWidth="1"/>
      <path d="M-23-16V22M23-16V22" stroke="#b2a88d" strokeWidth="5"/>
      <path d="M-25-5H-21M21 6H25M-25 15H-21" stroke="#615c45" strokeWidth="1.5"/>
    </g>}
    <path d="M-24-16V22M24-16V22" stroke={outdoor?'#525d59':'#726956'} strokeWidth="3"/>
    {outdoor&&<path d="M-27-18V15M27-18V15M-27-18H-23M27-18H23" stroke="#a0a69a" strokeWidth="2" fill="none"/>}
   </g>
   {closed&&d.gate==='crates-cleared'&&room==='cellar'&&<g transform={`rotate(${-angle})`}>
    {cratesImage?<image href={cratesImage} x={-crateArt.foot.x*crateScale} y={-crateArt.foot.y*crateScale} width={crateArt.width*crateScale} height={crateArt.height*crateScale} style={{imageRendering:'pixelated'}}/>:<g fill="#80613e" stroke="#453b2b" strokeWidth="2"><rect x="-32" y="-24" width="64" height="24"/><path d="M-30-18H30M-30-10H30M-10-24V0M12-24V0"/></g>}
   </g>}
  </g>
 })}</g>
}
