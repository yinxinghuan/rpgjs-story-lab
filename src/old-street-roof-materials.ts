import {oldStreetDoors} from './old-street-space'
import type {RoofMaterialId} from './material-library/roof-materials'
/** Assign buildings, not random roof colors. The watch shop keeps its roof on both approaches. */
export function oldStreetRoofSections(room:string,side:'W'|'E',y:number,height:number):Array<{y:number;height:number;material:RoofMaterialId}>{
 if(room==='yard'&&side==='W'){
  const doors=oldStreetDoors(),laundry=doors.find(d=>d.room==='yard'&&d.id.includes('laundry-back'))!,shop=doors.find(d=>d.room==='yard'&&d.id.includes('shop-back'))!,seam=Math.round((laundry.position.y+shop.position.y)/2)
  return [{y,height:seam-y,material:'roof-clay-worn-01'},{y:seam,height:y+height-seam,material:'roof-zinc-green-01'}]
 }
 return [{y,height,material:room==='yard'?'roof-asphalt-grey-01':side==='W'?'roof-zinc-green-01':'roof-slate-blue-01'}]
}
