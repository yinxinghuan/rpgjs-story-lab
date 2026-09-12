import React,{useEffect,useState} from 'react'
import type {OriginalIllustration} from './original-illustration-contract'

/** A comparison must use the persisted source, never today's scene binding. */
export default function OriginalReferencePicture({reference,locale}:{reference:NonNullable<OriginalIllustration['reference']>;locale:'zh'|'en'}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const [url,setUrl]=useState(''),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0)
 useEffect(()=>{
  const controller=new AbortController();let live=true,objectUrl=''
  setUrl('');setFailed(false)
  const timeout=setTimeout(()=>controller.abort(),20000)
  void(async()=>{try{
   const response=await fetch(reference.url,{signal:controller.signal,credentials:'omit',referrerPolicy:'no-referrer'})
   if(!response.ok||!response.body)throw Error('REFERENCE_UNAVAILABLE')
   const reader=response.body.getReader(),parts:Uint8Array[]=[];let length=0
   while(true){const part=await reader.read();if(part.done)break;length+=part.value.length;if(length>8388608){await reader.cancel();throw Error('REFERENCE_TOO_LARGE')}parts.push(part.value)}
   const bytes=new Uint8Array(length);let offset=0;for(const part of parts){bytes.set(part,offset);offset+=part.length}
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')
   if(sha!==reference.sha256)throw Error('REFERENCE_CHANGED')
   objectUrl=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));const image=new Image();image.src=objectUrl;await image.decode()
   if(live)setUrl(objectUrl)
  }catch{if(live)setFailed(true)}finally{clearTimeout(timeout);if(!live&&objectUrl)URL.revokeObjectURL(objectUrl)}})()
  return()=>{live=false;controller.abort();clearTimeout(timeout);if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[reference.url,reference.sha256,retry])
 return <div>
  {url?<figure><img src={url} alt={t('生成时的原场景','Original scene used for generation')} draggable={false}/><figcaption>{t('对照原有光照、材质和物件位置。画页不会替换可行走的地图。','Compare lighting, materials and object positions. The illustration does not replace the walkable map.')}</figcaption></figure>:<p role="status">{failed?t('原场景暂时无法核对，可以重试或继续旅程。','The original scene could not be verified. Retry or continue your journey.'):t('正在读取并核对原场景…','Loading and verifying the original scene…')}</p>}
  {failed&&<button className="og-choice" onClick={()=>setRetry(n=>n+1)}>{t('重新读取原场景','Reload original scene')}</button>}
 </div>
}
