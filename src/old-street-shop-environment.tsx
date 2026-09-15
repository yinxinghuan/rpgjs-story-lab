import {oldStreetEnvironmentArt} from './old-street-environment-art'
import {oldStreetShopWallRegions} from './old-street-shop-environment-layout'

export function OldStreetShopEnvironment({image=oldStreetEnvironmentArt.shopWall}:{image?:string}){
 return <g>{oldStreetShopWallRegions().map((r,i)=><svg key={i} x={r.x} y={r.y} width={r.width} height={r.height} viewBox={r.crop} preserveAspectRatio="none" overflow="hidden">
  <image href={image} width="896" height="256" style={{imageRendering:'pixelated'}}/>
 </svg>)}</g>
}
