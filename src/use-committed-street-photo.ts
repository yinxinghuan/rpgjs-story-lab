import {useEffect,useState} from 'react'
/** Read-only, journey-bound art. Failure never replaces it with another picture. */
export function useCommittedStreetPhoto(api:(path:string)=>Promise<any>,sessionId:string|undefined,hash:unknown,enabled:boolean){
 const [image,setImage]=useState('')
 useEffect(()=>{
  let live=true,url='';setImage('')
  if(!enabled||!sessionId||typeof hash!=='string')return
  void api('/sessions/'+sessionId+'/expansion-photo-file').then(async value=>{
   const bytes=new Uint8Array(value),digest=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')
   if(!live||digest!==hash)return
   url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));setImage(url)
  }).catch(()=>{/* Keep authoritative placement; the next visit may retry loading. */})
  return()=>{live=false;if(url)URL.revokeObjectURL(url)}
 },[api,sessionId,hash,enabled])
 return image
}
