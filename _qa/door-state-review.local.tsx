import stoneImage from '../doc/oldstreet-stone-stair/correction/candidate.png'
import React from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetDoorways} from '../src/old-street-door-view'
import {oldStreetDoors} from '../src/old-street-space'
import cratesImage from '../doc/oldstreet-crates/cutout.png'
const cases=[{room:'cellar' as const,gate:'crates-cleared',label:'地下室 · 箱子挡路',open:false},{room:'cellar' as const,gate:'crates-cleared',label:'地下室 · 清开后',open:true},{room:'shed' as const,gate:'yard-unlatched',label:'院门 · 插销关闭',open:false},{room:'shed' as const,gate:'yard-unlatched',label:'院门 · 已打开',open:true}]
createRoot(document.getElementById('root')!).render(<main style={{display:'grid',gridTemplateColumns:'repeat(2,minmax(0,1fr))',maxWidth:500,margin:'auto'}}>{cases.map(c=>{const d=oldStreetDoors().find(d=>d.room===c.room&&d.gate===c.gate)!;return <section key={c.label}><h3 style={{fontSize:16,padding:8}}>{c.label}</h3><svg viewBox={`${d.position.x-60} ${d.position.y-60} 120 120`} style={{width:'100%',background:'#bdb6a3'}}><OldStreetDoorways room={c.room} facts={{[c.gate]:c.open}} cratesImage={cratesImage} stoneImage={stoneImage}/></svg></section>})}</main>)
