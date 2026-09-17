import {useEffect,useRef,useState} from 'react'
import {oldStreetKnownMap,oldStreetKnownRoute} from './old-street-map'
import {oldStreetDoors} from './old-street-space'
import {oldStreetRooms,type OldStreetRoom} from './old-street-cartridge'
import type {StorySave,Locale} from './vendor/original-train/types'
import './old-street-map-view.css'

const positions:Record<OldStreetRoom,[number,number]>={archive:[60,40],cellar:[60,165],shed:[180,110],roof:[300,110],laundry:[60,295],yard:[180,295],photo:[300,295],shop:[60,440],street:[180,440],darkroom:[300,445]}
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
 const [destination,setDestination]=useState(room),dialog=useRef<HTMLDialogElement>(null),scroll=useRef<HTMLDivElement>(null)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 useEffect(()=>{
  const area=scroll.current,current=area?.querySelector('[aria-current="location"]')
  if(!area||!current)return
  const a=area.getBoundingClientRect(),b=current.getBoundingClientRect()
  if(b.top<a.top||b.bottom>a.bottom)area.scrollTop+=b.top-a.top-(a.height-b.height)/2
 },[room])
 const close=()=>{dialog.current?.close();onClose()}
 const map=oldStreetKnownMap(save),route=oldStreetKnownRoute(save,room,destination)
 const points=map.rooms.map(r=>positions[r.id]),xs=points.map(p=>p[0]),ys=points.map(p=>p[1])
 const cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2
 const width=Math.max(270,Math.max(...xs)-Math.min(...xs)+120),height=Math.max(200,Math.max(...ys)-Math.min(...ys)+120)
 const left=cx-width/2,top=cy-height/2
 const steps=route?.slice(1).map((to,i)=>({from:route[i],to,door:oldStreetDoors().find(d=>d.room===route[i]&&d.destination.room===to)}))??[]
 const instruction=(step:typeof steps[number])=>{
  const side=step.door?.side,kind=step.door?.kind
  const direction=side?({N:['上方','top'],S:['下方','bottom'],W:['左侧','left'],E:['右侧','right']} as const)[side]:['','']
  const via=kind==='stairs'?t('楼梯','stairs'):kind==='door'?t('门','door'):t('通路','passage')
  return t(`从场景${direction[0]}的${via}前往${label(step.to)}`,`In the scene, take the ${direction[1]} ${via} to ${label(step.to)}.`)
 }
 return <dialog className="os-map os-neighbourhood" ref={dialog} aria-labelledby="os-map-title" onCancel={e=>{e.preventDefault();close()}}>
  <header><div><span className="os-neighbourhood__eyebrow">{t('探索手记','EXPLORER’S NOTES')}</span><h2 id="os-map-title">{t('旧街导览','Neighbourhood')}</h2></div><button onClick={close} autoFocus aria-label={t('收起地图','Close map')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 6L18 18M6 18L18 6"/></svg></button></header>
  <div className="os-neighbourhood__location"><span className="os-neighbourhood__pin" aria-hidden="true"/><span>{t('你在这里','YOU ARE HERE')}</span><strong>{label(room)}</strong></div>
  <div className="os-neighbourhood__scroll" ref={scroll}>
   <p className="os-neighbourhood__hint">{t('点一个地点，看看怎么走。','Choose a place to see the way there.')}</p>
   <div className="os-neighbourhood__plan" style={{aspectRatio:`${width}/${height}`}}>
    <svg className="os-neighbourhood__roads" viewBox={`${left} ${top} ${width} ${height}`} aria-hidden="true">
     {map.connections.map(e=>{const a=positions[e.a],b=positions[e.b],active=route?.some((id,i)=>i>0&&((route[i-1]===e.a&&id===e.b)||(route[i-1]===e.b&&id===e.a)));return <g key={e.id} className={'os-neighbourhood__road'+(!e.open?' is-closed':'')+(active?' is-route':'')}><path className="os-neighbourhood__road-bed" d={`M${a}L${b}`}/><path className="os-neighbourhood__road-line" d={`M${a}L${b}`}/></g>})}
    </svg>
    {map.connections.map(e=>{const a=positions[e.a],b=positions[e.b];return <span className={'os-neighbourhood__passage'+(!e.open?' is-closed':'')} key={e.id} style={{left:`${((a[0]+b[0])/2-left)/width*100}%`,top:`${((a[1]+b[1])/2-top)/height*100}%`}} aria-label={t(e.open?(e.kind==='stairs'?'楼梯':e.kind==='door'?'门':'通路'):'暂不通行',e.open?e.kind:'Blocked')}><Passage kind={e.kind} locked={!e.open}/></span>})}
    {map.rooms.map(r=>{const current=room===r.id,chosen=destination===r.id,step=route?.indexOf(r.id)??-1;return <button className={'os-neighbourhood__place'+(current?' is-current':'')+(chosen&&!current?' is-destination':'')+(step>0?' is-route':'')} data-room={r.id} key={r.id} aria-label={label(r.id)} aria-pressed={chosen} aria-current={current?'location':undefined} onClick={()=>setDestination(r.id)} style={{left:`${(positions[r.id][0]-left)/width*100}%`,top:`${(positions[r.id][1]-top)/height*100}%`,width:`${104/width*100}%`}}><Landmark room={r.id}/><span>{locale==='en'&&r.id==='archive'?'Archive':locale==='en'&&r.id==='shed'?'Workshop':label(r.id)}</span>{current?<span className="os-neighbourhood__here">{t('当前位置','YOU')}</span>:step>0?<span className="os-neighbourhood__step">{step}</span>:null}</button>})}
   </div>
   <div className="os-neighbourhood__legend"><span><i/>{t('可通行','Open')}</span><span><i className="is-route"/>{t('所选路线','Your route')}</span><span><i className="is-closed"/>{t('暂不通行','Blocked')}</span></div>
   {map.connections.filter(e=>!e.open).map(e=><p className="os-neighbourhood__blocked" key={e.id}><Passage kind={e.kind} locked/><span>{label(e.a)} — {label(e.b)}<small>{t(e.gate==='crates-cleared'?'旧箱挡路':e.gate==='yard-unlatched'?'门闩未打开':'通道尚未开放',e.gate==='crates-cleared'?'Crates block the way':e.gate==='yard-unlatched'?'The door is latched':'Passage not open yet')}</small></span></p>)}
   <small className="os-neighbourhood__note">{t('只记下走过的地方 · 连接示意，非等比例','Visited places only · Connections, not to scale')}</small>
  </div>
  <section className="os-neighbourhood__directions" aria-label={t('路线指引','Directions')}>
   <div role="status"><span className="os-neighbourhood__eyebrow">{destination===room?t('从这里出发','START HERE'):t('前往','DESTINATION')}</span><strong>{label(destination)}</strong><p>{destination===room?t('选择另一处已到访地点，查看路线。','Select another visited place for directions.'):steps[0]?instruction(steps[0]):t('已知通道暂时无法到达这里。','No known open route reaches this place yet.')}</p></div>
   {steps.length>1&&<details key={destination}><summary>{t(`完整路线 · ${steps.length} 段路`,`Full route · ${steps.length} passages`)}</summary><ol>{steps.map((s,i)=><li key={s.from}><span>{i+1}</span><div><strong>{label(s.from)}</strong><p>{instruction(s)}</p></div></li>)}</ol></details>}
  </section>
 </dialog>
}
