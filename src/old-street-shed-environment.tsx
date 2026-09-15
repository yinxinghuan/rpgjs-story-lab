import wallUrl from '../doc/oldstreet-shed-wall/candidate.png'
import {oldStreetShedWallRegions} from './old-street-shed-environment-layout'
export function OldStreetShedEnvironment(){return <g>{oldStreetShedWallRegions().map((r,i)=><svg key={i} x={r.x} y={r.y} width={r.width} height={r.height} viewBox={`${r.crop.x} ${r.crop.y} ${r.crop.width} ${r.crop.height}`} overflow="hidden"><image href={wallUrl} width="768" height="256" style={{imageRendering:'pixelated'}}/></svg>)}</g>}
