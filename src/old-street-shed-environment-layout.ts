import {oldStreetRoomWalls,roomWallSize} from './old-street-room-walls'
export function oldStreetShedWallRegions(){
 const {floor,north}=oldStreetRoomWalls('shed',{})!
 return north.map((r,i)=>({x:r.start,y:floor.y-roomWallSize.back,width:r.length,height:roomWallSize.back,crop:{x:i===0?0:448,y:0,width:r.length*4,height:256}}))
}
