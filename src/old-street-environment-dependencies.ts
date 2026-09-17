/** Only fixed environment layers required to draw a room. Actors remain shared. */
export function oldStreetEnvironmentKeys(room:string,pixel:boolean,composite:boolean):string[]{
 const interior=['shop','laundry','photo','shed','cellar','darkroom','archive'].includes(room)
 const common=[...(interior?['photoWall']:[]),...(room==='shed'?['shedWall']:[]),...(room==='shop'&&!composite?['shopWall']:[]),'doorWood','stoneStair',...(pixel?['debris']:[])]
 const rooms:Record<string,string[]>={street:pixel?['streetGround','streetEdges']:[],yard:pixel?['yard','streetEdges']:[],shop:composite?['shopComposite']:['wood'],laundry:['laundry'],photo:pixel?['photoFloor','photoWall']:[],shed:pixel?['shedFloor','shedWall','wood']:['wood'],roof:pixel?['roofFloor','wood']:['wood'],cellar:pixel?['cellarFloor']:[],darkroom:['photoFloor']}
 if(room==='archive')return [...common,'wood']
 if(!(room in rooms))throw Error('ART_ROOM_UNKNOWN')
 return [...new Set([...common,...rooms[room]])]
}
