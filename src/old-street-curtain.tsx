/** Gathered cloth at the laundry passage. Cosmetic only; the route stays open. */
export function OldStreetCurtain({side}:{side:'N'|'E'|'S'|'W'}){
 // Elevation always projects down-screen, independently of travel direction.
 if(side==='E'||side==='W')return <g transform={`rotate(${side==='E'?-90:-270})`}>
  <rect x="-10" y="-23" width="20" height="46" fill="#8e8a76"/>
  <path d="M-7-22V22M7-22V22" stroke="#c9c1a4" strokeWidth="2"/>
  <path d="M0-43V3" stroke="#454e45" strokeWidth="3"/>
  {[-23,23].map(y=><g key={y} transform={`translate(0 ${y})`}>
    <path d="M-7-20H7L3-8L7 0H-7L-3-8Z" fill={y<0?'#687d77':'#748780'} stroke="#394d49" strokeWidth="1"/>
    <path d="M-4-18L-1-8L-4-2M4-18L1-8L4-2" stroke="#a5b3a0" strokeWidth=".8" fill="none"/>
    <path d="M-4-8H4" stroke="#c4ad79" strokeWidth="2"/>
    <path d="M-5-2H5" stroke="#c0c1aa" strokeWidth=".7" strokeDasharray="1.5 1.2"/>
  </g>)}
 </g>

 return <g>
  <rect x="-23" y="-10" width="46" height="30" fill="#8e8a76"/>
  <path d="M-19 13H19M-19 18H19" stroke="#c9c1a4" strokeWidth="2"/>
  <path d="M-26-12V20M26-12V20" stroke="#625c49" strokeWidth="5"/>
  <path d="M-23-12L-13-10L-19 5L-13 19L-24 17Z" fill="#687d77" stroke="#394d49" strokeWidth="1"/>
  <path d="M23-12L13-10L19 5L13 19L24 17Z" fill="#748780" stroke="#394d49" strokeWidth="1"/>
  <path d="M-21-9L-20 4L-21 15M-17-8L-20 4L-16 16M21-9L20 4L21 15M17-8L20 4L16 16" stroke="#a5b3a0" strokeWidth=".8" fill="none"/>
  <path d="M-24 4L-18 6M18 6L24 4" stroke="#c4ad79" strokeWidth="2"/>
  <path d="M-24 14L-14 16M14 16L24 14" stroke="#c0c1aa" strokeWidth=".7" strokeDasharray="1.5 1.2"/>
  <path d="M-28-14H28" stroke="#464f46" strokeWidth="3"/>
  <path d="M-26-15H26" stroke="#b6ac8e" strokeWidth="1"/>
  {[-23,-18,18,23].map(x=><path key={x} d={`M${x}-15v5`} stroke="#b0a790" strokeWidth="1.5"/>)}
 </g>
}
