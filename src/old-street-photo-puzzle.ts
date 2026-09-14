/** The same admitted photograph supplies both halves; alternatives deliberately
 * use the wrong crop or a mirrored right half. No model can mark it solved. */
export const oldStreetPhotoPuzzle={version:'laundry-print-1',image:'./assets/oldstreet/laundry-print-v1.png',pieces:[{id:'piece-fern',side:'right',mirrored:true},{id:'piece-river',side:'right',mirrored:false},{id:'piece-stone',side:'left',mirrored:false}]} as const
export function oldStreetPhotoMatches(value:unknown):boolean{
 const v=value as {version?:unknown;piece?:unknown;rotation?:unknown}
 return !!v&&v.version===oldStreetPhotoPuzzle.version&&v.piece==='piece-river'&&v.rotation===0
}
