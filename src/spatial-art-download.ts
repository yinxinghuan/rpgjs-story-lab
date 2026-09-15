export type SpatialArtRequest={id:string;url:string}
/** Downloads only. Texture decoding and map readiness remain separate stages. */
export async function downloadSpatialArt(entries:readonly SpatialArtRequest[],options:{signal?:AbortSignal;timeoutMs?:number;progress?:(done:number,total:number)=>void;fetchImpl?:typeof fetch}={}){
 if(!entries.length||new Set(entries.map(e=>e.id)).size!==entries.length)throw Error('ART_DOWNLOAD_INVALID')
 const controller=new AbortController(),abort=()=>controller.abort(),timeout=setTimeout(abort,options.timeoutMs??25000)
 options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort()
 let done=0,issue:Error|undefined
 try{
  options.progress?.(0,entries.length)
  const results=await Promise.allSettled(entries.map(async e=>{
   try{
    const response=await (options.fetchImpl??fetch)(e.url,{signal:controller.signal})
    if(!response.ok)throw Error('ART_DOWNLOAD_FAILED:'+e.id)
    const blob=await response.blob()
    if(controller.signal.aborted)throw Error('ART_DOWNLOAD_TIMEOUT')
    if(!blob.size||blob.size>8*1024*1024)throw Error('ART_DOWNLOAD_INVALID:'+e.id)
    options.progress?.(++done,entries.length)
    return {id:e.id,blob}
   }catch(error){issue??=controller.signal.aborted?Error('ART_DOWNLOAD_TIMEOUT'):error instanceof Error&&error.message.startsWith('ART_DOWNLOAD_')?error:Error('ART_DOWNLOAD_FAILED:'+e.id);controller.abort();throw error}
  }))
  if(issue)throw issue
  const urls:Record<string,string>={}
  try{for(const result of results){if(result.status!=='fulfilled')throw Error('ART_DOWNLOAD_FAILED');urls[result.value.id]=URL.createObjectURL(result.value.blob)}return urls}
  catch(error){Object.values(urls).forEach(url=>URL.revokeObjectURL(url));throw error}
 }finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',abort)}
}
