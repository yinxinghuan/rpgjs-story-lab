import {RoofMaterialSurface} from './roof-material-surface'
import {oldStreetRoofSections} from './old-street-roof-materials'
import {getRoofMaterial} from './material-library/roof-materials'
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
export function OldStreetEntranceEaves({room,image,variants}:{room:string;image?:string;variants?:string}){
 const roofs=oldStreetBuildingRoofs(room);if(!roofs.length)return null
 const doors=oldStreetDoors().filter(d=>d.room===room)
 return <g data-entrance-eaves={room}>
  {roofs.map(r=>{
   const west=r.side==='W',edge=west?r.x+r.width:r.x,sections=oldStreetRoofSections(room,r.side,r.y,r.height)
   return <g key={r.side}>
    {sections.map(section=><RoofMaterialSurface key={section.material} material={section.material} source={getRoofMaterial(section.material,{allowCandidate:true}).assetKey==='streetEdges'?image:variants} x={r.x} y={section.y} width={r.width} height={section.height} side={r.side}/>)}
    {sections.slice(1).map(section=><path key={section.material} d={`M${r.x} ${section.y}h${r.width}`} stroke="#414b3c" strokeWidth="2"/>)}
    <path d={`M${edge} ${r.y}v${r.height}`} stroke="#29372f" strokeWidth="2"/>
    <path d={`M${r.x} ${r.y}h${r.width}M${r.x} ${r.y+r.height}h${r.width}`} stroke={west?'#9b8c66':'#8a9893'} strokeWidth="2"/>
    {doors.filter(d=>d.side===r.side).map(d=><g key={d.id}><rect x={west?edge:edge-6} y={d.position.y-24} width="6" height="48" fill="#192820" opacity=".5"/></g>)}
   </g>
  })}
 </g>
}
