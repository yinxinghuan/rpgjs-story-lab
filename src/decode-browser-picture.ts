import {abortableArtLoad} from './abortable-art-load'
/** Caller owns the returned URL. Failure/cancellation releases it immediately. */
export async function decodeBrowserPicture(bytes:Uint8Array,signal:AbortSignal,size?:{width:number;height:number}){
 if(signal.aborted)throw Error('RESOURCE_ABORTED')
 const url=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'image/png'})),image=new Image()
 try{
  image.src=url
  await abortableArtLoad(()=>image.decode(),signal)
  if(size&&(image.naturalWidth!==size.width||image.naturalHeight!==size.height))throw Error('IMAGE_INVALID')
  return url
 }catch(error){URL.revokeObjectURL(url);throw error}
 finally{image.src=''}
}
