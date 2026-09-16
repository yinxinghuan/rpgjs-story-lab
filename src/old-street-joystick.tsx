import React,{useCallback,useEffect,useRef,useState} from 'react'

/** Visual travel follows the same pointer vector as movement, within the rim. */
export default function OldStreetJoystick({label,disabled,move}:{label:string;disabled:boolean;move:(x:number,y:number)=>void}){
 const pointer=useRef<number|null>(null),root=useRef<HTMLDivElement>(null),moveRef=useRef(move)
 moveRef.current=move
 const [offset,setOffset]=useState({x:0,y:0,active:false})
 const reset=useCallback(()=>{
  const id=pointer.current;if(id===null)return
  pointer.current=null;setOffset({x:0,y:0,active:false});moveRef.current(0,0)
  if(root.current?.hasPointerCapture(id))root.current.releasePointerCapture(id)
 },[])
 useEffect(()=>{if(disabled)reset()},[disabled,reset])
 useEffect(()=>{
  const hidden=()=>{if(document.hidden)reset()}
  window.addEventListener('blur',reset);document.addEventListener('visibilitychange',hidden)
  return()=>{reset();window.removeEventListener('blur',reset);document.removeEventListener('visibilitychange',hidden)}
 },[reset])
 const update=(e:React.PointerEvent<HTMLDivElement>)=>{
  const r=e.currentTarget.getBoundingClientRect(),x=(e.clientX-r.left-r.width/2)/28,y=(e.clientY-r.top-r.height/2)/28
  const knob=e.currentTarget.firstElementChild as HTMLElement
  const radius=Math.max(0,(Math.min(r.width,r.height)-knob.offsetWidth)/2-1),length=Math.max(1,Math.hypot(x,y))
  setOffset({x:x/length*radius,y:y/length*radius,active:true})
  moveRef.current(x,y)
 }
 return <div ref={root} className="os-stick" role="group" aria-label={label} aria-disabled={disabled} data-active={offset.active?'true':'false'}
  onPointerDown={e=>{if(disabled||pointer.current!==null||e.button!==0)return;pointer.current=e.pointerId;e.currentTarget.setPointerCapture(e.pointerId);update(e)}}
  onPointerMove={e=>{if(pointer.current===e.pointerId&&!disabled)update(e)}}
  onPointerUp={e=>{if(pointer.current===e.pointerId)reset()}}
  onPointerCancel={e=>{if(pointer.current===e.pointerId)reset()}}
  onLostPointerCapture={e=>{if(pointer.current===e.pointerId)reset()}}>
  <span style={{transform:`translate(${offset.x}px, ${offset.y}px)`}}/>
 </div>
}
