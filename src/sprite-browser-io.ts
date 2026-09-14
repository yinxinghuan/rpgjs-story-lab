import {inspectSpritePng,verifySpritePng,type SpritePng} from './sprite-draft'
import type {PixelRaster} from './sprite-preparation'
import {abortableArtLoad} from './abortable-art-load'
async function decodeImage(image:HTMLImageElement,signal?:AbortSignal) {
  const controller=new AbortController(),abort=()=>controller.abort()
  signal?.addEventListener('abort',abort,{once:true})
  if(signal?.aborted)abort()
  const timer=setTimeout(abort,15000)
  try {await abortableArtLoad(()=>image.decode(),controller.signal)}
  catch {throw Error('SPRITE_DECODE')}
  finally {clearTimeout(timer);signal?.removeEventListener('abort',abort)}
}
export async function spritePreviewUrl(png:SpritePng,signal?:AbortSignal) {
  await verifySpritePng(png)
  if(signal?.aborted)throw Error('SPRITE_DECODE')
  const url=URL.createObjectURL(new Blob([new Uint8Array(png.bytes)],{type:'image/png'}))
  const image=new Image()
  try {image.src=url;await decodeImage(image,signal);if(image.naturalWidth!==png.width||image.naturalHeight!==png.height)throw Error();return url}
  catch {URL.revokeObjectURL(url);throw Error('SPRITE_DECODE')}
  finally {image.src=''}
}
export async function decodeSpritePixels(png:SpritePng,signal?:AbortSignal):Promise<PixelRaster> {
  const url=await spritePreviewUrl(png,signal),image=new Image()
  try {
    image.src=url;await decodeImage(image,signal)
    const canvas=document.createElement('canvas');canvas.width=png.width;canvas.height=png.height
    const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)throw Error('SPRITE_DECODE')
    ctx.drawImage(image,0,0)
    return {width:png.width,height:png.height,rgba:ctx.getImageData(0,0,png.width,png.height).data}
  } finally {image.src='';URL.revokeObjectURL(url)}
}
export async function encodeSpritePixels(raster:PixelRaster):Promise<SpritePng> {
  const canvas=document.createElement('canvas');canvas.width=raster.width;canvas.height=raster.height
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('SPRITE_ENCODE')
  ctx.putImageData(new ImageData(new Uint8ClampedArray(raster.rgba),raster.width,raster.height),0,0)
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('SPRITE_ENCODE')),'image/png'))
  const png=await inspectSpritePng(new Uint8Array(await blob.arrayBuffer())),url=await spritePreviewUrl(png);URL.revokeObjectURL(url)
  return png
}
