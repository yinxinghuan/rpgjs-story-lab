import {oldStreetDoors} from './old-street-space'
import {OldStreetCurtain} from './old-street-curtain'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
const elevation:Record<OldStreetRoom,number>={darkroom:0,street:0,shop:0,yard:0,laundry:0,photo:0,cellar:-1,roof:1,shed:0}
/** Physical variants share the existing endpoints; decoration cannot create a route. */
export function OldStreetDoorways({room,facts,cratesImage,stoneImage,woodImage}:{room:OldStreetRoom;facts:StorySave['facts'];cratesImage?:string;stoneImage?:string;woodImage?:string}){
 return <g>{oldStreetDoors().filter(d=>d.room===room&&(d.gate!=='darkroom-ready'||facts['darkroom-ready'])).map(d=>{
  const closed=Boolean(d.gate&&!facts[d.gate]),angle={N:0,E:90,S:180,W:270}[d.side]
  const outdoor=d.id.includes('riverside-stairs'),up=elevation[d.destination.room]>elevation[room]
  return <g key={d.id} transform={`translate(${d.position.x} ${d.position.y}) rotate(${angle})`}>
   {d.kind==='alley'?<g>
    <path d="M-25 18V-22H25V18" fill="#b0a58d"/>
    <path d="M-24-22V-9M24-22V-9" stroke="#625e4f" strokeWidth="6"/>
    <path d="M-22-12H22M-22-2H22M-22 8H22M-10-22V-12M9-12V-2M-6-2V8M12 8V18" stroke="#817966" strokeWidth="1" fill="none"/>
   </g>:d.kind==='stairs'?<g>
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
   </g>:d.id.includes('laundry-back')?<OldStreetCurtain side={d.side}/>:<g>
    <rect x="-23" y="-10" width="46" height="29" fill="#8f846e"/>
    <path d="M-19 11H19M-19 16H19" stroke="#cabca0" strokeWidth="2"/>
    <rect x="-26" y="-13" width="6" height="33" fill="#584731"/><rect x="20" y="-13" width="6" height="33" fill="#584731"/>
    <path d="M-24-12V17M22-12V17" stroke="#a88b57" strokeWidth="1"/>
    {closed?<g>
      <rect x="-20" y="-10" width="40" height="21" fill="#776145"/>
      {woodImage?<image href={woodImage} x="-20" y="-10" width="40" height="21" preserveAspectRatio="none" style={{imageRendering:'pixelated'}}/>:<path d="M-12-9V10M-4-9V10M4-9V10M12-9V10" stroke="#9e8156"/>}
      <rect x="-20" y="-10" width="40" height="21" fill="none" stroke="#403b2e" strokeWidth="2"/>
      <path d="M-18-7V8M18-7V8" stroke="#b19b70" strokeWidth=".7" opacity=".6"/>
      <rect x="-10" y="-2" width="20" height="3" fill="#434c48"/><rect x="6" y="-4" width="3" height="7" fill="#a1a69a"/>
      <path d="M-18-7H-13M-18 6H-13" stroke="#363b35" strokeWidth="2"/>
    </g>:<g>
      <path d="M-20-10L-32-17V8L-20 15Z" fill="#896e47"/>
      {woodImage&&<g transform="matrix(.3 .175 0 1 -32 -17)"><image href={woodImage} width="40" height="25" preserveAspectRatio="none" style={{imageRendering:'pixelated'}}/></g>}
      <path d="M-20-10L-32-17V8L-20 15Z" fill="none" stroke="#493c2b" strokeWidth="2"/>
      <path d="M-23-8L-29-12V5L-23 9Z" fill="none" stroke="#b09059" strokeWidth=".8"/>
      <path d="M-29-1V2" stroke="#bdb7a0" strokeWidth="2"/>
    </g>}
   </g>}
   {closed&&d.gate==='crates-cleared'&&room==='cellar'&&<g transform={`rotate(${-angle})`}>
    {cratesImage?<image href={cratesImage} x="-27" y="-42" width="54" height="54" style={{imageRendering:'pixelated'}}/>:<g fill="#80613e" stroke="#453b2b" strokeWidth="2"><rect x="-23" y="-22" width="27" height="25"/><rect x="3" y="-15" width="23" height="20"/><path d="M-20-17H1M-20-10H1M6-10H23"/></g>}
   </g>}
  </g>
 })}</g>
}
