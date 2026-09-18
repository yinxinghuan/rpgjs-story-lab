import {useEffect,useRef,useState} from 'react'
import {oldStreetKnownMap,oldStreetKnownRoute} from './old-street-map'
import {oldStreetDoors} from './old-street-space'
import {OLD_STREET_ATLAS,OLD_STREET_ATLAS_BOUNDS} from './old-street-map-layout'
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
 const [destination,setDestination]=useState(room),dialog=useRef<HTMLDialogElement>(null),viewport=useRef<HTMLDivElement>(null)
 const atlas=OLD_STREET_ATLAS_BOUNDS,worldWidth=atlas.width*1.53,worldHeight=atlas.height*1.5
 const [camera,setCamera]=useState({x:0,y:0,zoom:1}),cameraRef=useRef(camera),pointers=useRef(new Map<number,{x:number;y:number}>()),moved=useRef(false)
 const setView=(next:typeof camera)=>{cameraRef.current=next;setCamera(next)}
 const bounded=(next:typeof camera)=>{const el=viewport.current;if(!el)return next;const dx=Math.max(0,(worldWidth*next.zoom-el.clientWidth)/2),dy=Math.max(0,(worldHeight*next.zoom-el.clientHeight)/2);return {...next,x:Math.max(-dx,Math.min(dx,next.x)),y:Math.max(-dy,Math.min(dy,next.y))}}
 const fitZoom=()=>{const el=viewport.current;return el?Math.min(1,el.clientWidth/worldWidth,el.clientHeight/worldHeight):.3}
 const fit=()=>setView({x:0,y:0,zoom:fitZoom()})
 const zoom=(value:number)=>{const c=cameraRef.current;setView(bounded({...c,zoom:Math.max(fitZoom(),Math.min(1.75,value))}))}
 const locate=()=>{const el=viewport.current;if(!el)return;const [x,y]=OLD_STREET_ATLAS[room],z=Math.max(1,cameraRef.current.zoom);setView(bounded({zoom:z,x:(.5-x/atlas.width)*worldWidth*z,y:(.5-y/atlas.height)*worldHeight*z}))}
 useEffect(()=>{const node=dialog.current;node?.showModal();locate();return()=>node?.close()},[])
 useEffect(()=>{const el=viewport.current;if(!el)return;let width=el.clientWidth,height=el.clientHeight;const observer=new ResizeObserver(()=>{const changed=Math.abs(el.clientWidth-width)>8||Math.abs(el.clientHeight-height)>80;width=el.clientWidth;height=el.clientHeight;if(changed)locate();else setView(bounded(cameraRef.current))});observer.observe(el);return()=>observer.disconnect()},[])
 const choose=(id:OldStreetRoom)=>setDestination(id)
 const close=()=>{dialog.current?.close();onClose()}
 const map=oldStreetKnownMap(save),route=oldStreetKnownRoute(save,room,destination)
 const steps=route?.slice(1).map((to,i)=>({from:route[i],to,door:oldStreetDoors().find(d=>d.room===route[i]&&d.destination.room===to)}))??[]
 const pointerDown=(e:React.PointerEvent<HTMLDivElement>)=>{if(e.pointerType==='mouse'&&e.button!==0)return;if(!pointers.current.size)moved.current=false;pointers.current.set(e.pointerId,{x:e.clientX,y:e.clientY})}
 const pointerMove=(e:React.PointerEvent<HTMLDivElement>)=>{
  const old=pointers.current.get(e.pointerId);if(!old)return
  const next={x:e.clientX,y:e.clientY},other=[...pointers.current.entries()].find(([id])=>id!==e.pointerId)?.[1],c=cameraRef.current
  if(Math.hypot(next.x-old.x,next.y-old.y)>3||other){moved.current=true;e.currentTarget.setPointerCapture(e.pointerId)}
  if(!moved.current)return
  pointers.current.set(e.pointerId,next)
  if(other){const before=Math.hypot(old.x-other.x,old.y-other.y),after=Math.hypot(next.x-other.x,next.y-other.y);if(before>0)zoom(c.zoom*after/before)}
  else setView(bounded({...c,x:c.x+next.x-old.x,y:c.y+next.y-old.y}))
 }
 const instruction=(step:typeof steps[number])=>{
  const side=step.door?.side,kind=step.door?.kind
  const direction=side?({N:['上方','top'],S:['下方','bottom'],W:['左侧','left'],E:['右侧','right']} as const)[side]:['','']
  const via=kind==='stairs'?t('楼梯','stairs'):kind==='door'?t('门','door'):t('通路','passage')
  return t(`从场景${direction[0]}的${via}前往${label(step.to)}`,`In the scene, take the ${direction[1]} ${via} to ${label(step.to)}.`)
 }
 return <dialog className="os-map os-neighbourhood os-atlas" ref={dialog} aria-labelledby="os-map-title" onCancel={e=>{e.preventDefault();close()}}>
  <header><div><h2 id="os-map-title">{t('地图','Map')}</h2></div><button onClick={close} autoFocus aria-label={t('收起地图','Close map')}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M6 6L18 18M6 18L18 6"/></svg></button></header>
  <div className="os-neighbourhood__location"><span className="os-neighbourhood__pin" aria-hidden="true"/><span>{t('你在这里','YOU ARE HERE')}</span><strong>{label(room)}</strong></div>
  <div className="os-atlas__tools" aria-label={t('地图操作','Map controls')}>
   <button onClick={fit}>{t('全图','Fit map')}</button><button onClick={locate}>{t('定位','Locate me')}</button>
   <span className="os-atlas__zoom"><button aria-label={t('缩小地图','Zoom out')} disabled={camera.zoom<=fitZoom()+.01} onClick={()=>zoom(camera.zoom-.25)}>−</button><button aria-label={t('放大地图','Zoom in')} disabled={camera.zoom>=1.75} onClick={()=>zoom(camera.zoom+.25)}>+</button></span>
  </div>
  <p className="os-atlas__hint">{t('拖动查看地图 · 双指缩放','Drag to explore · Pinch to zoom')}</p>
  <div className="os-atlas__viewport" ref={viewport} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={e=>pointers.current.delete(e.pointerId)} onPointerCancel={e=>pointers.current.delete(e.pointerId)} onLostPointerCapture={e=>pointers.current.delete(e.pointerId)} onClickCapture={e=>{if(moved.current&&e.detail!==0){e.stopPropagation();e.preventDefault()}}}>
   <div className="os-atlas__world" style={{width:worldWidth,height:worldHeight,transform:`translate(calc(-50% + ${camera.x}px),calc(-50% + ${camera.y}px)) scale(${camera.zoom})`}}>
    <svg className="os-neighbourhood__roads" viewBox={`0 0 ${atlas.width} ${atlas.height}`} preserveAspectRatio="none" aria-hidden="true">
     {map.connections.map(edge=>{const a=OLD_STREET_ATLAS[edge.a],b=OLD_STREET_ATLAS[edge.b],i=route?.indexOf(edge.a)??-1,active=i>=0&&(route?.[i+1]===edge.b||route?.[i-1]===edge.b);return <g key={edge.id} className={'os-neighbourhood__road'+(!edge.open?' is-closed':'')+(active?' is-route':'')}><path className="os-neighbourhood__road-bed" d={`M${a}L${b}`}/><path className="os-neighbourhood__road-line" d={`M${a}L${b}`}/></g>})}
    </svg>
    {map.connections.filter(e=>e.kind==='stairs'||!e.open).map(e=>{const a=OLD_STREET_ATLAS[e.a],b=OLD_STREET_ATLAS[e.b];return <span key={e.id} className={'os-neighbourhood__passage'+(!e.open?' is-closed':'')} style={{left:`${(a[0]+b[0])/(atlas.width*2)*100}%`,top:`${(a[1]+b[1])/(atlas.height*2)*100}%`}}><Passage kind={e.kind} locked={!e.open}/></span>})}
    {map.rooms.map(({id})=>{const p=OLD_STREET_ATLAS[id],step=route?.indexOf(id)??-1;return <button key={id} className={'os-atlas__place'+(id===room?' is-current':'')+(destination===id&&id!==room?' is-destination':'')+(step>=0?' is-route':'')} data-room={id} aria-current={id===room?'location':undefined} aria-pressed={destination===id} onClick={()=>choose(id)} style={{left:`${p[0]/atlas.width*100}%`,top:`${p[1]/atlas.height*100}%`}}><Landmark room={id}/><span>{label(id)}</span>{step>0&&<small className="os-neighbourhood__step">{step}</small>}</button>})}
   </div>
  </div>
  <div className="os-atlas__key"><span>{t('实线：路线','Solid: route')}</span><span>{t('虚线：未通','Dashed: blocked')}</span></div>
  <section className="os-neighbourhood__directions" aria-label={t('路线指引','Directions')}>
   <div role="status"><span className="os-neighbourhood__eyebrow">{destination===room?t('当前位置','CURRENT LOCATION'):t('前往','DESTINATION')}</span><strong>{label(destination)}</strong><p>{destination===room?t('选择另一处已到访地点，查看路线。','Select another visited place for directions.'):steps[0]?instruction(steps[0]):t('已知通道暂时无法到达这里。','No known open route reaches this place yet.')}</p></div>
   {steps.length>1&&<details key={destination}><summary>{t(`完整路线 · ${steps.length} 段路`,`Full route · ${steps.length} passages`)}</summary><ol>{steps.map((s,i)=><li key={s.from}><span>{i+1}</span><div><strong>{label(s.from)}</strong><p>{instruction(s)}</p></div></li>)}</ol></details>}
  </section>
 </dialog>
}
