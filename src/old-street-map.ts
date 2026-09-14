import {oldStreetConnections,oldStreetRooms,type OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
const isRoom=(id:string):id is OldStreetRoom=>Object.hasOwn(oldStreetRooms,id)
/** Both endpoints were seen; fixed room exits are visible without another inspect action. */
export function oldStreetKnownMap(save:Pick<StorySave,'map'|'facts'>){
 const rooms=save.map.filter(n=>(n.visited||n.current)&&isRoom(n.id)).map(n=>({id:n.id as OldStreetRoom,current:Boolean(n.current)}))
 const known=new Set(rooms.map(r=>r.id))
 return {rooms,connections:oldStreetConnections.filter(e=>known.has(e.a)&&known.has(e.b)).map(e=>({...e,open:!e.gate||save.facts[e.gate]===true}))}
}
export function oldStreetKnownRoute(save:Pick<StorySave,'map'|'facts'>,from:OldStreetRoom,to:OldStreetRoom):OldStreetRoom[]|null{
 const map=oldStreetKnownMap(save),known=new Set(map.rooms.map(r=>r.id))
 if(!known.has(from)||!known.has(to))return null
 const queue:OldStreetRoom[][]=[[from]],seen=new Set<OldStreetRoom>([from])
 while(queue.length){const path=queue.shift()!,last=path.at(-1)!;if(last===to)return path
  for(const edge of map.connections){if(!edge.open)continue;const next=edge.a===last?edge.b:edge.b===last?edge.a:null;if(next&&!seen.has(next)){seen.add(next);queue.push([...path,next])}}
 }
 return null
}
