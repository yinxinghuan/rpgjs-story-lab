import {oldStreetEnvironmentArt} from './old-street-environment-art'
import {oldStreetShedWallRegions} from './old-street-shed-environment-layout'
export function OldStreetShedEnvironment({image=oldStreetEnvironmentArt.shedWall}:{image?:string}){return <g>{oldStreetShedWallRegions().map((r,i)=><svg key={i} x={r.x} y={r.y} width={r.width} height={r.height} viewBox={`${r.crop.x} ${r.crop.y} ${r.crop.width} ${r.crop.height}`} overflow="hidden"><image href={image} width="768" height="256" style={{imageRendering:'pixelated'}}/></svg>)}</g>}
