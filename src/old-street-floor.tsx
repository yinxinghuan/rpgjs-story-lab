import woodSurface from './assets/oldstreet/watch-shop-surface-v2.png'
import {oldStreetDoors, oldStreetFloors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'

/** Surface art never defines walkability. Room and thresholds use the collision layout. */
export function OldStreetFloor({room}: {room: OldStreetRoom}) {
  const floor = oldStreetFloors[room]
  if (room !== 'shop') return <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#c2bbab" stroke="#81786c" strokeWidth="6"/>
  return <g>
    <rect x={floor.x-8} y={floor.y-8} width={floor.w+16} height={floor.h+16} fill="#806142" stroke="#463d31" strokeWidth="2"/>
    <rect x={floor.x} y={floor.y} width={floor.w} height={floor.h} fill="#b18b57"/>
    {/* Display only the clean interior: omit generated walls and green guide markers. */}
    <svg x={floor.x} y={floor.y} width={floor.w} height={floor.h} viewBox="240 280 540 1000" preserveAspectRatio="none" overflow="hidden">
      <image href={woodSurface} width="1024" height="1536"/>
    </svg>
    {oldStreetDoors().filter(door => door.room === room).map(door => <rect key={door.id}
      x={door.position.x-18} y={door.position.y-12} width="36" height="24" fill="#b18b57"/>) }
  </g>
}
