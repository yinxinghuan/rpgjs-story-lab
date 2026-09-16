import React from 'react'
/** One small stroke family for the three persistent exploration tools. */
export function OldStreetToolIcon({kind}:{kind:'map'|'items'|'journeys'}){
 const path={map:'M3 5 9 3 15 5 21 3V19L15 21 9 19 3 21Z M9 3V19 M15 5V21',items:'M5 4H19V21H5Z M8 2V6 M16 2V6 M9 10H15 M9 14H15',journeys:'M8 5H21 M8 12H21 M8 19H21 M3 5H3.01 M3 12H3.01 M3 19H3.01'}[kind]
 return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={path}/></svg>
}
