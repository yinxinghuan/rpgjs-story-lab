import {decodeSpatialArt} from '../src/spatial-art-decode'
import {oldStreetEnvironmentArt} from '../src/old-street-environment-art'
async function run(delayed:boolean){
 const result=document.getElementById('result')!,host=document.getElementById('image')!
 host.replaceChildren();result.textContent='读取图片…'
 const bytes=await fetch(oldStreetEnvironmentArt.streetGround).then(r=>r.blob()),url=URL.createObjectURL(bytes)
 const start=performance.now(),events:{event:string;ms:number;width?:number;height?:number}[]=[]
 const record=(event:string,image?:HTMLImageElement)=>{events.push({event,ms:Math.round(performance.now()-start),...(image?{width:image.naturalWidth,height:image.naturalHeight}:{})});result.textContent=JSON.stringify(events,null,2)}
 try{
  const image=await decodeSpatialArt(url,{timeoutMs:1000,createImage:()=>{
   const image=new Image()
   image.addEventListener('load',()=>record('load',image))
   image.addEventListener('error',()=>record('error'))
   if(delayed)image.decode=()=>new Promise<void>(()=>{})
   return image
  }})
  record('ready',image);image.style.cssText='max-width:280px;height:auto';host.append(image)
 }catch(error){record(error instanceof Error?error.message:'failed')}
 finally{URL.revokeObjectURL(url)}
}
document.getElementById('run')!.onclick=()=>void run(false)
document.getElementById('delayed')!.onclick=()=>void run(true)
