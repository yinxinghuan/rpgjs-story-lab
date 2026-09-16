/** Only fixed environment layers required to draw a room. Actors remain shared. */
export function oldStreetEnvironmentKeys(room:string,pixel:boolean,composite:boolean):string[]{
 const common=['doorWood','stoneStair',...(pixel?['debris']:[])]
 const rooms:Record<string,string[]>={street:pixel?['yard']:[],yard:pixel?['yard']:[],shop:composite?['shopComposite']:['wood'],laundry:['laundry'],photo:pixel?['photoFloor','photoWall']:[],shed:pixel?['shedFloor','shedWall']:[],roof:pixel?['roofFloor']:[],cellar:pixel?['cellarFloor']:[],darkroom:['photoFloor']}
 if(!(room in rooms))throw Error('ART_ROOM_UNKNOWN')
 return [...common,...rooms[room]]
}
