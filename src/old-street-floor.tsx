import {oldStreetWoodTile} from './old-street-floor-material'
import {OldStreetShedEnvironment} from './old-street-shed-environment'
import {OldStreetShopEnvironment} from './old-street-shop-environment'
import narrowWood from '../doc/oldstreet-pixel-study/floor-narrow/candidate-actual.png'
import laundrySurface from '../doc/oldstreet-laundry-candidate/correction/candidate.png'
import {oldStreetFloors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'

// Reviewed clean surface regions only. Generated doors/furniture never define space.
const surfaces = {
  laundry: {image:laundrySurface, crop:'240 300 500 938', wall:'#8d9879', floor:'#c3b391'},
}
/** Surface art never defines walkability. Room and thresholds use the collision layout. */
export function OldStreetFloor({room, pixelShop=false}: {room: OldStreetRoom; pixelShop?:boolean}) {
  const floor = oldStreetFloors[room]
  // This candidate has ~16 actual plank columns, not the requested 32.
  // Tile at half-room width: ~7 world units per plank, independent of camera zoom.
  if(room==='shop')return <g>
    <defs><pattern id="os-narrow-wood" x={floor.x} y={floor.y} width={oldStreetWoodTile.width} height={oldStreetWoodTile.height} patternUnits="userSpaceOnUse"><image href={narrowWood} width={oldStreetWoodTile.width} height={oldStreetWoodTile.height} opacity={oldStreetWoodTile.opacity}/></pattern></defs>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill="#806142" stroke="#463d31" strokeWidth="2"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#a08866"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="url(#os-narrow-wood)"/>
    {pixelShop&&<OldStreetShopEnvironment/>}
  </g>
  const surface = room==='laundry'?surfaces[room]:null
  if (!surface) return <g><rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#c2bbab" stroke="#81786c" strokeWidth="6"/>{pixelShop&&room==='shed'&&<OldStreetShedEnvironment/>}</g>
  return <g>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill={surface.wall} stroke="#463d31" strokeWidth="2"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill={surface.floor}/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox={surface.crop} preserveAspectRatio="none" overflow="hidden">
      <image href={surface.image} width="1024" height="1536"/>
    </svg>
  </g>
}
