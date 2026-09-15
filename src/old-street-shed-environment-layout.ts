import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** The source's magenta gap is deliberately unused: real stairs define clearance. */
export function oldStreetShedWallRegions(){
 const floor=oldStreetFloors.shed,stairs=oldStreetDoors().find(d=>d.room==='shed'&&d.side==='N'&&d.kind==='stairs')!
 return [{x:floor.x,y:floor.y-64,width:stairs.position.x-24-floor.x,height:64,crop:{x:0,y:0,width:320,height:256}},
 {x:stairs.position.x+24,y:floor.y-64,width:floor.x+floor.w-stairs.position.x-24,height:64,crop:{x:448,y:0,width:320,height:256}}]
}
