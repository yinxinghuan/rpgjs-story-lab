import {oldStreetRoomWalls,roomWallSize} from './old-street-room-walls'
export function oldStreetPhotoWallRegions(){
 const {floor,north}=oldStreetRoomWalls('photo',{})!
 return north.map((r,i)=>({x:r.start,y:floor.y-roomWallSize.back,width:r.length,height:roomWallSize.back,crop:['0 0 274 256','494 0 274 256'][i]}))
}
