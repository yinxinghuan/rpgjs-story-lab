import {oldStreetBuildingEdges} from './old-street-boundary-layout'
import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** Reviewed top-down eaves only. The generated white seam never enters a crop.
 * Equal x/y scale preserves tile sizes; whole strips repeat instead of stretching
 * to fit each building span. Door gaps come from the authoritative map. */
export function OldStreetBuildingEdges({image}:{image?:string}){
 const floor=oldStreetFloors.street
 return <g>
  {image&&<defs>{(['W','E'] as const).map(side=>{
   const sourceWidth=side==='W'?234:230,tileHeight=1008/sourceWidth*56
   return <pattern key={side} id={`os-street-eaves-${side}`} x={side==='W'?0:floor.x+floor.w} y={floor.y} width="56" height={tileHeight} patternUnits="userSpaceOnUse">
    <svg width="56" height={tileHeight} viewBox={`${side==='W'?0:282} 8 ${sourceWidth} 1008`} overflow="hidden">
     <image href={image} width="512" height="1024" style={{imageRendering:'pixelated'}}/>
    </svg>
   </pattern>
  })}</defs>}
  {oldStreetBuildingEdges().map((r,i)=><g key={i}>
   <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={r.side==='W'?'#555d3d':'#394752'}/>
   {image&&<rect x={r.x} y={r.y} width={r.width} height={r.height} fill={`url(#os-street-eaves-${r.side})`}/>}
   <path d={`M${r.x} ${r.y}h${r.width}M${r.x} ${r.y+r.height}h${r.width}`} stroke={r.side==='W'?'#9b7e50':'#7e8b88'} strokeWidth="2"/>
   <path d={`M${r.x+(r.side==='W'?r.width-1:1)} ${r.y}v${r.height}`} stroke="#343d36" strokeWidth="1.5"/>
  </g>)}
  {oldStreetDoors().filter(d=>d.room==='street'&&(d.side==='W'||d.side==='E')).map(d=><g key={d.id}>
   {/* A shallow inset behind the real threshold, not an additional entrance. */}
   <rect x={d.side==='W'?0:d.position.x} y={d.position.y-27} width="56" height="54" fill={d.side==='W'?'#3a392b':'#29343b'}/>
   <path d={`M${d.side==='W'?0:d.position.x} ${d.position.y-27}h56M${d.side==='W'?0:d.position.x} ${d.position.y+27}h56`} stroke={d.side==='W'?'#a58b5c':'#93a196'} strokeWidth="2"/>
  </g>)}
 </g>
}
