import React,{useLayoutEffect,useRef,useState} from 'react'

/** One captured pointer owns movement. Pause, a new route or focus loss releases
 * it, so an old held finger cannot restart movement when a menu closes. */
export default function MovementJoystick({disabled,onMove,destination,locale}:{disabled:boolean;onMove:(x:number,y:number)=>void;destination:unknown;locale:'zh'|'en'}){
 const element=useRef<HTMLButtonElement>(null),pointer=useRef<number|null>(null),move=useRef(onMove)
 move.current=onMove
 const [offset,setOffset]=useState({x:0,y:0})
 function stop(){
  const id=pointer.current;pointer.current=null
  if(id!==null&&element.current?.hasPointerCapture(id))element.current.releasePointerCapture(id)
  setOffset({x:0,y:0});move.current(0,0)
 }
 useLayoutEffect(()=>{if(disabled||destination)stop()},[disabled,destination])
 useLayoutEffect(()=>{const hidden=()=>{if(document.hidden)stop()};window.addEventListener('blur',stop);document.addEventListener('visibilitychange',hidden);return()=>{window.removeEventListener('blur',stop);document.removeEventListener('visibilitychange',hidden);move.current(0,0)}},[])
 function update(e:React.PointerEvent<HTMLButtonElement>){
  if(disabled||pointer.current!==e.pointerId)return
  const r=e.currentTarget.getBoundingClientRect(),dx=e.clientX-r.left-r.width/2,dy=e.clientY-r.top-r.height/2,d=Math.hypot(dx,dy),radius=24
  const scale=d>radius?radius/d:1,x=dx*scale,y=dy*scale
  setOffset({x,y});if(d<=4)move.current(0,0);else move.current(x/radius,y/radius)
 }
 function start(e:React.PointerEvent<HTMLButtonElement>){
  if(disabled||pointer.current!==null||e.button!==0)return
  e.preventDefault();pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e)
 }
 const end=(e:React.PointerEvent<HTMLButtonElement>)=>{if(pointer.current===e.pointerId)stop()}
 return <button ref={element} type="button" className="og-joystick" disabled={disabled} aria-label={locale==='zh'?'移动摇杆：拖动行走，松手停止':'Movement joystick: drag to move, release to stop'} onPointerDown={start} onPointerMove={update} onPointerUp={end} onPointerCancel={end} onLostPointerCapture={end} onBlur={stop} onClick={e=>e.preventDefault()}>
  <span className="og-joystick__knob" style={{transform:`translate(${offset.x}px,${offset.y}px)`}}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v18M3 12h18M8 7l4-4 4 4M8 17l4 4 4-4M7 8l-4 4 4 4M17 8l4 4-4 4"/></svg></span>
 </button>
}
