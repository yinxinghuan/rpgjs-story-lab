import {useEffect,useRef,useState} from 'react'
import {archiveEvidence,type ArchiveCardId,type ArchiveProgress} from './old-street-archive'
import type {CampaignJob} from '../server/old-street-campaign-jobs'
import './old-street-campaign-view.css'
export function OldStreetArchiveView({archive,target,question,locale,sessionId,api,busy,feedback,act,tryAnother,close}:{archive?:ArchiveProgress;target:string;question?:string;locale:'zh'|'en';sessionId:string;api:(path:string,body?:unknown)=>Promise<any>;busy:boolean;feedback:string;act:(type:'plan'|'observe'|'decide',order?:ArchiveCardId[])=>Promise<void>;tryAnother:()=>void;close:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,root=useRef<HTMLDialogElement>(null)
 const [job,setJob]=useState<CampaignJob|null>(null),[error,setError]=useState(false),[waiting,setWaiting]=useState(false),[refresh,setRefresh]=useState(0),[reading,setReading]=useState(true)
 const [order,setOrder]=useState<ArchiveCardId[]>(archive?.order??[])
 const path='/sessions/'+sessionId+'/campaign-archive',source=target==='archive-index'?'index':target==='archive-ledger'?'ledger':undefined
 useEffect(()=>{root.current?.showModal();return()=>root.current?.close()},[])
 useEffect(()=>{
  if(archive)return
  let active=true,timer:ReturnType<typeof setTimeout>|undefined
  setReading(true);setError(false)
  const poll=async()=>{try{const r=await api(path);if(!active)return;setJob(r.job);if(['queued','planning'].includes(r.job?.state))timer=setTimeout(poll,3000)}catch{if(active)setError(true)}finally{if(active)setReading(false)}}
  void poll();return()=>{active=false;if(timer)clearTimeout(timer)}
 },[path,api,refresh,!!archive])
 const prepare=async()=>{setWaiting(true);try{const r=await api(path,{retry:job?.state==='failed'});setJob(r.job);setRefresh(n=>n+1)}catch{setError(true)}finally{setWaiting(false)}}
 const label=(id:ArchiveCardId)=>archive!.content.cards.find(c=>c.id===id)!.label
 return <dialog ref={root} className="os-map os-campaign" aria-labelledby="os-archive-title" onCancel={e=>{e.preventDefault();if(!busy)close()}}>
  <header><h2 id="os-archive-title">{t('原始记录','Source records')}</h2><button disabled={busy} onClick={close}>{t('收起','Close')}</button></header>
  <div className="os-campaign__body">
   {archive&&<h3 className="os-campaign__document-title">{archive.content.title}</h3>}
   {question&&!archive?.order&&<p className="os-campaign__clue">{question}</p>}
   {!archive?<><p>{t('材料指向隔壁档案工作间。那里的记录能补全这件事的经过。','The papers point to the adjoining archive workroom, where source records can fill in what happened.')}</p><p role="status">{error?t('暂时连接不上，可以重新连接。','Connection interrupted. You can reconnect.'):reading?t('正在查看准备进度…','Checking progress…'):job?.state==='ready'?t('工作间已经可以进入。','The workroom is ready to enter.'):job?.state==='failed'?t('暂时没能备齐记录，可以重试。','The records could not be prepared. You can retry.'):['queued','planning'].includes(job?.state??'')?t('正在准备记录。可以收起，先去别处探索。','Preparing the records. You can close this and explore elsewhere.'):t('先备齐这里的原始记录，再沿地下室侧门进去调查。','Prepare the source records, then enter through the cellar side door.')}</p></>
   :target==='photo-folder'?<><p>{t('从地下室东侧的门进入档案工作间。两处资料架和整理桌都在里面。','Enter through the cellar’s east door. Both source shelves and the sorting table are inside.')}</p>{archive.content.room?.some(row=>row.includes('M'))&&<p>{t('索引前的储物架可以移到旁边的空位，再过去查阅。','Slide the rack beside the index into the empty space to reach the records.')}</p>}</>
   :source?<><p>{t(source==='index'?'这是施工索引里的片段。':'这是工作日志里的片段。',source==='index'?'This shelf holds the work index.':'This shelf holds the work log.')}</p>{archive.examined.includes(source)?archiveEvidence(archive.content,source,locale).map((text,i)=><p key={i} className="os-campaign__clue">{text}</p>):<p>{t('靠近后查阅，把可核对的线索记下来。','Examine the records and note their evidence.')}</p>}</>
   :archive.order?<><p className="os-campaign__clue" role="status">{archive.content.discovery}</p><ol>{archive.order.map(id=><li key={id}>{label(id)}</li>)}</ol><p>{t('你也可以回修表铺，把查清的经过写进公共记录册，留给后来的人。','You may also return to the watch shop and copy your findings into the public record book for later visitors.')}</p></>:<><p>{t('按发生先后点选四张卡，再核对顺序。点已选的卡可以撤回。','Select all four events in chronological order, then check your reconstruction. Tap a selected card to remove it.')}</p><div className="os-campaign__records">{archive.content.cards.map(c=><button key={c.id} disabled={busy||!!archive.order} aria-pressed={order.includes(c.id)} onClick={()=>setOrder(old=>old.includes(c.id)?old.filter(id=>id!==c.id):[...old,c.id])}>{order.includes(c.id)?`${order.indexOf(c.id)+1}. `:''}{c.label}</button>)}</div>{order.length>0&&<ol>{order.map(id=><li key={id}>{label(id)}</li>)}</ol>}{(['index','ledger'] as const).map(s=><section key={s}><h3>{t(s==='index'?'施工索引':'工作日志',s==='index'?'Work index':'Work log')}</h3>{archive.examined.includes(s)?archiveEvidence(archive.content,s,locale).map((text,i)=><p key={i}>{text}</p>):<p>{t('还没有查阅这处资料架。','You have not examined this shelf yet.')}</p>}</section>)}</>}
  </div>
  <footer>{feedback&&<p role="status">{feedback}</p>}
   {!archive?error?<button disabled={busy||waiting} onClick={()=>setRefresh(n=>n+1)}>{t('重新连接','Reconnect')}</button>:job?.state==='ready'?<button disabled={busy} onClick={()=>void act('plan')}>{t('推开侧门','Open the side door')}</button>:<button disabled={busy||waiting||reading||['queued','planning'].includes(job?.state??'')} onClick={()=>void prepare()}>{job?.state==='failed'?t('重试','Retry'):t('准备原始记录','Prepare source records')}</button>
   :source&&!archive.examined.includes(source)?<button disabled={busy} onClick={()=>void act('observe')}>{t('查阅记录','Examine records')}</button>
   :target==='archive-desk'&&!archive.order?<button disabled={busy||order.length!==4||archive.examined.length!==2} onClick={()=>void act('decide',order)}>{t('核对顺序','Check the order')}</button>
   :<button disabled={busy} onClick={close}>{t('继续探索','Keep exploring')}</button>}
   {archive&&target!=='photo-folder'&&<button disabled={busy} onClick={tryAnother}>{t('尝试别的办法…','Try something else…')}</button>}
  </footer>
 </dialog>
}
