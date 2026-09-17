import {archivePhotoSuggestion} from './old-street-archive-photo'
import {useEffect,useState} from 'react'
import {readExpansionJob} from './old-street-expansion-recovery'
import type {ExpansionJob} from '../server/old-street-expansion-jobs'
export function OldStreetExpansionView({locale,sessionId,requested,disabled,api,submit,activate,archiveTitle,commission=false}:{locale:'zh'|'en';sessionId:string;requested:boolean;disabled:boolean;api:(path:string,body?:unknown)=>Promise<any>;submit:(text:string,followArchive?:boolean)=>Promise<void>;archiveTitle?:string;commission?:boolean;activate:()=>Promise<void>}){
 const [input,setInput]=useState(''),[job,setJob]=useState<ExpansionJob|null>(null),[sending,setSending]=useState(false),[failed,setFailed]=useState(false),[refresh,setRefresh]=useState(0)
 const t=(z:string,e:string)=>locale==='zh'?z:e
 useEffect(()=>{
  if(!requested)return
  let active=true,timer:ReturnType<typeof setTimeout>|undefined
  const poll=async()=>{try{const r=await readExpansionJob(api,'/sessions/'+sessionId+'/expansion','queued',()=>active);if(!active)return;setJob(r.job);setFailed(false);if(r.job?.state==='planning'||r.job?.state==='queued')timer=setTimeout(poll,8000)}catch{if(active)setFailed(true)}}
  void poll();return()=>{active=false;if(timer)clearTimeout(timer)}
 },[api,sessionId,requested,refresh])
 async function start(followArchive=false){
  if(sending||disabled)return
  setSending(true);setFailed(false)
  try{if(!requested)await submit(followArchive?archivePhotoSuggestion(locale):input.trim(),followArchive);const r=await api('/sessions/'+sessionId+'/expansion',{retry:job?.state==='failed'});setJob(r.job);setRefresh(n=>n+1)}catch{setFailed(true)}finally{setSending(false)}
 }
 return <details className="os-expansion" open={commission}><summary>{commission?t('寻找记录中的旧照','Find a photograph of the recorded history'):t('探查暗房','Explore the darkroom')}</summary>
  {!requested&&archiveTitle&&<><p>{t('沿着档案线索寻找：','Follow the archive lead: ')}{archiveTitle}</p><button disabled={disabled||sending} onClick={()=>void start(true)}>{t('寻找相关旧照','Look for a related photograph')}</button></>}
  {!requested&&!commission&&<textarea aria-label={t('想在暗房寻找什么','What would you like to find in the darkroom?')} maxLength={500} value={input} onChange={e=>setInput(e.target.value)} disabled={disabled||sending} placeholder={t('比如：想看看照相馆后面的暗房','For example: explore the darkroom behind the studio')}/>}
  {(requested||!archiveTitle||failed)&&<p role="status">{failed?t('准备暂时不可用，原来的探索仍可继续。','Preparation is unavailable. You can continue exploring.'):job?.state==='candidate'?t('暗房已经准备好，可以继续探索。','The darkroom is ready to explore.'):job?.state==='planning'||job?.state==='queued'?t('正在准备新的去处，可以先继续逛。','Preparing the new area. You can keep exploring.'):job?.state==='failed'?t('这次准备中断了，可以重试。','Preparation was interrupted. You can retry.'):requested?t('你的想法已保存。','Your idea is saved.'):commission?t(archiveTitle?'照片可以留下街景细节，事件先后仍以已核对的记录为准。':'先查清寄存记录，再沿着那件事寻找旧照。',archiveTitle?'A photograph can show street details. The reconstructed records establish the order of events.':'Reconstruct the filed records first, then follow that history to a photograph.'):t('照相馆后面还有一间暗房。你想在那里寻找什么？','There is a darkroom behind the studio. What would you like to find there?')}</p>}
  {(requested||!commission)&&(failed||!job||job.state==='failed')&&<button disabled={disabled||sending||(!requested&&!input.trim())} onClick={()=>void start()}>{t(sending?'正在保存…':requested?'继续准备':'提出想法',sending?'Saving…':requested?'Continue preparation':'Suggest a place')}</button>}
  {job?.state==='candidate'&&<button disabled={disabled||sending} onClick={()=>{setSending(true);void activate().catch(()=>setFailed(true)).finally(()=>setSending(false))}}>{t('打开暗房门','Open the darkroom door')}</button>}
 </details>
}
