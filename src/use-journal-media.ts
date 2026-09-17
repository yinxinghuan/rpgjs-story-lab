import {useEffect,useState} from 'react'
import type {JournalMediaState} from './old-street-journal-media'
type Api=(path:string,body?:unknown)=>Promise<any>
export function useJournalMedia(api:Api|undefined,sessionId:string|undefined){
 const [rows,setRows]=useState<JournalMediaState[]>([]),[images,setImages]=useState<Record<string,string>>({}),[retry,setRetry]=useState<{id?:string;n:number}>({n:0}),[error,setError]=useState(false)
 useEffect(()=>{
  setRows([]);setImages({});setError(false)
  if(!api||!sessionId)return
  let live=true,first=true,timer:ReturnType<typeof setTimeout>|undefined
  const urls:Record<string,string>={},hashes:Record<string,string>={},base='/sessions/'+sessionId
  async function poll(){
   try{
    const body=first&&retry.id?{retryId:retry.id}:{};first=false
    const value=await api!(base+'/journal-art',body)
    if(!live)return
    if(!Array.isArray(value.jobs))throw Error('INVALID_ART_RESPONSE')
    const jobs=value.jobs as JournalMediaState[];setRows(jobs);setError(false)
    for(const job of jobs){
     if(!live)return
     if(job.state!=='ready'||!job.asset||hashes[job.id]===job.asset.sha256)continue
     const bytes=new Uint8Array(await api!(base+'/journal-art-file?asset='+encodeURIComponent(job.id)))
     const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')
     if(!live)return
     if(hash!==job.asset.sha256)throw Error('ART_CONTENT_MISMATCH')
     if(urls[job.id])URL.revokeObjectURL(urls[job.id])
     urls[job.id]=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));hashes[job.id]=hash
     setImages({...urls})
    }
    if(jobs.some(j=>j.recoverable)&&live)timer=setTimeout(()=>void poll(),8000)
   }catch{if(live)setError(true)}
  }
  void poll()
  return()=>{live=false;clearTimeout(timer);Object.values(urls).forEach(url=>URL.revokeObjectURL(url))}
 },[api,sessionId,retry])
 return {rows,images,error,retry:(id?:string)=>setRetry(r=>({id,n:r.n+1}))}
}
