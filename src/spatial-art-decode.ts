/** Prepare an image for DOM/SVG display or dimensions. A successful load with
 * natural dimensions is sufficient; decode() must not become the only gate.
 * GPU texture readiness is checked separately by the renderer. */
export async function decodeSpatialArt(url:string,options:{signal?:AbortSignal;timeoutMs?:number;createImage?:()=>HTMLImageElement}={}){
 const image=(options.createImage??(()=>new Image()))()
 let timer:ReturnType<typeof setTimeout>|undefined
 let cancel:()=>void=()=>{}
 try{
  await new Promise<void>((resolve,reject)=>{
   let settled=false
   const finish=(error?:Error)=>{if(settled)return;settled=true;error?reject(error):resolve()}
   const loaded=()=>image.complete&&image.naturalWidth>0&&image.naturalHeight>0
   image.onload=()=>{if(loaded())finish();else finish(Error('ART_IMAGE_DECODE_FAILED'))}
   image.onerror=()=>finish(Error('ART_IMAGE_DECODE_FAILED'))
   cancel=()=>finish(Error('ART_IMAGE_CANCELLED'))
   options.signal?.addEventListener('abort',cancel,{once:true})
   if(options.signal?.aborted){cancel();return}
   timer=setTimeout(()=>finish(Error('ART_IMAGE_TIMEOUT')),options.timeoutMs??10000)
   image.src=url
   if(loaded()){finish();return}
   Promise.resolve().then(()=>image.decode()).then(()=>finish(),()=>finish(Error('ART_IMAGE_DECODE_FAILED')))
  })
  return image
 }catch(error){image.src='';throw error}
 finally{if(timer!==undefined)clearTimeout(timer);image.onload=null;image.onerror=null;options.signal?.removeEventListener('abort',cancel)}
}
