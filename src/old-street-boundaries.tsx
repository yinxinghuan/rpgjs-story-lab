import {oldStreetBuildingEdges,oldStreetBuildingRoofs} from './old-street-boundary-layout'
import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** Facade beneath continuous roof strips. Door recesses use authoritative endpoints. */
export function OldStreetBuildingEdges({room='street'}:{room?:string;image?:string}){
 if(room!=='street'&&room!=='yard')return null
 const f=oldStreetFloors[room]
 return <g data-building-facades={room}>
  {oldStreetBuildingEdges(room).map((r,i)=><g key={i}>
   <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={r.side==='W'?'#6c7056':'#626e6c'}/>
   <path d={`M${r.x} ${r.y+8}h${r.width}M${r.x} ${r.y+r.height-8}h${r.width}`} stroke="#97977c" opacity=".45"/>
   <path d={`M${r.x} ${r.y}h${r.width}M${r.x} ${r.y+r.height}h${r.width}`} stroke={r.side==='W'?'#9b7e50':'#7e8b88'} strokeWidth="2"/>
   <path d={`M${r.x+(r.side==='W'?r.width-1:1)} ${r.y}v${r.height}`} stroke="#343d36" strokeWidth="1.5"/>
  </g>)}
  {oldStreetDoors().filter(d=>d.room===room&&(d.side==='W'||d.side==='E')).map(d=>{
   const x=d.side==='W'?0:d.position.x,w=d.side==='W'?f.x:384-f.x-f.w
   return <g key={d.id}>
    <rect x={x} y={d.position.y-27} width={w} height="54" fill={d.side==='W'?'#3a392b':'#29343b'}/>
    <path d={`M${x} ${d.position.y-27}h${w}M${x} ${d.position.y+27}h${w}`} stroke={d.side==='W'?'#a58b5c':'#93a196'} strokeWidth="2"/>
   </g>
  })}
 </g>
}
/** One building mass along each hub boundary, with entrances underneath its eaves. */
export function OldStreetEntranceEaves({room,image}:{room:string;image?:string}){
 const roofs=oldStreetBuildingRoofs(room);if(!roofs.length)return null
 const doors=oldStreetDoors().filter(d=>d.room===room)
 return <g data-entrance-eaves={room}>
  {roofs.map(r=>{
   const west=r.side==='W',edge=west?r.x+r.width:r.x,sourceWidth=west?234:230,tileHeight=1008/sourceWidth*40,id=`os-building-roof-${room}-${r.side}`
   // Fixed density and crop: narrower borders clip the outer roof, not shrink the tiles.
   return <g key={r.side}>
    {image&&<defs><pattern id={id} x={west?edge-40:r.x} y={r.y} width="40" height={tileHeight} patternUnits="userSpaceOnUse"><svg width="40" height={tileHeight} viewBox={`${west?0:282} 8 ${sourceWidth} 1008`} overflow="hidden"><image href={image} width="512" height="1024" style={{imageRendering:'pixelated'}}/></svg></pattern></defs>}
    <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={image?`url(#${id})`:west?'#59634b':'#47545a'}/>
    <path d={`M${edge} ${r.y}v${r.height}`} stroke="#29372f" strokeWidth="2"/>
    <path d={`M${r.x} ${r.y}h${r.width}M${r.x} ${r.y+r.height}h${r.width}`} stroke={west?'#9b8c66':'#8a9893'} strokeWidth="2"/>
    {doors.filter(d=>d.side===r.side).map(d=><g key={d.id}><rect x={west?edge:edge-6} y={d.position.y-24} width="6" height="48" fill="#192820" opacity=".5"/></g>)}
   </g>
  })}
 </g>
}
