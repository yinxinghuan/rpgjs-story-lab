import {useEffect,useState} from 'react'
import type {WorkshopJob} from './old-street-workshop-client'
import type {OldStreetPresentationHead} from './old-street-workshop'
import {oldStreetAiNotice} from './old-street-ai-notice'

export function OldStreetWorkshopPanel({head,status,propose,adopt,disabled,onBusy}:{head:OldStreetPresentationHead;status:()=>Promise<{job:WorkshopJob|null}>;propose:()=>Promise<{job:WorkshopJob}>;adopt:(hash:string)=>Promise<void>;disabled:boolean;onBusy:(busy:boolean)=>void}){
 const [job,setJob]=useState<WorkshopJob|null>(null),[working,setWorking]=useState(false),[error,setError]=useState('')
 const t=(zh:string,en:string)=>head.save.locale==='zh'?zh:en
 const waiting=job?.state==='queued'||job?.state==='running'
 useEffect(()=>{let active=true;void status().then(r=>{if(active)setJob(r.job)}).catch(()=>{});return()=>{active=false}},[head.id])
 useEffect(()=>{
  if(!waiting)return
  let active=true;const timer=setInterval(()=>{void status().then(r=>{if(active)setJob(r.job)}).catch(()=>{if(active)setError(t('连接中断；再次查看即可恢复进度。','Connection interrupted. Check again to recover progress.'))})},2000)
  return()=>{active=false;clearInterval(timer)}
 },[head.id,waiting])
 // Keep the source position fixed until generation finishes. Closing this
 // panel does not cancel or duplicate the durable server job.
 useEffect(()=>{onBusy(working||waiting);return()=>onBusy(false)},[working,waiting])
 const run=async(fn:()=>Promise<void>)=>{setWorking(true);setError('');try{await fn()}catch(e){setError(oldStreetAiNotice(e instanceof Error?e.message:'',head.save.locale)??t('这次未能完成，原旅程不受影响。可以检查进度后再试。','This could not finish. Your original journey is safe. Check progress before trying again.'))}finally{setWorking(false)}}
 return <section className="os-workshop-panel" aria-label={t('补充修缮记录','Supplementary restoration records')}>
  <h3>{t('记录之外，还有一间工坊','A workshop beyond the records')}</h3>
  <p>{t('根据你已读的档案，寻找一间补充修缮工坊。原档案与结局不会改变。','Use the archive you have read to discover a supplementary restoration workshop. The original records and ending stay unchanged.')}</p>
  {waiting?<p role="status">{t('正在整理线索并检查新空间，可稍后回来查看。','Gathering clues and checking the new space. You can return to check progress.')}</p>:job?.state==='ready'?<>
   <strong>{job.label}</strong><p>{job.detail}</p><button disabled={working||disabled} onClick={()=>void run(()=>adopt(job.artifact_hash!))}>{t('另开旅程，接入工坊','Open a new journey with this workshop')}</button><p>{t('原旅程保留在菜单中。接入后会重新载入地图。','Your original journey stays in the menu. The map reloads after adoption.')}</p>
  </>:<>
   {job?.state==='stale'&&<p>{t('旅程已变化，请根据当前进度重新寻找。','Your journey has changed. Search again using your current progress.')}</p>}
   {job?.state==='failed'&&<p>{t('这份补充记录未通过检查，没有加入旅程。','These supplementary records did not pass review and were not added to your journey.')}</p>}
   <button disabled={working||disabled} onClick={()=>void run(async()=>setJob((await propose()).job))}>{t('寻找补充工坊','Discover a workshop')}</button>
  </>}
  {error&&<p role="alert">{error}</p>}
  <button disabled={working} onClick={()=>void run(async()=>setJob((await status()).job))}>{t('检查进度','Check progress')}</button>
 </section>
}
