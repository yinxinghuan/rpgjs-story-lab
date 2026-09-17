import {useId} from 'react'
import type {oldStreetDoors} from './old-street-space'
import type {OldStreetEnvironmentArt} from './old-street-environment-art'
type Door=ReturnType<typeof oldStreetDoors>[number]
type Props={door:Door;closed:boolean;art:OldStreetEnvironmentArt;foreground?:boolean}
/** Entire reviewed assets; only ground-plane passages rotate. Upright doors never do. */
export function OldStreetEntranceArt({door:d,closed,art,foreground=false}:Props){
 const id='entrance-'+useId().replace(/:/g,''),side=d.side==='W'||d.side==='E'
 if(d.kind==='stairs')return null
 const curtain=d.id.includes('laundry-back'),ground=d.kind==='alley'||curtain
 if(foreground&&(ground||side||d.side!=='S'))return null
 const source=ground?art.entranceGround:side?art.entranceSide:art.entranceFront
 const column=ground?(curtain?1:0):side?(closed?1:0):(closed?0:1)
 const scale=ground?.22:side?.145:.185,angle=ground?{N:0,E:90,S:180,W:270}[d.side]:0
 // Front frames share a prepared threshold foot at (192,480). Side and alley
 // frames are centred on the authoritative opening and retain source aspect.
 const base=d.side==='S'?8:0,top=ground||side?-256: -480
 return <g data-entrance-art={ground?(curtain?'curtain':'alley'):side?'side':'front'} data-entrance-state={closed?'closed':'open'} data-entrance-layer={foreground?'foreground':'background'} transform={`translate(${d.position.x} ${d.position.y+(ground||side?0:base)}) rotate(${angle}) scale(${scale})`}>
  <defs><clipPath id={id}><rect x="0" y="0" width="384" height="425"/>{!closed&&<path d="M89 410L166 454V400H89Z"/>}</clipPath></defs>
  <g transform={`translate(-192 ${top})`}>
   <g clipPath={foreground?`url(#${id})`:undefined}>
    <svg width="384" height="512" viewBox={`${column*384} 0 384 512`} overflow="hidden"><image href={source} width="768" height="512" style={{imageRendering:'pixelated'}}/></svg>
   </g>
  </g>
 </g>
}
