import {inspectSpritePng,verifySpritePng,type SpritePng} from './sprite-draft'
import type {PixelRaster} from './sprite-preparation'
import {abortableArtLoad} from './abortable-art-load'
export async function spritePreviewUrl(png:SpritePng,signal?:AbortSignal) {
  await verifySpritePng(png)
  if(signal?.aborted)throw Error('SPRITE_DECODE')
  const url=URL.createObjectURL(new Blob([new Uint8Array(png.bytes)],{type:'image/png'}))
  const image=new Image()
  try {image.src=url;await (signal?abortableArtLoad(()=>image.decode(),signal):image.decode());if(image.naturalWidth!==png.width||image.naturalHeight!==png.height)throw Error();return url}
  catch {URL.revokeObjectURL(url);throw Error('SPRITE_DECODE')}
  finally {image.src=''}
}
export async function decodeSpritePixels(png:SpritePng,signal?:AbortSignal):Promise<PixelRaster> {
  const url=await spritePreviewUrl(png,signal),image=new Image()
  try {
    image.src=url;await (signal?abortableArtLoad(()=>image.decode(),signal):image.decode())
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
