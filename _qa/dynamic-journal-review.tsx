import React,{useEffect,useState} from 'react'
import {createRoot} from 'react-dom/client'
import {OldStreetJournalView} from '../src/old-street-journal-view'
import {OldStreetObjectPreview} from '../src/old-street-object-preview'
import type {OldStreetHead} from '../src/old-street-head'
import drawer from '../doc/oldstreet-pixel-study/drawer/cutout.png'
import cabinet from '../doc/oldstreet-pixel-study/props/orthogonal/cutout.png'
import '../src/old-street-dev.css'
const api=async(path:string,body?:unknown)=>{const r=await fetch('/qa-journal'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});if(!r.ok)throw Error('QA_REQUEST_FAILED');return r.headers.get('Content-Type')?.startsWith('image/png')?new Uint8Array(await r.arrayBuffer()):r.json()}
function Review(){
 const [head,setHead]=useState<OldStreetHead>(),[open,setOpen]=useState(false)
 useEffect(()=>{void api('/head').then(setHead)},[])
 return <main className="os-dev"><p>Synthetic journey · real platform media · no player save</p><button disabled={!head} onClick={()=>setOpen(true)}>Open dynamic backpack</button>{head&&<section style={{padding:20,maxWidth:360,background:'#233331',margin:'auto'}}><h2>Inline object preview</h2><OldStreetObjectPreview target="drawer" save={head.save} drawer={drawer} cabinet={cabinet}/><p>Object image stays in this panel. No enlargement button.</p></section>}{head&&open&&<OldStreetJournalView save={head.save} api={api} sessionId={head.id} onClose={()=>setOpen(false)}/>}</main>
}
createRoot(document.getElementById('root')!).render(<Review/>);
