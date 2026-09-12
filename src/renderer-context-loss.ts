/** A lost GPU context invalidates this page's renderer, not the story session.
 * Listen on the host in capture phase because the canvas event does not bubble.
 * Do not interfere with Pixi's own restoration handler. Reload is explicit. */
export function watchRendererContextLoss(host:EventTarget,onLost:()=>void){
 let failed=false,disposed=false
 const lost=(event:Event)=>{
  if(disposed||failed||(event.target as {nodeName?:string}|null)?.nodeName!=='CANVAS')return
  failed=true;onLost()
 }
 host.addEventListener('webglcontextlost',lost,true)
 return {failed:()=>failed,dispose:()=>{disposed=true;host.removeEventListener('webglcontextlost',lost,true)}}
}
