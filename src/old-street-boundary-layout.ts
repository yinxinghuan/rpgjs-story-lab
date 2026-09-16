import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** Street building edges stay outside the authoritative walkable floor. */
export function oldStreetBuildingEdges(){
 const f=oldStreetFloors.street
 return (['W','E'] as const).flatMap(side=>{
  const gaps=oldStreetDoors().filter(d=>d.room==='street'&&d.side===side).map(d=>({start:d.position.y-28,end:d.position.y+28})).sort((a,b)=>a.start-b.start)
  const spans:Array<{start:number;end:number}>=[];let cursor=f.y
  for(const gap of gaps){if(gap.start>cursor)spans.push({start:cursor,end:gap.start});cursor=Math.max(cursor,gap.end)}
  if(cursor<f.y+f.h)spans.push({start:cursor,end:f.y+f.h})
  // Use the existing non-walkable border for shallow cutaway roofs. No floor,
  // doorway slot, approach point or collision is moved by this wider artwork.
  return spans.map(s=>({side,x:side==='W'?0:f.x+f.w,y:s.start,width:56,height:s.end-s.start}))
 })
}
