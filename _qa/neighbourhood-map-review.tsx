import React,{useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetMapView} from '../src/old-street-map-view'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge,type OldStreetRoom} from '../src/old-street-cartridge'
import '../src/old-street-dev.css'
function Review(){
 const [open,setOpen]=useState(true),[locale,setLocale]=useState<'en'|'zh'>('en'),[scope,setScope]=useState('all'),[unlocked,setUnlocked]=useState(false)
 const room:OldStreetRoom='street',save=createInitialSave(oldStreetCartridge(locale))
 for(const n of save.map){n.visited=scope==='all'||n.id==='street';n.current=n.id===room}
 if(unlocked)Object.assign(save.facts,{'crates-cleared':true,'yard-unlatched':true,'archive-ready':true,'darkroom-ready':true})
 return <main className="os-dev"><div><button onClick={()=>setLocale(locale==='zh'?'en':'zh')}>中文 / English</button><button onClick={()=>setScope(scope==='all'?'one':'all')}>One / all rooms</button><button onClick={()=>setUnlocked(!unlocked)}>Unlock: {String(unlocked)}</button><button onClick={()=>setOpen(true)}>Open map</button></div>{open&&<OldStreetMapView save={save} room={room} locale={locale} onClose={()=>setOpen(false)}/>}</main>
}
createRoot(document.getElementById('root')!).render(<Review/>);
