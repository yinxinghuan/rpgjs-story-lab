import type {RoofMaterialId} from './material-library/roof-materials'
/** New clay/asphalt density was rejected. Keep the familiar building materials in play. */
export function oldStreetRoofSections(_room:string,side:'W'|'E',y:number,height:number):Array<{y:number;height:number;material:RoofMaterialId}>{
 return [{y,height,material:side==='W'?'roof-zinc-green-01':'roof-slate-blue-01'}]
}
