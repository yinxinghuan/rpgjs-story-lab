import {oldStreetEnvironmentArt} from './old-street-environment-art'
import {oldStreetPhotoWallRegions} from './old-street-photo-environment-layout'
export function OldStreetPhotoEnvironment({image=oldStreetEnvironmentArt.photoWall}:{image?:string}){
 return <g>{oldStreetPhotoWallRegions().map((r,i)=><g key={i}>
  <rect x={r.x} y={r.y} width={r.width} height={r.height} fill="#9da58e"/>
  <rect x={r.x} y={r.y} width={r.width} height="3" fill="#6f4c22"/>
  <rect x={r.x} y={r.y+r.height-4} width={r.width} height="4" fill="#60401e"/>
  <svg x={r.x} y={r.y} width={r.width} height={r.height} viewBox={r.crop} preserveAspectRatio="xMidYMid meet" overflow="hidden"><image href={image} width="768" height="256" style={{imageRendering:'pixelated'}}/></svg>
 </g>)}</g>
}
