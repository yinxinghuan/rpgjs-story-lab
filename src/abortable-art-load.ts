/** Stop waiting for decoders that do not accept AbortSignal themselves.
 * Late results belong to the abandoned attempt, never its replacement. */
export function abortableArtLoad<T>(start:()=>Promise<T>,signal:AbortSignal,discard?:(value:T)=>void|Promise<unknown>):Promise<T>{
 if(signal.aborted)return Promise.reject(Error('RESOURCE_ABORTED'))
 return new Promise<T>((resolve,reject)=>{
  let settled=false,abandoned=false
  const abort=()=>{if(settled)return;settled=true;abandoned=true;signal.removeEventListener('abort',abort);reject(Error('RESOURCE_ABORTED'))}
  signal.addEventListener('abort',abort,{once:true})
  void Promise.resolve().then(()=>{if(signal.aborted)throw Error('RESOURCE_ABORTED');return start()}).then(value=>{
   if(abandoned){if(discard)void Promise.resolve().then(()=>discard(value)).catch(()=>{});return}
   settled=true;signal.removeEventListener('abort',abort);resolve(value)
  },error=>{if(settled)return;settled=true;signal.removeEventListener('abort',abort);reject(error)})
 })
}
