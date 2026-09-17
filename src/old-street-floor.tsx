import {oldStreetWoodTile} from './old-street-floor-material'
import {oldStreetEnvironmentArt,type OldStreetEnvironmentArt} from './old-street-environment-art'
import {oldStreetFloors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'

// Reviewed clean surface regions only. Generated doors/furniture never define space.
const surfaces = {
  laundry: {crop:'240 300 500 938', wall:'#8d9879', floor:'#c3b391'},
}
/** Surface art never defines walkability. Room and thresholds use the collision layout. */
export function OldStreetFloor({room, pixelShop=false, compositeShop=false, art=oldStreetEnvironmentArt}: {room: OldStreetRoom; pixelShop?:boolean;compositeShop?:boolean;art?:OldStreetEnvironmentArt}) {
  const floor = oldStreetFloors[room]
  // One generated atmosphere image, projected into authoritative floor/wall regions.
  // Generated doorway coordinates are not trusted; retain runtime doors and props.
  if(room==='shop'&&compositeShop)return <g>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill="#554b3b"/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox="104 320 560 736" preserveAspectRatio="none" overflow="hidden">
      <image href={art.shopComposite} width="768" height="1152" style={{imageRendering:'pixelated'}}/>
    </svg>
  </g>
  // This candidate has ~16 actual plank columns, not the requested 32.
  // Tile at half-room width: ~7 world units per plank, independent of camera zoom.
  if(room==='shop'||room==='archive')return <g>
    <defs><pattern id="os-narrow-wood" x={floor.x} y={floor.y} width={oldStreetWoodTile.width} height={oldStreetWoodTile.height} patternUnits="userSpaceOnUse"><image href={art.wood} width={oldStreetWoodTile.width} height={oldStreetWoodTile.height} opacity={oldStreetWoodTile.opacity}/></pattern></defs>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill="#806142" stroke="#463d31" strokeWidth="2"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#a08866"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="url(#os-narrow-wood)"/>
  </g>
  // The source's thin facade/border is excluded: only flat paving, light and
  // litter enter the walkable area. Runtime entrances retain their real slots.
  if(room==='street'&&pixelShop)return <g>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#626954"/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox="40 64 728 1050" preserveAspectRatio="none" overflow="hidden">
      <image href={art.streetGround} width="768" height="1152" style={{imageRendering:'pixelated'}}/>
    </svg>
  </g>
  if(room==='yard'&&pixelShop)return <g>
    <rect x={floor.x-3} y={floor.y-3} width={floor.w+6} height={floor.h+6} fill="#716c50"/>
    {/* One reviewed ground plate, not a repeating tile. Its 3:5 ratio gives
        equal x/y scale; all changing objects remain independent layers. */}
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox="0 0 576 960" preserveAspectRatio="xMidYMid meet" overflow="hidden">
      <image href={art.yard} width="576" height="960" style={{imageRendering:'pixelated'}}/>
    </svg>
  </g>
  if(room==='darkroom')return <g>
    <rect x={floor.x-6} y={floor.y-8} width={floor.w+12} height={floor.h+16} fill="#555748"/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox="0 180 640 844" preserveAspectRatio="none" overflow="hidden"><image href={art.photoFloor} width="640" height="1024"/></svg>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#463c27" opacity=".22"/>
  </g>
  if(room==='roof'&&pixelShop)return <g>
    <image href={art.roofFloor} x={floor.x} y={floor.y} width={floor.w} height={floor.h} preserveAspectRatio="none" style={{imageRendering:'pixelated'}}/>
  </g>
  if(room==='shed'&&pixelShop)return <g>
    <rect x={floor.x-4} y={floor.y-4} width={floor.w+8} height={floor.h+8} fill="#77715c"/>
    <image href={art.shedFloor} x={floor.x} y={floor.y} width={floor.w} height={floor.h} preserveAspectRatio="none" style={{imageRendering:'pixelated'}}/>
  </g>
  if(room==='cellar'&&pixelShop)return <g>
    <rect x={floor.x-4} y={floor.y-4} width={floor.w+8} height={floor.h+8} fill="#656452"/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox="0 256 512 832" preserveAspectRatio="none" overflow="hidden">
      <image href={art.cellarFloor} width="512" height="1088" style={{imageRendering:'pixelated'}}/>
    </svg>
  </g>
  if(room==='photo'&&pixelShop)return <g>
    <rect x={floor.x-4} y={floor.y-4} width={floor.w+8} height={floor.h+8} fill="#726d56"/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox="0 180 640 844" preserveAspectRatio="none" overflow="hidden">
      <image href={art.photoFloor} width="640" height="1024" style={{imageRendering:'pixelated'}}/>
    </svg>
  </g>
  const surface = room==='laundry'?surfaces[room]:null
  if (!surface) return <g><rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#c2bbab" stroke="#81786c" strokeWidth="6"/></g>
  return <g>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill={surface.wall} stroke="#463d31" strokeWidth="2"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill={surface.floor}/>
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox={surface.crop} preserveAspectRatio="none" overflow="hidden">
      <image href={art.laundry} width="1024" height="1536"/>
    </svg>
  </g>
}
