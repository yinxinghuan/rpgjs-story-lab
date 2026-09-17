import {oldStreetDoors,oldStreetFloors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'
/** Local screen directions, sourced from the same thresholds used by movement.
 * A turn through a doorway need not preserve the orientation of the next room. */
export function oldStreetLocalMap(room:OldStreetRoom,known:ReadonlySet<OldStreetRoom>){
 const floor=oldStreetFloors[room]
 const exits=oldStreetDoors().filter(d=>d.room===room&&known.has(d.destination.room)).map(door=>{
  const x=116+(door.position.x-floor.x)/floor.w*108,y=110+(door.position.y-floor.y)/floor.h*230
  const point:[number,number]=[x,y]
  const label:[number,number]=door.side==='N'?[x,70]:door.side==='S'?[x,390]:door.side==='W'?[48,y]:[292,y]
  return {door,point,label}
 })
 // Keep same-side destinations in threshold order, with enough touch/label space.
 for(const side of ['W','E'] as const){
  const group=exits.filter(e=>e.door.side===side).sort((a,b)=>a.point[1]-b.point[1])
  group.forEach((e,i)=>{e.label[1]=Math.max(e.label[1],i?group[i-1].label[1]+100:130)})
  const overflow=(group.at(-1)?.label[1]??0)-310
  if(overflow>0)for(const e of group)e.label[1]-=overflow
 }
 return exits
}
