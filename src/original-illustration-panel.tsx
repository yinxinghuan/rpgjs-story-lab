import React,{useEffect,useRef,useState} from 'react'
import type {OriginalHead} from '../server/original-train-runtime'
import type {Transport} from './session-client'
import {originalSceneBackgroundVersion} from './original-asset-releases'
import {originalBridgePlace} from './original-place-presentation'
import {journalImageError} from './journal-image-errors'
import {readOriginalIllustrations,illustrationAction,type OriginalIllustration} from './original-illustration-contract'

/** Optional journal media. Busy state is local and never pauses story requests. */
export default function OriginalIllustrationPanel({head,api,onReadJournal}:{head:OriginalHead;api:Transport;onReadJournal:()=>void}){
 const t=(zh:string,en:string)=>head.save.locale==='zh'?zh:en,alive=useRef(true),readVersion=useRef(0)
 const [jobs,setJobs]=useState<OriginalIllustration[]>([]),[selected,setSelected]=useState(head.sceneId),[ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[clock,setClock]=useState(Date.now())
 const [picture,setPicture]=useState<{key:string;url:string}|null>(null),[imageError,setImageError]=useState(false),[imageRetry,setImageRetry]=useState(0)
 const endpoint='/sessions/'+head.id+'/illustrations',job=jobs.find(j=>j.scene===selected),key=selected+':'+(job?.asset?.sha256??'')+':'+job?.state
 const label=(scene:string)=>scene==='train-at-flood-bridge'?originalBridgePlace(head.save.locale):head.save.map.find(m=>'train-at-'+m.id===scene)?.label??t('已到达的场景','Visited place')
 async function refresh(){const request=++readVersion.current;try{const list=readOriginalIllustrations(await api(endpoint));if(alive.current&&request===readVersion.current){setJobs(list);setReady(true);setError('')}}catch(e){if(alive.current&&request===readVersion.current){setReady(false);setError(e instanceof Error?e.message:'ILLUSTRATION_UNAVAILABLE')}}}
 useEffect(()=>{alive.current=true;void refresh();const timer=setInterval(()=>setClock(Date.now()),1000);return()=>{alive.current=false;readVersion.current++;clearInterval(timer)}},[head.id,api])
 useEffect(()=>{if(!jobs.some(j=>j.state==='preparing'))return;const timer=setTimeout(()=>void refresh(),8000);return()=>clearTimeout(timer)},[jobs,ready])
 useEffect(()=>{
  setPicture(null);setImageError(false)
  if(!job||!['candidate','active'].includes(job.state)||!job.asset)return
  let live=true,url='';const asset=job.asset
  void(async()=>{try{
   const bytes=new Uint8Array(await api(endpoint+'/'+selected+'/file'))
   const sha=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')
   if(bytes.length!==asset.bytes||sha!==asset.sha256)throw Error('ILLUSTRATION_ASSET_CHANGED')
   url=URL.createObjectURL(new Blob([bytes],{type:'image/png'}));const image=new Image();image.src=url;await image.decode()
   if(image.naturalWidth!==768||image.naturalHeight!==1024)throw Error('IMAGE_INVALID')
   if(live)setPicture({key,url});else URL.revokeObjectURL(url)
  }catch{if(url)URL.revokeObjectURL(url);if(live)setImageError(true)}})()
  return()=>{live=false;if(url)URL.revokeObjectURL(url)}
 },[key,imageRetry,head.id,api])
 const action=illustrationAction(job,head.sceneId,selected,clock),supported=Boolean(originalSceneBackgroundVersion(head.assets,head.sceneId))
 async function start(){setBusy(true);setError('');readVersion.current++;try{
  const list=readOriginalIllustrations(await api(endpoint,{scene:selected,expected_version:head.version,retry:action==='retry'}))
  if(alive.current){readVersion.current++;setJobs(list);setReady(true)}
 }catch(e){if(alive.current){setReady(false);setError(e instanceof Error?e.message:'ILLUSTRATION_UNAVAILABLE')}}finally{if(alive.current)setBusy(false)}}
 async function decide(decision:'keep'|'discard'){
  if(!job?.asset)return
  setBusy(true);setError('');readVersion.current++
  try{const list=readOriginalIllustrations(await api(endpoint+'/'+selected+'/decision',{scene:selected,attempt:job.attempt,sha256:job.asset.sha256,decision}));if(alive.current){readVersion.current++;setJobs(list);setReady(true)}}
  catch(e){if(alive.current){setReady(false);setError(e instanceof Error?e.message:'ILLUSTRATION_UNAVAILABLE')}}finally{if(alive.current)setBusy(false)}
 }
 const issue=error||job?.error
 const explanation=issue==='ILLUSTRATION_DECISION_CONFLICT'||issue==='ILLUSTRATION_CANDIDATE_CHANGED'?t('这张候选的记录已变化，请重新读取已保存的决定。','This candidate record changed. Reload its saved decision.'):issue==='ILLUSTRATION_SCENE_CHANGED'?t('当前位置已变化，请重新读取画页记录。','The current location changed. Reload the illustration record.'):issue==='ILLUSTRATION_DAILY_LIMIT'?t('今天的制作次数已用完，已有画页和旅程仍可继续。','Today’s creation limit is reached. Existing illustrations and your journey remain available.'):issue==='ILLUSTRATION_BACKGROUND_UNAVAILABLE'?t('这里尚未准备好画页参考图，可以继续旅程。','This place has no prepared illustration reference yet. You can continue your journey.'):journalImageError(issue,head.save.locale)
 return <section className="og-illustrations" aria-label={t('旅途画页','Journey illustrations')}>
  <p>{t('为到过的地方留一张环境回忆。只发送公开背景和场景画面说明，不发送对白、头像或存档。制作时可以关闭面板继续旅程。','Keep an illustrated memory of a visited place. Only the public background and visual instructions are sent, not dialogue, avatars or your save. Close this panel to keep playing during creation.')}</p>
  <label htmlFor="og-illustration-scene">{t('回看地点','Place to revisit')}</label><select id="og-illustration-scene" value={selected} disabled={busy} onChange={e=>setSelected(e.target.value)}>{[head.sceneId,...jobs.map(j=>j.scene).filter(scene=>scene!==head.sceneId)].map(scene=><option key={scene} value={scene}>{label(scene)}{scene===head.sceneId?t(' · 当前',' · Current'):''}</option>)}</select>
  {!ready&&!error&&<p role="status">{t('正在读取画页记录…','Loading illustrations…')}</p>}
  {job?.state==='candidate'&&<p role="status">{t('待决定的候选。请核对地点、光照和清晰度；查看图片不会自动保留。','Candidate awaiting your decision. Check the place, lighting and clarity. Viewing it does not keep it automatically.')}</p>}
  {job?.state==='active'&&<p role="status">{t('已保留为这段旅程的环境回忆。','Kept as an illustrated memory of this journey.')}</p>}
  {job?.state==='discarded'&&<><p role="status">{t('这张候选未保留。原场景与文字记录保持不变。','This candidate was not kept. The original scene and written journal are unchanged.')}</p><button className="og-choice" onClick={onReadJournal}>{t('继续阅读旅程记录','Continue reading the journal')}</button></>}
  {picture?.key===key?<figure><img src={picture.url} width="768" height="1024" alt={t('环境回忆：','Illustrated memory: ')+label(selected)} draggable={false}/><figcaption>{t('这是发起制作时的环境回忆，不是新事件或当前地图。','A memory of the place when requested, not a new event or the current map.')}</figcaption></figure>:job&&['active','candidate'].includes(job.state)&&!imageError?<p role="status">{t('正在读取图片…','Loading image…')}</p>:null}
  {ready&&job?.state==='candidate'&&<div><button className="og-choice" disabled={busy||picture?.key!==key} onClick={()=>void decide('keep')}>{t('保留这张画页','Keep this illustration')}</button><button className="og-choice" disabled={busy} onClick={()=>void decide('discard')}>{t('不保留这张候选','Do not keep this candidate')}</button></div>}
  {job?.state==='preparing'&&<p role="status">{t('画页正在准备。离开后可从这里恢复同一任务。','The illustration is being prepared. Return here to recover the same task.')}</p>}
  {issue&&<p role="status">{explanation}</p>}
  {imageError&&<><p role="status">{t('图片暂时无法读取，旅程没有改变。','The image could not load. Your journey is unchanged.')}</p><button className="og-choice" onClick={()=>setImageRetry(n=>n+1)}>{t('重新读取图片','Reload image')}</button></>}
  {error&&<button className="og-choice" disabled={busy} onClick={()=>void refresh()}>{t('重新读取画页记录','Reload illustration records')}</button>}
  {ready&&action==='wait'&&<p role="status">{t('稍后可恢复制作：','Creation available in ')}{Math.ceil((job!.nextAt-clock)/1000)}s</p>}
  {ready&&action==='exhausted'&&<p>{t('这个地点的两次制作机会已用完，旅程记录仍保留。','Both attempts for this place have been used. Your written journal remains available.')}</p>}
  {ready&&action==='return'&&<p>{t('回到这个地点后可重新制作。','Return to this place to try again.')}</p>}
  {ready&&!job&&!supported&&<p>{t('这里暂未提供画页，可以回看其他地点已有的记录。','Illustrations are not available here yet. You can revisit existing records for other places.')}</p>}
  {ready&&(job||supported)&&['create','recover','retry'].includes(action)&&<button className="og-choice" disabled={busy} onClick={()=>void start()}>{busy?t('正在连接…','Connecting…'):action==='recover'?t('恢复同一画页任务','Recover the same illustration task'):action==='retry'?t('重新制作（最后一次）','Try again (last attempt)'):t('制作当前地点的画页','Create illustration of this place')}</button>}
 </section>
}
