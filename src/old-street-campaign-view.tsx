import {useEffect,useRef,useState} from 'react'
import type {OldStreetCampaign} from './old-street-campaign'
import type {CampaignJob} from '../server/old-street-campaign-jobs'
import './old-street-campaign-view.css'
type Stage='trace'|'parcel'
export function OldStreetCampaignView({campaign,stage,locale,sessionId,api,busy,feedback,act,archive,close}:{campaign:OldStreetCampaign;stage:Stage;locale:'zh'|'en';sessionId:string;api:(path:string,body?:unknown)=>Promise<any>;busy:boolean;feedback:string;act:(type:'read'|'observe'|'decide',selection?:number|string)=>Promise<void>;archive?:()=>void;close:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,root=useRef<HTMLDialogElement>(null),instance=campaign[stage]
 const [job,setJob]=useState<CampaignJob|null>(null),[waiting,setWaiting]=useState(false),[reading,setReading]=useState(true),[failed,setFailed]=useState(false),[refresh,setRefresh]=useState(0)
 const path='/sessions/'+sessionId+'/campaign-'+stage
 useEffect(()=>{const node=root.current;node?.showModal();return()=>node?.close()},[])
 useEffect(()=>{
  if(instance)return
  let active=true,timer:ReturnType<typeof setTimeout>|undefined
  setReading(true);setFailed(false)
  const poll=async()=>{
   try{
    const response=await api(path);if(!active)return
    setJob(response.job);setFailed(false)
    if(['queued','planning'].includes(response.job?.state))timer=setTimeout(poll,3000)
   }catch{if(active)setFailed(true)}finally{if(active)setReading(false)}
  }
  void poll();return()=>{active=false;if(timer)clearTimeout(timer)}
 },[path,api,refresh,Boolean(instance)])
 const prepare=async()=>{if(waiting)return;setWaiting(true);setFailed(false);try{const r=await api(path,{retry:job?.state==='failed'});setJob(r.job);setRefresh(n=>n+1)}catch{setFailed(true)}finally{setWaiting(false)}}
 const reconnect=()=>{setReading(true);setFailed(false);setRefresh(n=>n+1)}
 const trace=campaign.trace,parcel=campaign.parcel
 const dismiss=()=>{if(!busy)close()}
 return <dialog ref={root} className="os-map os-campaign" aria-labelledby="os-campaign-title" onCancel={e=>{e.preventDefault();dismiss()}}>
  <header><h2 id="os-campaign-title">{instance?.content.title??t(stage==='trace'?'寄存记录':'资料架上的纸袋',stage==='trace'?'Filing records':'The packet on the shelf')}</h2><button disabled={busy} onClick={dismiss}>{t('收起','Close')}</button></header>
  <div className="os-campaign__body">
   {!instance?<>
    <p>{t(stage==='trace'?'信旁的寄存条有两处特征，可以和记录册里的条目比对。':'按记录找到的纸袋就在资料架上。',stage==='trace'?'The slip beside the letter has two identifying details. Compare them with the ledger.':'The packet matching the record is on the shelf.')}</p>
    <p role="status">{failed?t('暂时连不上。重新连接即可查看准备进度，也可以先收起。','Connection interrupted. Reconnect to check progress, or close this for now.'):reading?t('正在查看材料的准备进度…','Checking the papers…'):job?.state==='failed'?t('材料暂时没能展开。进度已保存，可以重试。','The papers could not be prepared. Your progress is safe; you can retry.'):job?.state==='ready'?t('材料已经准备好。','The papers are ready.'):job?.state==='planning'||job?.state==='queued'?t('正在展开材料。可以收起，先去街上看看，回来继续。','Preparing the papers. You can close this, explore the street, and return later.'):t('展开材料，查看里面的线索。','Lay out the papers to examine the clues.')}</p>
   </>:!instance.observed?<p>{t('仔细看看纸面上的内容。','Take a closer look at what is on the paper.')}</p>:stage==='trace'&&trace?<>
    <section className="os-campaign__clue"><strong>{t('信旁的寄存条','The filing slip')}</strong><p>{trace.content.clue.mark} · {trace.content.clue.wrapping}</p></section>
    <p>{t('哪条记录同时符合这两处特征？','Which record matches both details?')}</p>
    <div className="os-campaign__records">{trace.content.records.map((r,index)=><button key={index} disabled={busy||trace.selected!==undefined} onClick={()=>void act('decide',index)} aria-pressed={trace.selected===index}><strong>{r.label}</strong><span>{r.mark}</span><span>{r.wrapping}</span></button>)}</div>
    {trace.selected!==undefined&&<p>{t('记录对上了。沿合住院的台阶到地下储物室，找资料架。','The record matches. Take the courtyard steps down to the cellar and find the paper shelf.')}</p>}
   </>:parcel?<>
    {trace?.selected!==undefined&&<p className="os-campaign__clue">{trace.content.records[trace.selected].label} · {trace.content.records[trace.selected].mark}</p>}
    <p>{parcel.content.fragment}</p>
    {!parcel.disposition?<p>{t('带走可交给家人；留下则保留在这里，回家转述内容。','Take it to show your family, or leave it here and tell them what you read.')}</p>:<p>{t(parcel.disposition==='take'?'原件已收进你的行囊。':'原件仍留在架上，你记下了它的内容。',parcel.disposition==='take'?'The original is in your bag.':'The original remains on the shelf. You remember what it says.')}</p>}
   </>:null}
  </div>
  <footer>
   {stage==='parcel'&&archive&&<button disabled={busy} onClick={archive}>{t('追查原始记录','Follow the source records')}</button>}
   {feedback&&<p role="status">{feedback}</p>}
   {!instance?(failed?<button disabled={busy||waiting} onClick={reconnect}>{t('重新连接','Reconnect')}</button>:job?.state==='ready'?<button disabled={busy||reading} onClick={()=>void act('read')}>{t('阅读材料','Read the papers')}</button>:<button disabled={busy||waiting||reading||job?.state==='queued'||job?.state==='planning'} onClick={()=>void prepare()}>{reading?t('正在连接…','Connecting…'):waiting||job?.state==='queued'||job?.state==='planning'?t('正在准备…','Preparing…'):job?.state==='failed'?t('重新展开','Try again'):t('展开材料','Lay out the papers')}</button>):!instance.observed?<button disabled={busy} onClick={()=>void act('observe')}>{t('阅读线索','Read the clues')}</button>:stage==='parcel'&&!parcel?.disposition?<><button disabled={busy} onClick={()=>void act('decide','take')}>{t('带走原件','Take the original')}</button><button disabled={busy} onClick={()=>void act('decide','leave')}>{t('记下内容，留下原件','Remember it and leave it')}</button></>:<button disabled={busy} onClick={dismiss}>{t('回到街区','Return to exploring')}</button>}
  </footer>
 </dialog>
}
