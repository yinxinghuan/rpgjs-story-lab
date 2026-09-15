import {oldStreetDoors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'

/** Preview geometry is projected from the same endpoints as movement and travel. */
export function OldStreetDoorways({room,facts}:{room:OldStreetRoom;facts:StorySave['facts']}){
 return <g>{oldStreetDoors().filter(d=>d.room===room).map(d=>{
  const closed=Boolean(d.gate&&!facts[d.gate]),angle={N:0,E:90,S:180,W:270}[d.side]
  return <g key={d.id} transform={`translate(${d.position.x} ${d.position.y}) rotate(${angle})`}>
   <rect x="-23" y="-10" width="46" height="27" fill="#a79b82"/>
   {d.kind==='stairs'?<g fill="none" stroke="#554b3c" strokeWidth="2"><path d="M-21-9V17M21-9V17M-20-7H20M-20-1H20M-20 5H20M-20 11H20M-20 17H20"/></g>:d.kind==='door'?<g><rect x="-25" y="-11" width="6" height="30" fill="#60513c"/><rect x="19" y="-11" width="6" height="30" fill="#60513c"/><path d="M-18 14H18" stroke="#e4d4aa" strokeWidth="3"/></g>:<path d="M-23-10V14M23-10V14" fill="none" stroke="#756c59" strokeWidth="4"/>}
   {closed?<g stroke="#785145" strokeWidth="4"><path d="M-19-4L19 10M-19 10L19-4"/></g>:<path d="M-5 5L0 0L5 5" fill="none" stroke="#f6ead0" strokeWidth="2"/>}
  </g>
 })}</g>
}
