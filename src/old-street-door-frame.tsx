import type {oldStreetDoors} from './old-street-space'
type Door=ReturnType<typeof oldStreetDoors>[number]
/** Uprights project up-screen. Only horizontal thresholds follow the travel axis. */
export function OldStreetDoorFrame({door:d,closed,woodImage}:{door:Door;closed:boolean;woodImage?:string}){
 const studio=d.id.includes('studio'),watch=d.id.includes('shop'),frame=studio?'#485b60':watch?'#61664b':'#665c48',trim=studio?'#a6afa1':'#b6a17a'
 const side=d.side==='W'||d.side==='E',sgn=d.side==='W'?-1:1
 if(side)return <g data-door-frame="side" transform={`translate(${d.position.x} ${d.position.y})`}>
  {/* An inset under the eave, connected to a flush stone threshold. */}
  <rect x="-19" y="-25" width="38" height="50" fill="#292e29"/>
  <rect x={sgn<0?3:-19} y="-23" width="16" height="46" fill="#827e68"/>
  <path d="M-16-22H16M-16 0H16M-16 22H16" stroke="#b7ae91" strokeWidth="1"/>
  <path d={`M${sgn*14} -25V25`} stroke="#181f1c" strokeWidth="7" opacity=".5"/>
  {[-28,25].map(y=><g key={y}><rect x="-20" y={y-6} width="40" height="9" fill={frame}/><path d={`M-19 ${y-6}H19`} stroke={trim} strokeWidth="2"/><path d={`M-18 ${y+3}H18`} stroke="#333c32" strokeWidth="2"/></g>)}
  {closed?<g><rect x="-5" y="-24" width="10" height="48" fill="#78654b"/>{woodImage&&<image href={woodImage} x="-5" y="-24" width="10" height="48" preserveAspectRatio="none"/>}<path d="M-5-24V24M5-24V24" stroke="#3c3c31" strokeWidth="2"/><path d="M-7-4H7M-7 4H7" stroke="#b2a386" strokeWidth="2"/><rect x="-3" y="-6" width="6" height="12" fill="#414b44"/></g>:<g><path d={`M${sgn*8}-25H${sgn*28}V-19H${sgn*8}Z`} fill="#806b4b" stroke="#363c30" strokeWidth="1"/><path d={`M${sgn*10}-24H${sgn*25}`} stroke={trim}/></g>}
 </g>
 const base=d.side==='S'?8:0,top=base-64
 return <g data-door-frame="front" transform={`translate(${d.position.x} ${d.position.y})`}>
  <rect x="-28" y={top} width="56" height="64" fill="#343a31"/>
  <rect x="-21" y={top+6} width="42" height="58" fill="#202822"/>
  <path d={`M-20 ${base-15}H20V${base+3}H-20Z`} fill="#807c66"/>
  <path d={`M-23 ${base+3}H23M-20 ${base-3}H20`} stroke="#b6ad90" strokeWidth="2"/>
  {[-28,21].map(x=><g key={x}><rect x={x} y={top+3} width="7" height="61" fill={frame}/><path d={`M${x+2} ${top+5}V${base-1}`} stroke={trim}/><rect x={x-1} y={base-6} width="9" height="7" fill="#807d64"/></g>)}
  <rect x="-30" y={top} width="60" height="7" fill={frame}/><path d={`M-29 ${top}H29`} stroke={trim} strokeWidth="2"/>
  <path d={`M-21 ${top+8}H21`} stroke="#0e1915" strokeWidth="3"/>
  {closed?<g><rect x="-20" y={top+8} width="40" height="52" fill="#7c684b"/>{woodImage&&<image href={woodImage} x="-20" y={top+8} width="40" height="52" preserveAspectRatio="none" style={{imageRendering:'pixelated'}}/>}<rect x="-16" y={top+13} width="32" height="20" fill="none" stroke="#443f31" strokeWidth="2"/><rect x="-16" y={top+38} width="32" height="17" fill="none" stroke="#443f31" strokeWidth="2"/><path d={`M-16 ${top+14}H15M-16 ${top+39}H15`} stroke={trim}/><rect x="10" y={top+32} width="4" height="8" fill="#302f29"/><path d={`M12 ${top+35}h5`} stroke="#c2a96a" strokeWidth="2"/></g>:<g>
   <path d={`M-21 ${top+8}L-36 ${top+16}V${base+8}L-21 ${base}Z`} fill="#68573d" stroke="#38382b" strokeWidth="2"/>
   {woodImage&&<g transform={`matrix(.375 -.2 0 1 -36 ${top+16})`}><image href={woodImage} width="40" height="52" preserveAspectRatio="none" style={{imageRendering:'pixelated'}}/></g>}
   <path d={`M-24 ${top+14}L-33 ${top+19}V${base}L-24 ${base-5}Z`} fill="none" stroke={trim} strokeWidth=".8"/><path d={`M-32 ${base-22}v5`} stroke="#c6ac74" strokeWidth="2"/>
  </g>}
 </g>
}
