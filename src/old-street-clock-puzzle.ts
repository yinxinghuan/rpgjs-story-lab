/** Region was measured on the reviewed 1024x768 platform image: brass plate x647..931/y524..686. */
export const oldStreetClockPuzzle={version:'clock-underside-1',zoom:2.8} as const
export function oldStreetClockObserved(value:unknown):boolean{
 if(!value||typeof value!=='object')return false
 const v=value as Record<string,unknown>
 return v.version===oldStreetClockPuzzle.version&&v.region==='south-east'&&v.zoom===oldStreetClockPuzzle.zoom&&v.mark==='swallows'
}
