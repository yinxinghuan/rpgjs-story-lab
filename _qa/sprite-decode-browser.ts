import {decodeSpritePixels} from '../src/sprite-browser-io'
import {inspectSpritePng} from '../src/sprite-draft'
const output=document.querySelector('output')!
for(const pass of [1,2]){
 const button=document.createElement('button');button.textContent='检查第 '+pass+' 次解码中断';button.style.cssText='min-height:48px;margin:8px;font-size:18px';document.body.prepend(button)
 button.onclick=async()=>{
  for(const b of document.querySelectorAll('button'))b.disabled=true
  const original=HTMLImageElement.prototype.decode,controller=new AbortController();let calls=0,started=false
  try{
   const png=await inspectSpritePng(new Uint8Array(await (await fetch('./hero.png')).arrayBuffer()))
   HTMLImageElement.prototype.decode=function(){if(++calls===pass){started=true;setTimeout(()=>controller.abort(),500);return new Promise(()=>{})}return original.call(this)}
   let aborted=false
   try{await decodeSpritePixels(png,controller.signal)}catch(error){aborted=/SPRITE_DECODE|RESOURCE_ABORTED/.test(String(error))}
   HTMLImageElement.prototype.decode=original
   if(!started||!aborted)throw Error('Fault did not interrupt the requested decode pass')
   const raster=await decodeSpritePixels(png,new AbortController().signal)
   if(raster.width!==1086||raster.height!==1448||!raster.rgba.some(v=>v!==0))throw Error('Retry pixels missing')
   output.textContent='通过：第 '+pass+' 次解码已中断，真实 PNG 重试成功；1086 × 1448，像素非空。'
  }catch(error){output.textContent='失败：'+String(error)}finally{HTMLImageElement.prototype.decode=original;for(const b of document.querySelectorAll('button'))b.disabled=false}
 }
}
