import {workshopGeometry} from './old-street-workshop'
import {oldStreetWoodTile} from './old-street-floor-material'
/** Existing material projection, separate from collision and narrative facts. */
export function OldStreetWorkshopFloor({wood}:{wood:string}){
 const f=workshopGeometry.floor
 return <g>
  <defs><pattern id="os-workshop-wood" x={f.x} y={f.y} width={oldStreetWoodTile.width} height={oldStreetWoodTile.height} patternUnits="userSpaceOnUse"><image href={wood} width={oldStreetWoodTile.width} height={oldStreetWoodTile.height} opacity={oldStreetWoodTile.opacity}/></pattern></defs>
  <rect x={f.x-6} y={f.y-8} width={f.w+12} height={f.h+16} fill="#806142" stroke="#463d31" strokeWidth="2"/>
  <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="#a08866"/>
  <rect x={f.x} y={f.y} width={f.w} height={f.h} fill="url(#os-workshop-wood)"/>
  <path d="M172 428H212" stroke="#d3c19d" strokeWidth="8"/>
 </g>
}
