import {oldStreetFloors} from './old-street-space'
import type {OldStreetRoom} from './old-street-cartridge'
export const oldStreetWoodSource={width:448,height:832,pixelsPerWorldUnit:2} as const
/** One material density across rooms. Crop, never distort to fit the room. */
export function oldStreetWoodRegion(room:OldStreetRoom){
 if(room!=='shop'&&room!=='shed')return null
 const floor=oldStreetFloors[room],source=oldStreetWoodSource
 const width=floor.w*source.pixelsPerWorldUnit,height=floor.h*source.pixelsPerWorldUnit
 if(width>source.width||height>source.height)throw Error('WOOD_MATERIAL_TOO_SMALL')
 const x=(source.width-width)/2,y=(source.height-height)/2
 return {floor,crop:{x,y,width,height},viewBox:`${x} ${y} ${width} ${height}`}
}
