import {useEffect,useState} from 'react'
import type {ExpansionJob} from '../server/old-street-expansion-jobs'
export function OldStreetExpansionView({locale,sessionId,requested,disabled,api,submit,activate}:{locale:'zh'|'en';sessionId:string;requested:boolean;disabled:boolean;api:(path:string,body?:unknown)=>Promise<any>;submit:(text:string)=>Promise<void>;activate:()=>Promise<void>}){
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
 return <details className="os-expansion"><summary>{t('探查暗房','Explore the darkroom')}</summary>
  {!requested&&<textarea aria-label={t('想在暗房寻找什么','What would you like to find in the darkroom?')} maxLength={500} value={input} onChange={e=>setInput(e.target.value)} disabled={disabled||sending} placeholder={t('比如：想看看照相馆后面的暗房','For example: explore the darkroom behind the studio')}/>}
  <p role="status">{failed?t('准备暂时不可用，原来的探索仍可继续。','Preparation is unavailable. You can continue exploring.'):job?.state==='candidate'?t('暗房已经准备好，可以继续探索。','The darkroom is ready to explore.'):job?.state==='planning'||job?.state==='queued'?t('正在准备新的去处，可以先继续逛。','Preparing the new area. You can keep exploring.'):job?.state==='failed'?t('这次准备中断了，可以重试。','Preparation was interrupted. You can retry.'):requested?t('你的想法已保存。','Your idea is saved.'):t('照相馆后面还有一间暗房。你想在那里寻找什么？','There is a darkroom behind the studio. What would you like to find there?')}</p>
  {(failed||!job||job.state==='failed')&&<button disabled={disabled||sending||(!requested&&!input.trim())} onClick={()=>void start()}>{t(sending?'正在保存…':requested?'继续准备':'提出想法',sending?'Saving…':requested?'Continue preparation':'Suggest a place')}</button>}
  {job?.state==='candidate'&&<button disabled={disabled||sending} onClick={()=>{setSending(true);void activate().catch(()=>setFailed(true)).finally(()=>setSending(false))}}>{t('继续探索暗房','Continue exploring the darkroom')}</button>}
 </details>
}
