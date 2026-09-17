import {oldStreetDoors,oldStreetFloors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
export const oldStreetInteriorRooms=['shop','laundry','photo','shed','cellar','darkroom','archive'] as const
export const roomWallSize={back:64,thickness:8,foreground:56,doorHalf:28} as const
export type WallSpan={start:number;length:number}
function spans(start:number,end:number,holes:Array<[number,number]>):WallSpan[]{
 let cursor=start;const result:WallSpan[]=[]
 for(const [a,b] of holes.sort((a,b)=>a[0]-b[0])){const left=Math.max(start,a),right=Math.min(end,b);if(right<=cursor||left>=end)continue;if(left>cursor)result.push({start:cursor,length:left-cursor});cursor=Math.max(cursor,right)}
 if(cursor<end)result.push({start:cursor,length:end-cursor});return result
}
/** Rendering reads the same floor, door positions and admission facts as travel. */
export function oldStreetRoomWalls(room:OldStreetRoom,facts:StorySave['facts']){
 if(!oldStreetInteriorRooms.includes(room as typeof oldStreetInteriorRooms[number]))return null
 const f=oldStreetFloors[room],s=roomWallSize,doors=oldStreetDoors().filter(d=>d.room===room&&(!['darkroom-ready','archive-ready'].includes(d.gate??'')||facts[d.gate!]))
 const cuts=(side:string)=>doors.filter(d=>d.side===side).map(d=>{const p=side==='N'||side==='S'?d.position.x:d.position.y;return [p-s.doorHalf,p+s.doorHalf] as [number,number]})
 return {floor:f,north:spans(f.x,f.x+f.w,cuts('N')),south:spans(f.x-s.thickness,f.x+f.w+s.thickness,cuts('S')),west:spans(f.y,f.y+f.h,cuts('W')),east:spans(f.y,f.y+f.h,cuts('E'))}
}

/** Reveal only a wall-overlapped actor; a doorway or distant actor needs no cutaway. */
export function oldStreetWallReveal(room:OldStreetRoom,facts:StorySave['facts'],actor?:{x:number;y:number}){
 const wall=oldStreetRoomWalls(room,facts);if(!wall||!actor)return null
 const foot={x:actor.x+8,y:actor.y+26},top=wall.floor.y+wall.floor.h-roomWallSize.foreground
 if(foot.y<top-8||foot.y>wall.floor.y+wall.floor.h+8||!wall.south.some(r=>foot.x+12>r.start&&foot.x-12<r.start+r.length))return null
 return {x:foot.x,y:foot.y-24,radius:40}
}
