import {useEffect,useRef,useState} from 'react'
import {oldStreetKnownMap,oldStreetKnownRoute} from './old-street-map'
import {oldStreetRooms,type OldStreetRoom} from './old-street-cartridge'
import type {StorySave,Locale} from './vendor/original-train/types'
const positions:Record<OldStreetRoom,[number,number]>={darkroom:[315,180],cellar:[60,50],shed:[180,50],roof:[300,50],laundry:[60,150],yard:[180,150],photo:[300,150],shop:[60,250],street:[180,250]}
export function OldStreetMapView({save,room,locale,onClose}:{save:StorySave;room:OldStreetRoom;locale:Locale;onClose:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,label=(id:OldStreetRoom)=>oldStreetRooms[id][locale==='zh'?0:1]
 const [destination,setDestination]=useState(room),dialog=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 const close=()=>{dialog.current?.close();onClose()}
 const map=oldStreetKnownMap(save),route=oldStreetKnownRoute(save,room,destination)
 return <dialog className="os-map" ref={dialog} aria-labelledby="os-map-title" onCancel={e=>{e.preventDefault();close()}}>
  <header><h2 id="os-map-title">{t('街区','Neighbourhood')}</h2><button onClick={close} autoFocus>{t('收起地图','Close map')}</button></header>
  <p>{t('你在这里：','You are here: ')}<strong>{label(room)}</strong></p>
  <div className="os-map__diagram">
   <svg viewBox="0 0 360 300" aria-hidden="true">{map.connections.map(e=><line key={e.id} x1={positions[e.a][0]} y1={positions[e.a][1]} x2={positions[e.b][0]} y2={positions[e.b][1]} stroke="currentColor" strokeWidth="2" strokeDasharray={e.open?undefined:'5 5'}/>)}</svg>
   {map.rooms.map(r=><button key={r.id} aria-pressed={destination===r.id} aria-current={room===r.id?'location':undefined} onClick={()=>setDestination(r.id)} style={{left:`${positions[r.id][0]/3.6}%`,top:`${positions[r.id][1]/3}%`}}>{label(r.id)}</button>)}
  </div>
  <p className="os-map__route" role="status">{destination===room?t('你就在这里。','You are already here.'):route?route.map(label).join(' → '):t('已知通道暂时无法到达这里。','No known open route reaches this place yet.')}</p>
  {map.connections.filter(e=>!e.open).map(e=><p className="os-map__blocked" key={e.id}>{label(e.a)} — {label(e.b)}：{t(e.gate==='crates-cleared'?'旧箱挡路':'门闩未打开',e.gate==='crates-cleared'?'blocked by crates':'latched')}</p>)}
  <small>{t('地点连接示意 · 只记下已到访的地方','Connections between places you have visited')}</small>
 </dialog>
}
