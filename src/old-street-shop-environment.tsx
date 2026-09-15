import wallUrl from '../doc/oldstreet-pixel-study/workshop-wall/candidate.png'
import {oldStreetShopWallRegions} from './old-street-shop-environment-layout'

export function OldStreetShopEnvironment(){
 return <g>{oldStreetShopWallRegions().map((r,i)=><svg key={i} x={r.x} y={r.y} width={r.width} height={r.height} viewBox={r.crop} preserveAspectRatio="none" overflow="hidden">
  <image href={wallUrl} width="896" height="256" style={{imageRendering:'pixelated'}}/>
 </svg>)}</g>
}
