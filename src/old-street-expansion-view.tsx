import {useEffect,useState} from 'react'
import type {ExpansionJob} from '../server/old-street-expansion-jobs'
export function OldStreetExpansionView({locale,sessionId,requested,disabled,api,submit}:{locale:'zh'|'en';sessionId:string;requested:boolean;disabled:boolean;api:(path:string,body?:unknown)=>Promise<any>;submit:(text:string)=>Promise<void>}){
 const [input,setInput]=useState(''),[job,setJob]=useState<ExpansionJob|null>(null),[sending,setSending]=useState(false),[failed,setFailed]=useState(false),[refresh,setRefresh]=useState(0)
 const t=(z:string,e:string)=>locale==='zh'?z:e
 useEffect(()=>{
  if(!requested)return
  let active=true,timer:ReturnType<typeof setTimeout>|undefined
  const poll=async()=>{try{const r=await api('/sessions/'+sessionId+'/expansion');if(!active)return;setJob(r.job);setFailed(false);if(r.job?.state==='planning'||r.job?.state==='queued')timer=setTimeout(poll,8000)}catch{if(active)setFailed(true)}}
  void poll();return()=>{active=false;if(timer)clearTimeout(timer)}
 },[api,sessionId,requested,refresh])
 async function start(){
  if(sending||disabled)return
  setSending(true);setFailed(false)
  try{if(!requested)await submit(input.trim());const r=await api('/sessions/'+sessionId+'/expansion',{retry:job?.state==='failed'});setJob(r.job);setRefresh(n=>n+1)}catch{setFailed(true)}finally{setSending(false)}
 }
 return <details className="os-expansion"><summary>{t('探索新的去处','Explore somewhere new')}</summary>
  {!requested&&<textarea aria-label={t('想探索什么','What would you like to explore?')} maxLength={500} value={input} onChange={e=>setInput(e.target.value)} disabled={disabled||sending} placeholder={t('比如：想看看照相馆后面的暗房','For example: explore the darkroom behind the studio')}/>}
  <p role="status">{failed?t('准备暂时不可用，原来的探索仍可继续。','Preparation is unavailable. You can continue exploring.'):job?.state==='candidate'?t('扩展方案已保存，入口还在准备中。','The expansion plan is saved. Its entrance is still being prepared.'):job?.state==='planning'||job?.state==='queued'?t('正在准备新的去处，可以先继续逛。','Preparing the new area. You can keep exploring.'):job?.state==='failed'?t('这次准备中断了，可以重试。','Preparation was interrupted. You can retry.'):requested?t('你的想法已保存。','Your idea is saved.'):t('从这里提出一个想探索的新去处。','Describe a new place you would like to explore from here.')}</p>
  {(failed||!job||job.state==='failed')&&<button disabled={disabled||sending||(!requested&&!input.trim())} onClick={()=>void start()}>{t(sending?'正在保存…':requested?'继续准备':'提出想法',sending?'Saving…':requested?'Continue preparation':'Suggest a place')}</button>}
 </details>
}
