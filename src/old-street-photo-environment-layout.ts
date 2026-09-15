import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** The generated gap is discarded; the real stairs own the opening. */
export function oldStreetPhotoWallRegions(){
 const floor=oldStreetFloors.photo,door=oldStreetDoors().find(d=>d.room==='photo'&&d.side==='N')!
 return [{x:floor.x,y:floor.y-64,width:door.position.x-24-floor.x,height:64,crop:'0 0 274 256'},
 {x:door.position.x+24,y:floor.y-64,width:floor.x+floor.w-door.position.x-24,height:64,crop:'494 0 274 256'}]
}
