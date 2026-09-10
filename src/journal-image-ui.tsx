import React,{useEffect,useState} from 'react'
import {api} from './client-session'
import type {Locale} from './story'
import {journalImageError} from './journal-image-errors'
type PublicJob={state:'preparing'|'failed'|'active';attempt:number;recoverable:boolean;nextAt:number;error?:string;asset?:{sha256:string;bytes:number;width:number;height:number}}
export function JournalImagePanel({journeyId,locale}:{journeyId:string;locale:Locale}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const [job,setJob]=useState<PublicJob|null>(null),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(false),[picture,setPicture]=useState(''),[imageError,setImageError]=useState(false),[imageRetry,setImageRetry]=useState(0)
 const [,tick]=useState(0)
 useEffect(()=>{
  let timer:ReturnType<typeof setTimeout>
  const refresh=()=>{const remaining=(job?.nextAt??0)-Date.now();if(remaining>0)timer=setTimeout(refresh,Math.min(120000,remaining+10));else tick(n=>n+1)}
  if(job?.nextAt)refresh()
  return()=>clearTimeout(timer)
 },[job?.nextAt])
 const endpoint='/sessions/'+journeyId+'/image'
 useEffect(()=>{
  let live=true,timer:ReturnType<typeof setTimeout>
  const read=async()=>{try{const result=await api(endpoint);if(!live)return;setJob(result.job);setReady(true);setError(false);if(result.job?.state==='preparing')timer=setTimeout(read,8000)}catch{if(live){setError(true);setReady(true)}}}
  void read();return()=>{live=false;clearTimeout(timer)}
 },[journeyId,busy])
 useEffect(()=>{
  setPicture('');setImageError(false)
  if(job?.state!=='active'||!job.asset)return
  let live=true,url=''
  setImageError(false)
  void(async()=>{try{
   const bytes=new Uint8Array(await api(endpoint+'/file'))
   const hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('')
   if(bytes.length!==job.asset!.bytes||hash!==job.asset!.sha256)throw Error('IMAGE_VERSION')
   url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));const img=new Image();img.src=url;await img.decode()
   if(img.naturalWidth!==768||img.naturalHeight!==1024)throw Error('IMAGE_SIZE')
   if(live)setPicture(url);else URL.revokeObjectURL(url)
  }catch{if(url)URL.revokeObjectURL(url);if(live)setImageError(true)}})()
  return()=>{live=false;if(url)URL.revokeObjectURL(url)}
 },[job?.asset?.sha256,imageRetry,journeyId])
 async function start(retry=false){setBusy(true);setError(false);try{const r=await api(endpoint,{retry});setJob(r.job)}catch{setError(true)}finally{setBusy(false)}}
 return <section className="cl-journal-image" aria-label={t('旅途画页','Journey illustration')}>
  <h4>{t('旅途画页','Journey illustration')}</h4>
  <p>{t('为这次安全抵达留一张插画。只发送场景描述和公开参考图，不发送对白、头像或完整存档。制作不影响继续探索。','Keep an illustration of this safe arrival. Only a scene description and public reference image are sent, not dialogue, avatars or your full save. You can keep exploring while it is made.')}</p>
  {!ready?<p role="status">{t('读取制作进度…','Loading illustration status…')}</p>:picture?<img src={picture} width="768" height="1024" alt={t('安全抵达后的轨旁步道插画','Illustration of the trackside walkway after safe arrival')} draggable={false}/>:job?.state==='preparing'?<p role="status">{t('画页正在准备，可以先继续探索。','The illustration is being prepared. You can keep exploring.')}</p>:job?.state==='active'?<p role="status">{t('正在读取画页…','Loading the illustration…')}</p>:null}
  {error&&<p role="alert">{t('暂时无法确认制作进度，请稍后恢复。','The illustration status could not be confirmed. Try recovering shortly.')}</p>}
  {job?.state==='failed'&&<p role="status">{journalImageError(job.error,locale)} {t(job.recoverable?'恢复会继续同一次请求。':'你的旅程和结局不受影响。',job.recoverable?'Recovery continues the same request.':'Your journey and ending are unaffected.')}</p>}
  {imageError&&<><p role="alert">{t('画页暂时无法读取，旅程已保留。','The illustration could not be loaded. Your journey is preserved.')}</p><button onClick={()=>setImageRetry(v=>v+1)}>{t('重新读取画页','Reload illustration')}</button></>}
  {ready&&job?.state!=='active'&&(!job||job.recoverable||job.attempt<2)&&<button disabled={busy||!!job&&Date.now()<job.nextAt} onClick={()=>void start(job?.state==='failed'&&!job.recoverable)}>{busy?t('正在连接…','Connecting…'):!job?t('制作旅途画页','Create illustration'):job.recoverable?t('恢复制作','Recover illustration'):t('重新制作（最后一次）','Try again (last attempt)')}</button>}
  {job?.state==='failed'&&!job.recoverable&&job.attempt>=2&&<p>{t('本段旅程的两次制作机会已用完。仍可阅读旅途记录。','Both illustration attempts for this journey have been used. Your written journal remains available.')}</p>}
 </section>
}
