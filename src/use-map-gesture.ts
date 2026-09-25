import {useCallback,useEffect,useRef,useState,type PointerEvent,type MouseEvent} from 'react';
import {MapGesture,minZoom,type View} from './map-gesture';
/** Optional content dimensions support a fixed-size atlas; otherwise content fills viewport. */
export function useMapGesture(content?:{width:number;height:number}){
 const viewport=useRef<HTMLDivElement|null>(null),layer=useRef<HTMLDivElement|null>(null),model=useRef(new MapGesture({w:1,h:1})),frame=useRef(0),observer=useRef<ResizeObserver|null>(null),[zoom,setZoom]=useState(1);
 const syncSize=()=>{model.current.size={w:viewport.current?.clientWidth||1,h:viewport.current?.clientHeight||1,contentW:content?.width,contentH:content?.height}};
 const paint=()=>{if(!frame.current)frame.current=requestAnimationFrame(()=>{frame.current=0;const v=model.current.view;if(layer.current)layer.current.style.transform=`${content?'translate(-50%, -50%) ':''}translate3d(${v.x}px,${v.y}px,0) scale(${v.z})`})};
 const change=(v:View)=>{syncSize();model.current.set(v);paint()};
 const settle=()=>setZoom(model.current.view.z);
 const bindViewport=useCallback((node:HTMLDivElement|null)=>{observer.current?.disconnect();viewport.current=node;model.current.cancel();if(node){syncSize();change(model.current.view);observer.current=new ResizeObserver(()=>{syncSize();change(model.current.view);settle()});observer.current.observe(node)}},[content?.width,content?.height]);
 const bindLayer=useCallback((node:HTMLDivElement|null)=>{layer.current=node;if(node)paint()},[content?.width,content?.height]);
 const scale=(amount:number)=>{syncSize();model.current.zoom(amount);paint();settle()};
 const reset=()=>{syncSize();change({x:0,y:0,z:minZoom(model.current.size)});settle()};
 useEffect(()=>()=>{observer.current?.disconnect();cancelAnimationFrame(frame.current);model.current.cancel()},[]);
 const point=(e:PointerEvent<HTMLDivElement>)=>{const r=viewport.current!.getBoundingClientRect();return{x:e.clientX-r.left-r.width/2,y:e.clientY-r.top-r.height/2}};
 const handlers={onPointerDown:(e:PointerEvent<HTMLDivElement>)=>{if(e.button!==0)return;syncSize();model.current.down(e.pointerId,point(e));(e.target as Element).setPointerCapture(e.pointerId)},onPointerMove:(e:PointerEvent<HTMLDivElement>)=>{if(!model.current.points.has(e.pointerId))return;model.current.move(e.pointerId,point(e));paint()},onPointerUp:(e:PointerEvent<HTMLDivElement>)=>{model.current.up(e.pointerId);settle()},onPointerCancel:()=>{model.current.cancel();settle()},onLostPointerCapture:(e:PointerEvent<HTMLDivElement>)=>{model.current.up(e.pointerId);settle()},onClickCapture:(e:MouseEvent<HTMLDivElement>)=>{if(model.current.moved&&e.detail!==0){e.preventDefault();e.stopPropagation()}}};
 return {viewport:bindViewport,layer:bindLayer,handlers,zoom,minZoom:()=>minZoom(model.current.size),scale,reset,locate:(x:number,y:number,z=1.7)=>{syncSize();const s=model.current.size;change({x:(.5-x)*(s.contentW||s.w)*z,y:(.5-y)*(s.contentH||s.h)*z,z});settle()}};
}
