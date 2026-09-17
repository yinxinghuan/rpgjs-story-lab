import {oldStreetBuildingEdges} from './old-street-boundary-layout'
import {oldStreetDoors,oldStreetFloors} from './old-street-space'
/** Facade beneath continuous roof strips. Door recesses use authoritative endpoints. */
export function OldStreetBuildingEdges(_props:{image?:string}){
 return <g>
  {oldStreetBuildingEdges().map((r,i)=><g key={i}>
   <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={r.side==='W'?'#6c7056':'#626e6c'}/>
   <path d={`M${r.x} ${r.y+8}h${r.width}M${r.x} ${r.y+r.height-8}h${r.width}`} stroke="#97977c" opacity=".45"/>
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

/** Continuous roofing sits above the recessed entrance, never opens a hole at floor level. */
export function OldStreetEntranceEaves({room,image}:{room:string;image?:string}){
 const doors=oldStreetDoors().filter(d=>d.room===room&&d.kind==='door')
 if(room==='street')return <g data-entrance-eaves="street">
  {(['W','E'] as const).map(side=>{const x=side==='W'?0:344,edge=side==='W'?40:344,f=oldStreetFloors.street
   return <g key={side}>
    {image&&<defs><pattern id={'os-continuous-eave-'+side} x={x} y={f.y} width="40" height="174" patternUnits="userSpaceOnUse"><svg width="40" height="174" viewBox={`${side==='W'?0:282} 8 ${side==='W'?234:230} 1008`} overflow="hidden"><image href={image} width="512" height="1024" style={{imageRendering:'pixelated'}}/></svg></pattern></defs>}
    <rect x={x} y={f.y} width="40" height={f.h} fill={image?`url(#os-continuous-eave-${side})`:'#4b594b'}/>
    <path d={`M${edge} ${f.y}v${f.h}`} stroke="#29372f" strokeWidth="2"/>
    {doors.filter(d=>d.side===side).map(d=><g key={d.id}><rect x={side==='W'?40:338} y={d.position.y-24} width="6" height="48" fill="#192820" opacity=".5"/><path d={`M${side==='W'?1:345} ${d.position.y+28}h38`} stroke="#a49b7c" strokeWidth="2"/></g>)}
   </g>})}
 </g>
 if(room!=='yard')return null
 // Short roof returns frame courtyard doors without roofing over the stairs or alley.
 return <g data-entrance-eaves="yard">{doors.filter(d=>d.id.includes('shop-back')||d.id.includes('yard-latch')).map(d=>{const west=d.side==='W',x=west?-44:16;return <g key={d.id} transform={`translate(${d.position.x} ${d.position.y})`}>
  <rect x={x} y="-42" width="28" height="80" fill="#687453"/>
  {image&&<svg x={x} y="-42" width="28" height="80" viewBox={`${west?0:282} 80 ${west?234:230} 669`} preserveAspectRatio="none" overflow="hidden"><image href={image} width="512" height="1024" style={{imageRendering:'pixelated'}}/></svg>}
  <path d={`M${x} -42h28v80h-28Z`} stroke="#384637" strokeWidth="2" fill="none"/>
  <path d={`M${x} 38h28`} stroke="#a18a5c" strokeWidth="2"/>
  <rect x={west?-16:10} y="-24" width="6" height="48" fill="#192820" opacity=".5"/>
 </g>})}</g>
}
