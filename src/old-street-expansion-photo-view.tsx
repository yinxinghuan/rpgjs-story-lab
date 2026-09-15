import {OldStreetPhotoView} from './old-street-photo-view'
import {useEffect,useState} from 'react'
import {getGameApiBase} from './game-id'
import type {OldStreetExpansionMedia} from '../server/old-street-expansion-media'
type Job=ReturnType<OldStreetExpansionMedia['get']>
/** Local expansion experiment only. Candidate viewing does not unlock a story action. */
export function OldStreetExpansionPhotoView({locale,sessionId,api,disabled,matched,submit,pause,choice,decide}:{locale:'zh'|'en';sessionId:string;api:(path:string,body?:unknown)=>Promise<any>;disabled:boolean;matched:boolean;choice:string;decide:(choice:'keep'|'leave')=>Promise<void>;submit:(proof:unknown)=>Promise<void>;pause:(open:boolean)=>void}){
 const [open,setOpen]=useState(false),[feedback,setFeedback]=useState('')
 const [job,setJob]=useState<Job>(null),[failed,setFailed]=useState(false),[sending,setSending]=useState(false),[revision,setRevision]=useState(0)
 const t=(z:string,e:string)=>locale==='zh'?z:e,path='/sessions/'+sessionId+'/expansion-photo'
 useEffect(()=>{
  let alive=true,timer:ReturnType<typeof setTimeout>|undefined
  const poll=async(first=false)=>{try{
   const result=await api(path);if(!alive)return;setJob(result.job);setFailed(false)
   // POST resumes a persisted job; the server lease and request ID prevent duplication.
   if(first&&result.job?.state==='preparing')await api(path,{})
   if(alive&&(result.job?.state==='preparing'||result.job?.state==='failed'&&result.job.nextAt>Date.now()))timer=setTimeout(()=>void poll(),8000)
  }catch{if(alive)setFailed(true)}}
  void poll(true);return()=>{alive=false;if(timer)clearTimeout(timer)}
 },[api,path,revision])
 async function start(){if(sending||disabled)return;setSending(true);try{const result=await api(path,{retry:job?.state==='failed'||job?.state==='candidate'});setJob(result.job);setFailed(false);setRevision(n=>n+1)}catch{setFailed(true)}finally{setSending(false)}}
 const image=getGameApiBase()+'/api/oldstreet-dev/sessions/'+sessionId+'/expansion-photo-file?v='+job?.asset?.sha256
 return <div className="os-expansion">
  <p role="status">{choice==='keep'?t('旧街照片已收进随身行囊。','The photograph is in your bag.'):choice==='leave'?t('照片留在显影台上。','The photograph remains on the developing bench.'):matched?t('旧街照片已拼合，已记入这次旅程。','The completed photograph is saved in this journey.'):failed?t('照片暂时取不到，可以继续探索。','The photograph is unavailable. You can keep exploring.'):job?.state==='candidate'?t('照片显出来了。','The photograph has developed.'):job?.state==='preparing'?t('照片正在显影，可以先去别处看看。','The photograph is developing. You can explore elsewhere.'):job?.state==='failed'?t('显影暂时中断了。','Developing was interrupted.'):t('显影台上留着一张待冲洗的照片。','An undeveloped photograph rests on the workbench.')}</p>
  {matched&&!choice&&(['keep','leave'] as const).map(value=><button key={value} disabled={disabled||sending} onClick={()=>{setSending(true);void decide(value).catch(()=>setFailed(true)).finally(()=>setSending(false))}}>{value==='keep'?t('带走照片','Take the photograph'):t('留在暗房','Leave it here')}</button>)}
  {job?.state==='candidate'&&!matched&&<button disabled={disabled||sending} onClick={()=>void start()}>{t('重新显影一张','Develop another photograph')}</button>}
  {job?.state==='candidate'&&!matched&&<button disabled={disabled||sending} onClick={()=>{setFeedback('');setOpen(true);pause(true)}}>{t('拼合照片','Match photograph')}</button>}
  {open&&job?.asset&&<OldStreetPhotoView locale={locale} busy={sending} photograph={{image,version:job.asset.sha256}} feedback={feedback} close={()=>{setOpen(false);pause(false)}} submit={proof=>{setSending(true);void submit(proof).then(()=>{setOpen(false);pause(false)}).catch(()=>setFeedback(t('还没有接上，请检查另一半和方向；也请走近显影台。','The halves do not join yet. Check the piece and orientation, and approach the bench.'))).finally(()=>setSending(false))}}/>}
  {job?.state==='candidate'?<img src={getGameApiBase()+'/api/oldstreet-dev/sessions/'+sessionId+'/expansion-photo-file?v='+job.asset?.sha256} alt={t('暗房里显影的旧街照片','The old-street photograph developed in the darkroom')} draggable={false} style={{width:'100%',maxWidth:384,height:'auto',imageRendering:'pixelated',filter:'grayscale(1)'}} onError={()=>setFailed(true)}/>:<button disabled={disabled||sending||job?.state==='preparing'||!!job&&Date.now()<job.nextAt} onClick={()=>void start()}>{t(job?'继续显影':'显影照片',job?'Continue developing':'Develop photograph')}</button>}
 </div>
}
