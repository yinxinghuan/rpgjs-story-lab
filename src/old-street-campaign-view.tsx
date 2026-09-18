import {OldStreetRecordDesk} from './old-street-record-desk'
import type {StorySave} from './vendor/original-train/types'
import {useEffect,useRef,useState} from 'react'
import type {OldStreetCampaign} from './old-street-campaign'
import type {CampaignJob} from '../server/old-street-campaign-jobs'
import './old-street-campaign-view.css'
type Stage='trace'|'parcel'
export function OldStreetCampaignView({campaign,save,photoImage,stage,published=false,locale,sessionId,api,busy,feedback,act,archive,close,nextPurpose}:{nextPurpose?:string;campaign:OldStreetCampaign;save?:StorySave;photoImage?:string;stage:Stage;published?:boolean;locale:'zh'|'en';sessionId:string;api:(path:string,body?:unknown)=>Promise<any>;busy:boolean;feedback:string;act:(type:'read'|'observe'|'decide',selection?:number|string)=>Promise<void>;archive?:()=>void;close:()=>void}){
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
 // Opening this view follows the normal walk-to-anchor action. Preparation
 // may continue after closing, but observation is committed only while open.
 // Latches prevent rerenders/StrictMode from retrying a rejected operation.
 const started=useRef<string>(),readAttempt=useRef<string>()
 useEffect(()=>{
  if(busy||waiting||(!instance&&reading)||failed||feedback)return
  if(instance?.observed)return
  if(instance||job?.state==='ready'){
   if(readAttempt.current===path)return
   readAttempt.current=path
   void act(instance?'observe':'read')
  }else if(!job&&started.current!==path){
   started.current=path
   void prepare()
  }
 },[path,instance,job,reading,waiting,failed,busy,feedback,act])
 const reconnect=()=>{setReading(true);setFailed(false);setRefresh(n=>n+1)}
 const trace=campaign.trace,parcel=campaign.parcel
 const heading=t(stage==='trace'?'公共记录册':'寄存材料',stage==='trace'?'Public record book':'Filed papers')
 const documentTitle=stage==='trace'&&campaign.archive?.order?campaign.archive.content.title:instance?.content.title
 const dismiss=()=>{if(!busy)close()}
 return <dialog ref={root} className="os-map os-campaign" aria-labelledby="os-campaign-title" onCancel={e=>{e.preventDefault();dismiss()}}>
  <header><h2 id="os-campaign-title">{heading}</h2><button disabled={busy} onClick={dismiss}>{t('收起','Close')}</button></header>
  <div className="os-campaign__body">
   {stage!=='trace'&&documentTitle&&documentTitle!==heading&&<h3 className="os-campaign__document-title">{documentTitle}</h3>}
   {!instance?<>
    <p>{t(stage==='trace'?'信旁的寄存条有两处特征，可以和记录册里的条目比对。':'按记录找到的纸袋就在资料架上。',stage==='trace'?'The slip beside the letter has two identifying details. Compare them with the ledger.':'The packet matching the record is on the shelf.')}</p>
    <p role="status">{failed?t('暂时连不上。重新连接即可查看准备进度，也可以先收起。','Connection interrupted. Reconnect to check progress, or close this for now.'):reading?t('正在查看材料的准备进度…','Checking the papers…'):job?.state==='failed'?t('材料暂时没能展开。进度已保存，可以重试。','The papers could not be prepared. Your progress is safe; you can retry.'):job?.state==='ready'?t('材料已经准备好。','The papers are ready.'):job?.state==='planning'||job?.state==='queued'?t('正在展开材料。可以收起，先去街上看看，回来继续。','Preparing the papers. You can close this, explore the street, and return later.'):t('展开材料，查看里面的线索。','Lay out the papers to examine the clues.')}</p>
   </>:!instance.observed?<p>{t('仔细看看纸面上的内容。','Take a closer look at the paper.')}</p>:stage==='trace'&&trace?<OldStreetRecordDesk campaign={campaign} save={save} photoImage={photoImage} published={published} locale={locale} busy={busy} act={selection=>act('decide',selection)}/>
   :parcel?<>
    {trace?.selected!==undefined&&<p className="os-campaign__clue">{trace.content.records[trace.selected].label} · {trace.content.records[trace.selected].mark}</p>}
    {campaign.archive?.order?<><p className="os-campaign__clue">{campaign.archive.content.discovery}</p><details><summary>{t('回看原始寄存条','Review the original filing slip')}</summary><p>{parcel.content.fragment}</p></details></>:<><p>{parcel.content.fragment}</p>{parcel.content.question&&<p className="os-campaign__clue">{parcel.content.question}</p>}{campaign.version>=2&&<p>{t('隔壁档案间保存着原始记录。核对它们，才能把这段经过讲清楚。','The adjoining archive holds the source records. Compare them to piece together what happened.')}</p>}</>}
    {!parcel.disposition?<p>{t('带走可交给家人；留下则保留在这里，回家转述内容。','Take it to show your family, or leave it here and tell them what you read.')}</p>:<p>{t(parcel.disposition==='take'?'原件已收进你的行囊。':'原件仍留在架上，你记下了它的内容。',parcel.disposition==='take'?'The original is in your bag.':'The original remains on the shelf. You remember what it says.')}</p>}
    {parcel.disposition&&nextPurpose&&<p className="os-campaign__clue">{nextPurpose}</p>}
   </>:null}
  </div>
  <footer>
   {stage==='parcel'&&archive&&!campaign.archive?.order&&<button disabled={busy} onClick={archive}>{t('追查原始记录','Follow the source records')}</button>}
   {feedback&&<p role="status">{feedback}</p>}
   {!instance?(failed?<button disabled={busy||waiting} onClick={reconnect}>{t('重新连接','Reconnect')}</button>:job?.state==='ready'?<button disabled={busy||reading} onClick={()=>void act('read')}>{t('阅读材料','Read the papers')}</button>:<button disabled={busy||waiting||reading||job?.state==='queued'||job?.state==='planning'} onClick={()=>void prepare()}>{reading?t('正在连接…','Connecting…'):waiting||job?.state==='queued'||job?.state==='planning'?t('正在准备…','Preparing…'):job?.state==='failed'?t('重新展开','Try again'):t('展开材料','Lay out the papers')}</button>):!instance.observed?<button disabled={busy} onClick={()=>void act('observe')}>{t('阅读线索','Read the clues')}</button>:stage==='parcel'&&!parcel?.disposition?<><button disabled={busy} onClick={()=>void act('decide','take')}>{t('带走原件','Take the original')}</button><button disabled={busy} onClick={()=>void act('decide','leave')}>{t('记下内容，留下原件','Remember it and leave it')}</button></>:<button disabled={busy} onClick={dismiss}>{t('继续探索','Continue exploring')}</button>}
  </footer>
 </dialog>
}
