import type {RpgClientEngine} from '@rpgjs/client'
import {getSpace,onPosition} from '../src/space-bridge'
// Opt-in build instrumentation; no storage, network, credentials or save access.
export function attachPerformanceProbe(engine:RpgClientEngine){
 const panel=document.createElement('aside'),start=document.createElement('button'),duration=document.createElement('select'),result=document.createElement('textarea')
 panel.setAttribute('aria-label','性能采样');panel.style.cssText='position:fixed;left:4px;top:112px;z-index:20000;max-width:300px;background:#101820;color:white;padding:4px;font:12px monospace'
 start.textContent='开始采样';start.style.cssText='font-size:12px;min-height:44px;background:#263d50;color:white'
 result.setAttribute('aria-label','性能报告');result.readOnly=true;result.style.cssText='display:none;width:280px;height:150px;font:10px monospace'
 duration.setAttribute('aria-label','采样时长');duration.innerHTML='<option value=10000>10 秒</option><option value=30000>30 秒</option>';panel.append(start,duration,result);document.body.append(panel)
 let focusEvents:Array<{type:string;t:number;position:unknown}>=[],maxStepWorld=0,unfocusedDistance=0,unfocused=false
 let active=false,started=0,last=0,intervals:number[]=[],movingIntervals:number[]=[],longTasks:number[]=[],distance=0,position=getSpace()?.position(),renderPosition=position,visibilityChanges=0,hidden=false
 const listener={postrender(){if(!active||document.hidden){last=0;return}const now=performance.now(),p=getSpace()?.position();if(last){const dt=now-last;intervals.push(dt);if(p&&renderPosition&&Math.hypot(p.x-renderPosition.x,p.y-renderPosition.y)>0.001)movingIntervals.push(dt)}last=now;renderPosition=p}}
 engine.renderer.runners.postrender.add(listener)
 onPosition(p=>{if(active&&position){const step=Math.hypot(p.x-position.x,p.y-position.y);distance+=step;maxStepWorld=Math.max(maxStepWorld,step);if(unfocused)unfocusedDistance+=step};position=p})
 for(const type of ['blur','focus'])window.addEventListener(type,()=>{unfocused=type==='blur';if(active)focusEvents.push({type,t:performance.now()-started,position:getSpace()?.position()})})
 document.addEventListener('visibilitychange',()=>{if(active){visibilityChanges++;hidden||=document.hidden;last=0}})
 let observer:PerformanceObserver|undefined
 if(PerformanceObserver.supportedEntryTypes.includes('longtask')){observer=new PerformanceObserver(list=>{if(active)longTasks.push(...list.getEntries().map(e=>e.duration))});observer.observe({type:'longtask'})}
 const summary=(values:number[])=>{const sorted=[...values].sort((a,b)=>a-b),n=sorted.length;return {samples:n,medianMs:n?sorted[Math.floor(n*.5)]:null,p95Ms:n?sorted[Math.min(n-1,Math.floor(n*.95))]:null,maxMs:n?sorted[n-1]:null,over40ms:values.filter(v=>v>40).length}}
 start.onclick=()=>{if(active||!getSpace())return;active=true;started=performance.now();last=0;intervals=[];movingIntervals=[];longTasks=[];distance=0;visibilityChanges=0;focusEvents=[];maxStepWorld=0;unfocusedDistance=0;unfocused=!document.hasFocus();hidden=document.hidden;position=getSpace()!.position();renderPosition=position;result.style.display='none';start.textContent='正在采样，可移动';start.disabled=true;duration.disabled=true
 setTimeout(()=>{active=false;const report={schema:'carriage-render-performance-v1',elapsedMs:performance.now()-started,viewport:{width:innerWidth,height:innerHeight,dpr:devicePixelRatio},renderer:{width:engine.renderer.width,height:engine.renderer.height,resolution:engine.renderer.resolution,bufferWidth:engine.renderer.canvas.width,bufferHeight:engine.renderer.canvas.height},scene:getSpace()?.scene(),renderedEvents:getSpace()?.renderedEvents().length,renderIntervals:summary(intervals),movingRenderIntervals:summary(movingIntervals),distanceWorld:distance,maxStepWorld,unfocusedDistance,focusEvents,longTasks:observer?{count:longTasks.length,totalMs:longTasks.reduce((a,b)=>a+b,0),maxMs:Math.max(0,...longTasks)}:null,visibilityChanges,hiddenDuringSample:hidden,environment:navigator.userAgent,interpretation:'Render submissions on this browser, not GPU presentation times or iPhone measurements'};result.value=JSON.stringify(report);result.style.display='block';console.info('CARRIAGE_PERFORMANCE',JSON.stringify(report));start.textContent='开始采样';start.disabled=false;duration.disabled=false},Number(duration.value))
 }
}
