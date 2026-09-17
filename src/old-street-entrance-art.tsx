import {useId} from 'react'
import {getPreferredDoorMaterial,getDoorMaterial} from './material-library/door-materials'
import type {oldStreetDoors} from './old-street-space'
import type {OldStreetEnvironmentArt} from './old-street-environment-art'
type Door=ReturnType<typeof oldStreetDoors>[number]
type Props={door:Pick<Door,'id'|'side'|'position'|'kind'>&{room?:Door['room']};closed:boolean;art:OldStreetEnvironmentArt;foreground?:boolean}
/** Entire reviewed assets; only ground-plane passages rotate. Upright doors never do. */
export function OldStreetEntranceArt({door:d,closed,art,foreground=false}:Props){
 const id='entrance-'+useId().replace(/:/g,''),side=d.side==='W'||d.side==='E'
 if(d.kind==='stairs'||side)return null
 const curtain=d.id.includes('laundry-back'),ground=d.kind==='alley'||curtain

 if(foreground&&(ground||side||d.side!=='S'))return null
 const home=d.id==='street-exit'
 const material=home?getDoorMaterial('door-home-teal-platform-01',d.side):!ground&&!side?getPreferredDoorMaterial(d.id.includes('shop-back')?'inset-oblique':'open-90',d.side):null
 const source=home?art.entranceHome:ground?art.entranceGround:side?art.entranceSide:material?.openingPose==='inset-oblique'?art.entranceInset:art.entranceFront
 const column=ground?(curtain?1:0):side?(closed?1:0):material!.states[closed?'closed':'open'].column
 const scale=ground?.22:side?.145:material!.render.scale,angle=ground?{N:0,E:90,S:180,W:270}[d.side]:0
 // Admitted front materials share a threshold anchor; never reuse the old atlas baseline.
 const base=d.side==='S'?(material?.render.southOffset??8):0,top=ground||side?-256:-material!.foot.y
 return <g data-entrance-art={ground?(curtain?'curtain':'alley'):side?'side':'front'} data-door-material={material?.id} data-entrance-state={closed?'closed':'open'} data-entrance-layer={foreground?'foreground':'background'} transform={`translate(${d.position.x} ${d.position.y+(ground||side?0:base)}) rotate(${angle}) scale(${scale})`}>
  <defs><clipPath id={id}><rect x="0" y="0" width="384" height={material?.render.foregroundCutY??442}/>{!closed&&material&&<rect {...material.render.openLeafForeground}/>}</clipPath></defs>
  <g transform={`translate(-192 ${top})`}>
   <g clipPath={foreground?`url(#${id})`:undefined}>
    <svg width="384" height="512" viewBox={`${column*384} 0 384 512`} overflow="hidden"><image href={source} width="768" height="512" style={{imageRendering:'pixelated'}}/></svg>
   </g>
  </g>
 </g>
}
