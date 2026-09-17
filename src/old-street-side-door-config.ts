import type {oldStreetDoors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
export type SideDoor=ReturnType<typeof oldStreetDoors>[number]
/** Direction is relative to this connection's rooms, never globally forced inward/outward. */
export type SideDoorStyle={leaf:'none'|'clock'|'plain'|'shop-clock'|'shop-photo';opensInto:OldStreetRoom;hinge:'north'|'south'}
export const sideDoorStyles:Record<string,SideDoorStyle>={
 'shop-front':{leaf:'shop-clock',opensInto:'street',hinge:'north'},
 'studio-front':{leaf:'shop-photo',opensInto:'street',hinge:'north'},
 'shop-back':{leaf:'clock',opensInto:'yard',hinge:'north'},
 'laundry-back':{leaf:'none',opensInto:'laundry',hinge:'north'},
 'yard-latch':{leaf:'plain',opensInto:'shed',hinge:'north'},
 'studio-darkroom':{leaf:'plain',opensInto:'photo',hinge:'north'},
 'cellar-archive':{leaf:'plain',opensInto:'cellar',hinge:'north'},
}
export function sideDoorStyle(door:Pick<SideDoor,'id'>){const key=door.id.split(':')[1],style=sideDoorStyles[key];if(!style)throw Error('SIDE_DOOR_STYLE_MISSING:'+key);return style}
export function isSidePassage(door:Pick<SideDoor,'kind'|'side'>){return door.kind!=='stairs'&&(door.side==='W'||door.side==='E')}
/** Leaf spans the 56-world-unit opening, with 4 units clearance per end. */
export function sideLeafPlacement(d:SideDoor){
 const style=sideDoorStyle(d),towardRoom=style.opensInto===d.room,direction=(d.side==='W'?1:-1)*(towardRoom?1:-1)
 return {style,towardRoom,direction,x:d.position.x+(d.side==='W'?-4:4),y:d.position.y+(style.hinge==='south'?28:-28),width:48,height:88}
}

export function openSideLeafBody(d:SideDoor,facts:StorySave['facts']){
 if(!isSidePassage(d)||d.gate&&!facts[d.gate])return null
 const p=sideLeafPlacement(d);if(p.style.leaf==='none'||!p.towardRoom)return null
 return {x:p.direction>0?p.x:p.x-p.width,y:p.y-2,w:p.width,h:4}
}
