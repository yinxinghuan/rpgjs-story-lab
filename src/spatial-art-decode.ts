/** Image decoding can stall independently of downloading (notably after a
 * mobile tab is suspended). Bound it without changing committed story state. */
export async function decodeSpatialArt(url:string,options:{signal?:AbortSignal;timeoutMs?:number;createImage?:()=>HTMLImageElement}={}){
 const image=(options.createImage??(()=>new Image()))()
 let timer:ReturnType<typeof setTimeout>|undefined
 let cancel:()=>void=()=>{}
 try{
  await new Promise<void>((resolve,reject)=>{
   let settled=false
   const finish=(error?:Error)=>{if(settled)return;settled=true;error?reject(error):resolve()}
   cancel=()=>finish(Error('ART_IMAGE_CANCELLED'))
   options.signal?.addEventListener('abort',cancel,{once:true})
   if(options.signal?.aborted){cancel();return}
   timer=setTimeout(()=>finish(Error('ART_IMAGE_TIMEOUT')),options.timeoutMs??10000)
   image.src=url
   Promise.resolve().then(()=>image.decode()).then(()=>finish(),()=>finish(Error('ART_IMAGE_DECODE_FAILED')))
  })
  return image
 }catch(error){image.src='';throw error}
 finally{if(timer!==undefined)clearTimeout(timer);options.signal?.removeEventListener('abort',cancel)}
}
