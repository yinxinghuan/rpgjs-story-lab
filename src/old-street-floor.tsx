import {oldStreetWoodRegion,oldStreetWoodSource} from './old-street-floor-material'
import {OldStreetShopEnvironment} from './old-street-shop-environment'
import pixelFloor from '../doc/oldstreet-pixel-study/floor/candidate.png'
import woodSurface from './assets/oldstreet/watch-shop-surface-v2.png'
import laundrySurface from '../doc/oldstreet-laundry-candidate/correction/candidate.png'
import {oldStreetFloors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'

// Reviewed clean surface regions only. Generated doors/furniture never define space.
const surfaces = {
  shop: {image:woodSurface, crop:'240 280 540 1000', wall:'#806142', floor:'#b18b57'},
  laundry: {image:laundrySurface, crop:'240 300 500 938', wall:'#8d9879', floor:'#c3b391'},
}
/** Surface art never defines walkability. Room and thresholds use the collision layout. */
export function OldStreetFloor({room, pixelShop=false}: {room: OldStreetRoom; pixelShop?:boolean}) {
  const floor = oldStreetFloors[room]
  const wood=pixelShop?oldStreetWoodRegion(room):null
  if(wood)return <g>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill="#806142" stroke="#30271e" strokeWidth="2"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#aa8452"/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox={wood.viewBox} overflow="hidden">
      <image opacity=".55" href={pixelFloor} width={oldStreetWoodSource.width} height={oldStreetWoodSource.height} style={{imageRendering:'pixelated'}}/>
    </svg>
    {room==='shop'&&<OldStreetShopEnvironment/>}
  </g>
  const surface = room==='shop'||room==='laundry'?surfaces[room]:null
  if (!surface) return <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#c2bbab" stroke="#81786c" strokeWidth="6"/>
  return <g>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill={surface.wall} stroke="#463d31" strokeWidth="2"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill={surface.floor}/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox={surface.crop} preserveAspectRatio="none" overflow="hidden">
      <image href={surface.image} width="1024" height="1536"/>
    </svg>

  </g>
}
