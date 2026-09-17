import {useEffect,useRef,useState} from 'react'
import {oldStreetKnownMap,oldStreetKnownRoute} from './old-street-map'
import {oldStreetDoors} from './old-street-space'
import {oldStreetLocalMap} from './old-street-map-layout'
import {oldStreetRooms,type OldStreetRoom} from './old-street-cartridge'
import type {StorySave,Locale} from './vendor/original-train/types'
import './old-street-map-view.css'

const marks:Record<OldStreetRoom,string>={
 street:'M12 21V3M5 5H19V10H5ZM8 21H16',shop:'M12 4A8 8 0 1 0 12 20A8 8 0 1 0 12 4M12 7V12L16 14',
 photo:'M3 7H7L9 4H15L17 7H21V20H3ZM12 10A4 4 0 1 0 12 18A4 4 0 1 0 12 10',
 laundry:'M10 6C10 2 15 2 15 6C15 8 12 8 12 10L3 17V19H21V17L12 10',
 yard:'M12 21V13M8 21H16M12 3L5 11H8L4 16H20L16 11H19Z',
 cellar:'M3 20H8V15H13V10H18V5H21M3 5V13M1 11L3 13L5 11',
 archive:'M3 5H21V21H3ZM3 11H21M3 16H21M7 7V9M11 7V9M15 7V9M7 12V15M12 12V15',
 darkroom:'M5 9H19V21H5ZM5 17L10 13L15 18L18 15M10 3H14M12 3V7',
 roof:'M3 21V11H21V21M3 16H21M7 11V16M12 11V16M17 11V16M5 8H19M8 5H16',
 shed:'M3 21V9L12 3L21 9V21ZM8 21V13H16V21M10 8H14',
}
function Landmark({room}:{room:OldStreetRoom}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={marks[room]}/></svg>}
function Passage({kind,locked=false}:{kind:string;locked?:boolean}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={locked?'M7 10V7A5 5 0 0 1 17 7V10M5 10H19V21H5ZM12 14V17':kind==='stairs'?'M3 21H8V16H13V11H18V6H21':kind==='door'?'M6 21V3H18V21M3 21H21M14 12H14.1':'M3 12H21M16 7L21 12L16 17'}/></svg>}

export function OldStreetMapView({save,room,locale,onClose}:{save:StorySave;room:OldStreetRoom;locale:Locale;onClose:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,label=(id:OldStreetRoom)=>oldStreetRooms[id][locale==='zh'?0:1]
 const [destination,setDestination]=useState(room),dialog=useRef<HTMLDialogElement>(null),scroll=useRef<HTMLDivElement>(null),picker=useRef<HTMLDetailsElement>(null)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 useEffect(()=>{
  const area=scroll.current,current=area?.querySelector('[aria-current="location"]')
  if(!area||!current)return
  const a=area.getBoundingClientRect(),b=current.getBoundingClientRect()
  if(b.top<a.top||b.bottom>a.bottom)area.scrollTop+=b.top-a.top-(a.height-b.height)/2
 },[room])
 const choose=(id:OldStreetRoom)=>{setDestination(id);if(picker.current)picker.current.open=false;scroll.current?.scrollTo({top:0})}
 const close=()=>{dialog.current?.close();onClose()}
 const map=oldStreetKnownMap(save),route=oldStreetKnownRoute(save,room,destination)
 const exits=oldStreetLocalMap(room,new Set(map.rooms.map(r=>r.id)))
 const steps=route?.slice(1).map((to,i)=>({from:route[i],to,door:oldStreetDoors().find(d=>d.room===route[i]&&d.destination.room===to)}))??[]
 const instruction=(step:typeof steps[number])=>{
  const side=step.door?.side,kind=step.door?.kind
  const direction=side?({N:['上方','top'],S:['下方','bottom'],W:['左侧','left'],E:['右侧','right']} as const)[side]:['','']
  const via=kind==='stairs'?t('楼梯','stairs'):kind==='door'?t('门','door'):t('通路','passage')
  return t(`从场景${direction[0]}的${via}前往${label(step.to)}`,`In the scene, take the ${direction[1]} ${via} to ${label(step.to)}.`)
 }
 return <dialog className="os-map os-neighbourhood" ref={dialog} aria-labelledby="os-map-title" onCancel={e=>{e.preventDefault();close()}}>
  <header><div><h2 id="os-map-title">{t('地图','Map')}</h2></div><button onClick={close} autoFocus aria-label={t('收起地图','Close map')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 6L18 18M6 18L18 6"/></svg></button></header>
  <div className="os-neighbourhood__location"><span className="os-neighbourhood__pin" aria-hidden="true"/><span>{t('你在这里','YOU ARE HERE')}</span><strong>{label(room)}</strong></div>
  <div className="os-neighbourhood__scroll" ref={scroll}>
   <p className="os-neighbourhood__hint">{t('附近地点 · 方向与当前场景一致','Nearby · Same directions as your current scene')}</p>
   <div className={"os-neighbourhood__plan os-neighbourhood__local"+(exits.filter(e=>e.door.side==='W').length>1||exits.filter(e=>e.door.side==='E').length>1?' has-many-exits':'')}>
    <svg className="os-neighbourhood__roads" viewBox="0 0 340 460" preserveAspectRatio="none" aria-hidden="true">
     <rect className="os-neighbourhood__floor" x="116" y="110" width="108" height="230" rx="8"/>
     {exits.map(e=>{const open=!e.door.gate||save.facts[e.door.gate]===true,active=route?.[1]===e.door.destination.room;return <g key={e.door.id} className={'os-neighbourhood__road'+(!open?' is-closed':'')+(active?' is-route':'')}><path className="os-neighbourhood__road-bed" d={`M${e.point}L${e.label}`}/><path className="os-neighbourhood__road-line" d={`M${e.point}L${e.label}`}/><circle cx={e.point[0]} cy={e.point[1]} r="5" fill={active?'#335b4a':'#967653'}/></g>})}
    </svg>
    <div className="os-neighbourhood__origin" aria-current="location"><Landmark room={room}/><strong>{label(room)}</strong><span>{t('你在这里','You are here')}</span></div>
    {exits.map(e=>{const id=e.door.destination.room,chosen=destination===id,step=route?.indexOf(id)??-1,open=!e.door.gate||save.facts[e.door.gate]===true;return <button className={'os-neighbourhood__place'+(chosen?' is-destination':'')+(step===1?' is-route':'')} data-room={id} data-side={e.door.side} key={e.door.id} aria-label={label(id)} aria-pressed={chosen} onClick={()=>choose(id)} style={{left:`${e.label[0]/340*100}%`,top:`${e.label[1]/460*100}%`,width:'27%'}}><Landmark room={id}/><span>{label(id)}</span><small className="os-neighbourhood__exit-kind"><Passage kind={e.door.kind} locked={!open}/>{!open?t('未通','Blocked'):e.door.kind==='stairs'?t('楼梯','Stairs'):e.door.kind==='door'?t('门','Door'):t('通路','Path')}</small>{step===1?<span className="os-neighbourhood__step">1</span>:null}</button>})}
   </div>
   <details ref={picker} className="os-neighbourhood__destinations"><summary>{t('选择目的地','Choose destination')}</summary><div>{map.rooms.filter(r=>r.id!==room).map(r=><button key={r.id} aria-pressed={destination===r.id} onClick={()=>choose(r.id)}>{label(r.id)}</button>)}</div></details>
   <div className="os-neighbourhood__legend"><span><i/>{t('可通行','Open')}</span><span><i className="is-route"/>{t('所选路线','Your route')}</span><span><i className="is-closed"/>{t('暂不通行','Blocked')}</span></div>
   {map.connections.filter(e=>!e.open&&(e.a===room||e.b===room)).map(e=><p className="os-neighbourhood__blocked" key={e.id}><Passage kind={e.kind} locked/><span>{label(e.a)} — {label(e.b)}<small>{t(e.gate==='crates-cleared'?'旧箱挡路':e.gate==='yard-unlatched'?'门闩未打开':'通道尚未开放',e.gate==='crates-cleared'?'Crates block the way':e.gate==='yard-unlatched'?'The door is latched':'Passage not open yet')}</small></span></p>)}
   <small className="os-neighbourhood__note">{t('只显示到过的地点；远处地点可在“选择目的地”中查找。','Visited places only. Find more places under “Choose destination”.')}</small>
  </div>
  <section className="os-neighbourhood__directions" aria-label={t('路线指引','Directions')}>
   <div role="status"><span className="os-neighbourhood__eyebrow">{destination===room?t('当前位置','CURRENT LOCATION'):t('前往','DESTINATION')}</span><strong>{label(destination)}</strong><p>{destination===room?t('选择另一处已到访地点，查看路线。','Select another visited place for directions.'):steps[0]?instruction(steps[0]):t('已知通道暂时无法到达这里。','No known open route reaches this place yet.')}</p></div>
   {steps.length>1&&<details key={destination}><summary>{t(`完整路线 · ${steps.length} 段路`,`Full route · ${steps.length} passages`)}</summary><ol>{steps.map((s,i)=><li key={s.from}><span>{i+1}</span><div><strong>{label(s.from)}</strong><p>{instruction(s)}</p></div></li>)}</ol></details>}
  </section>
 </dialog>
}
