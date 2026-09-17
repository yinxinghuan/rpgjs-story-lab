import {oldStreetRoomWalls,roomWallSize} from './old-street-room-walls'
export function oldStreetShopWallRegions(){
 const {floor,north}=oldStreetRoomWalls('shop',{})!
 return north.map((r,i)=>({x:r.start,y:floor.y-roomWallSize.back,width:r.length,height:roomWallSize.back,crop:['0 0 348 256','542 0 354 256'][i]}))
}
