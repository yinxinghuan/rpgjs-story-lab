import {oldStreetBuildingEdges} from './old-street-boundary-layout'
/** Cutaway masonry frames real entrances; never supplies a collision map. */
export function OldStreetBuildingEdges(){
 return <g>{oldStreetBuildingEdges().map((r,i)=><g key={i}>
  <rect x={r.x} y={r.y} width={r.width} height={r.height} fill={r.side==='W'?'#6e6956':'#73715e'}/>
  <rect x={r.x+(r.side==='W'?20:0)} y={r.y} width="8" height={r.height} fill="#9c9479"/>
  {Array.from({length:Math.floor(r.height/16)},(_,row)=><path key={row} d={`M${r.x} ${r.y+(row+1)*16}h28m-${row%2?9:18} 0v-16`} fill="none" stroke="#4f5147" strokeWidth=".8" opacity=".65"/>)}
  <path d={`M${r.x} ${r.y}h28M${r.x} ${r.y+r.height}h28`} stroke="#c0b294" strokeWidth="3"/>
  <path d={`M${r.x+(r.side==='W'?27:1)} ${r.y}v${r.height}`} stroke="#4a493b" strokeWidth="2"/>
  {r.height>100&&<g><rect x={r.x+5} y={r.y+r.height*.44} width="17" height="36" fill="#454d45" stroke="#a28a60" strokeWidth="2"/><path d={`M${r.x+13.5} ${r.y+r.height*.44}v36M${r.x+5} ${r.y+r.height*.44+18}h17`} stroke="#796e53" strokeWidth="1.5"/></g>}
 </g>)}</g>
}
