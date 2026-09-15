import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** Static wall art is fitted outside the floor; map endpoints define its doorway. */
export function oldStreetShopWallRegions(){
 const floor=oldStreetFloors.shop
 const door=oldStreetDoors().find(d=>d.room==='shop'&&d.side==='N')!
 const gapLeft=door.position.x-24,gapRight=door.position.x+24
 return [{x:floor.x,y:floor.y-64,width:gapLeft-floor.x,height:64,crop:'0 0 348 256'},
  {x:gapRight,y:floor.y-64,width:floor.x+floor.w-gapRight,height:64,crop:'542 0 354 256'}]
}
