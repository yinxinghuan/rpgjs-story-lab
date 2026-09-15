import type {OldStreetRoom} from './old-street-cartridge'
import {oldStreetFloors,oldStreetDoors} from './old-street-space'
import {oldStreetEnvironmentArt} from './old-street-environment-art'
// Deliberate edge accumulation, never a new interactive object or collision body.
const spots:Partial<Record<OldStreetRoom,Array<[number,number,number,number]>>>={
 yard:[[0,.08,.16,38],[2,.94,.11,30],[3,.93,.91,38],[0,.12,.93,32],[1,.92,.7,22]],
 street:[[0,.09,.14,34],[3,.91,.8,32],[1,.1,.66,22]],
 roof:[[3,.08,.15,38],[0,.91,.9,38],[2,.9,.13,30]],
 shed:[[2,.1,.12,26],[0,.9,.9,32],[1,.1,.9,20]],
 cellar:[[2,.92,.2,30],[1,.91,.91,24],[2,.1,.91,26]],
 photo:[[1,.92,.89,16]],shop:[[1,.9,.9,16]],
}
export function oldStreetGroundDetails(room:OldStreetRoom){
 const floor=oldStreetFloors[room],doors=oldStreetDoors().filter(d=>d.room===room)
 return (spots[room]??[]).map(([frame,u,v,size])=>({frame,x:floor.x+floor.w*u,y:floor.y+floor.h*v,size})).filter(p=>doors.every(d=>Math.hypot(d.position.x-p.x,d.position.y-p.y)>36+p.size/2))
}
export function OldStreetGroundDetail({room,image=oldStreetEnvironmentArt.debris}:{room:OldStreetRoom;image?:string}){
 return <g opacity=".72">{oldStreetGroundDetails(room).map((p,i)=><svg key={i} x={p.x-p.size/2} y={p.y-p.size/2} width={p.size} height={p.size} viewBox={`${(p.frame%2)*512} ${Math.floor(p.frame/2)*512} 512 512`} overflow="hidden" aria-hidden="true"><image href={image} width="1024" height="1024" style={{imageRendering:'pixelated'}}/></svg>)}</g>
}
