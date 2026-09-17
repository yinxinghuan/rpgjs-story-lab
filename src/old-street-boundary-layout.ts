import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** Ground-level hubs need adjacent buildings; interiors and playable roofs do not. */
export function oldStreetBuildingRoofs(room:string){
 if(room!=='street'&&room!=='yard')return []
 const f=oldStreetFloors[room],recess=room==='yard'?12:16
 return (['W','E'] as const).map(side=>({side,x:side==='W'?0:f.x+f.w+recess,y:f.y,width:side==='W'?f.x-recess:384-(f.x+f.w+recess),height:f.h}))
}
/** Facade stays outside the floor, with recesses at every real side entrance. */
export function oldStreetBuildingEdges(room:string='street'){
 if(room!=='street'&&room!=='yard')return []
 const f=oldStreetFloors[room]
 return (['W','E'] as const).flatMap(side=>{
  const gaps=oldStreetDoors().filter(d=>d.room===room&&d.side===side).map(d=>({start:d.position.y-28,end:d.position.y+28})).sort((a,b)=>a.start-b.start)
  const spans:Array<{start:number;end:number}>=[];let cursor=f.y
  for(const gap of gaps){if(gap.start>cursor)spans.push({start:cursor,end:gap.start});cursor=Math.max(cursor,gap.end)}
  if(cursor<f.y+f.h)spans.push({start:cursor,end:f.y+f.h})
  return spans.map(s=>({side,x:side==='W'?0:f.x+f.w,y:s.start,width:side==='W'?f.x:384-f.x-f.w,height:s.end-s.start}))
 })
}
