import React,{useEffect,useState} from 'react'
import {decodeBrowserPicture} from './decode-browser-picture'
import {downloadOriginalReference} from './original-reference-download'
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
   const bytes=await downloadOriginalReference(reference,controller.signal)
   objectUrl=await decodeBrowserPicture(bytes,controller.signal)
   if(live)setUrl(objectUrl)
  }catch{if(objectUrl){URL.revokeObjectURL(objectUrl);objectUrl=''}if(live)setFailed(true)}finally{clearTimeout(timeout);if(!live&&objectUrl)URL.revokeObjectURL(objectUrl)}})()
  return()=>{live=false;controller.abort();clearTimeout(timeout);if(objectUrl)URL.revokeObjectURL(objectUrl)}
 },[reference.url,reference.sha256,retry])
 return <div>
  {url?<figure><img src={url} alt={t('生成时的原场景','Original scene used for generation')} draggable={false}/><figcaption>{t('对照原有光照、材质和物件位置。画页不会替换可行走的地图。','Compare lighting, materials and object positions. The illustration does not replace the walkable map.')}</figcaption></figure>:<p role="status">{failed?t('原场景暂时无法核对，可以重试或继续旅程。','The original scene could not be verified. Retry or continue your journey.'):t('正在读取并核对原场景…','Loading and verifying the original scene…')}</p>}
  {failed&&<button className="og-choice" onClick={()=>setRetry(n=>n+1)}>{t('重新读取原场景','Reload original scene')}</button>}
 </div>
}
