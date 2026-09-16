import {OldStreetPhotoView} from './old-street-photo-view'
import {useEffect,useState} from 'react'
import {readExpansionJob} from './old-street-expansion-recovery'
import type {OldStreetExpansionMedia} from '../server/old-street-expansion-media'
type Job=ReturnType<OldStreetExpansionMedia['get']>
/** Showing a completed image does not itself unlock the puzzle's story result. */
export function OldStreetExpansionPhotoView({locale,sessionId,api,disabled,matched,submit,pause,choice,decide,allowRegenerate=false,requestOpen=0}:{locale:'zh'|'en';sessionId:string;api:(path:string,body?:unknown)=>Promise<any>;disabled:boolean;matched:boolean;choice:string;allowRegenerate?:boolean;requestOpen?:number;decide:(choice:'keep'|'leave')=>Promise<void>;submit:(proof:unknown)=>Promise<void>;pause:(open:boolean)=>void}){
 const [image,setImage]=useState('')
 const [open,setOpen]=useState(false),[feedback,setFeedback]=useState('')
 const [job,setJob]=useState<Job>(null),[failed,setFailed]=useState(false),[sending,setSending]=useState(false),[revision,setRevision]=useState(0)
 const [imageFailed,setImageFailed]=useState(false),[imageRevision,setImageRevision]=useState(0)
 const t=(z:string,e:string)=>locale==='zh'?z:e,path='/sessions/'+sessionId+'/expansion-photo'
 useEffect(()=>{
  let alive=true,timer:ReturnType<typeof setTimeout>|undefined
  const poll=async()=>{try{
   const result=await readExpansionJob(api,path,'preparing',()=>alive);if(!alive)return;setJob(result.job);setFailed(false)
   if(alive&&(result.job?.state==='preparing'||result.job?.state==='failed'&&result.job.nextAt>Date.now()))timer=setTimeout(()=>void poll(),8000)
  }catch{if(alive)setFailed(true)}}
  void poll();return()=>{alive=false;if(timer)clearTimeout(timer)}
 },[api,path,revision])
 useEffect(()=>{
  if(job?.state!=='candidate'||!job.asset)return
  let alive=true,url='';setImage('');setImageFailed(false)
  void api('/sessions/'+sessionId+'/expansion-photo-file').then(async value=>{
   const bytes=new Uint8Array(value),hash=[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')
   if(hash!==job.asset!.sha256||bytes.length!==job.asset!.bytes)throw Error('PHOTO_CHANGED')
   if(!alive)return;url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));setImage(url)
  }).catch(()=>{if(alive)setImageFailed(true)})
  return()=>{alive=false;if(url)URL.revokeObjectURL(url)}
 },[api,sessionId,job?.asset?.sha256,job?.state,imageRevision])
 useEffect(()=>{if(requestOpen&&image&&!imageFailed&&job?.asset&&!matched){setFeedback('');setOpen(true);pause(true)}},[requestOpen,image])
 async function start(){if(sending||disabled)return;setSending(true);try{const result=await api(path,{retry:job?.state==='failed'||job?.state==='candidate'});setJob(result.job);setFailed(false);setRevision(n=>n+1)}catch{setFailed(true)}finally{setSending(false)}}
 return <div className="os-expansion">
  <p role="status">{choice==='keep'?t('旧街照片已收进随身行囊。','The photograph is in your bag.'):choice==='leave'?t('照片留在显影台上。','The photograph remains on the developing bench.'):matched?t('旧街照片已拼合，已记入这次旅程。','The completed photograph is saved in this journey.'):(failed||imageFailed)?t('照片暂时取不到，可以继续探索。','The photograph is unavailable. You can keep exploring.'):job?.state==='candidate'?t('照片显出来了。','The photograph has developed.'):job?.state==='preparing'?t('照片正在显影，可以先去别处看看。','The photograph is developing. You can explore elsewhere.'):job?.state==='failed'?t('显影暂时中断了。','Developing was interrupted.'):t('显影台上留着一张待冲洗的照片。','An undeveloped photograph rests on the workbench.')}</p>
  {failed&&<button disabled={disabled||sending} onClick={()=>{setFailed(false);setRevision(n=>n+1)}}>{t('重新连接','Reconnect')}</button>}
  {imageFailed&&job?.state==='candidate'&&<button disabled={disabled||sending} onClick={()=>setImageRevision(n=>n+1)}>{t('重新载入照片','Reload photograph')}</button>}
  {matched&&!choice&&(['keep','leave'] as const).map(value=><button key={value} disabled={disabled||sending} onClick={()=>{setSending(true);void decide(value).catch(()=>setFailed(true)).finally(()=>setSending(false))}}>{value==='keep'?t('带走照片','Take the photograph'):t('留在暗房','Leave it here')}</button>)}
  {allowRegenerate&&job?.state==='candidate'&&!matched&&<button disabled={disabled||sending} onClick={()=>void start()}>{t('重新显影一张','Develop another photograph')}</button>}
  {job?.state==='candidate'&&!matched&&<button disabled={disabled||sending||!image||imageFailed} onClick={()=>{setFeedback('');setOpen(true);pause(true)}}>{t('拼合照片','Match photograph')}</button>}
  {open&&job?.asset&&<OldStreetPhotoView locale={locale} busy={sending} photograph={{image,version:job.asset.sha256}} feedback={feedback} close={()=>{setOpen(false);pause(false)}} submit={proof=>{setSending(true);void submit(proof).then(()=>{setOpen(false);pause(false)}).catch(()=>setFeedback(t('还没有接上，请检查另一半和方向；也请走近显影台。','The halves do not join yet. Check the piece and orientation, and approach the bench.'))).finally(()=>setSending(false))}}/>}
  {!failed&&(job?.state==='candidate'?image&&!imageFailed?<img src={image} alt={t('暗房里显影的旧街照片','The old-street photograph developed in the darkroom')} draggable={false} style={{width:'100%',maxWidth:384,height:'auto',imageRendering:'pixelated',filter:'grayscale(1)'}} onError={()=>setImageFailed(true)}/>:null:<button disabled={disabled||sending||job?.state==='preparing'||!!job&&Date.now()<job.nextAt} onClick={()=>void start()}>{t(job?'继续显影':'显影照片',job?'Continue developing':'Develop photograph')}</button>)}
 </div>
}
