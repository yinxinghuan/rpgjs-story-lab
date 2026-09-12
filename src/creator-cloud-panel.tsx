import {originalEntry} from './original-release'
import React,{useState} from 'react'
import {CreatorCloudDrafts,creatorCloudTransport} from './creator-cloud'
import {artDraftDatabaseName,decodeArtCandidate,type ArtDraft,type ArtDraftRepository} from './art-draft'
import type {CloudArtRecord} from './creator-contract'
import {assertBackgroundReview,backgroundReleasePath,type PublishedBackground} from './background-publication'
import {GAME_ID} from './game-id'
export default function CreatorCloudPanel({repo,draft,busy,setBusy,onRestore}:{repo:ArtDraftRepository;draft?:ArtDraft;busy:boolean;setBusy:(v:boolean)=>void;onRestore:(d:ArtDraft)=>void}){
 const zh=navigator.language.startsWith('zh'),t=(a:string,b:string)=>zh?a:b
 const [cloud]=useState(()=>new CreatorCloudDrafts(creatorCloudTransport(window.alteruLocalStorage,async(name,work)=>{if(!navigator.locks)throw Error('CLOUD_LOCKS_UNAVAILABLE');return navigator.locks.request(name,work)})))
 const [records,setRecords]=useState<CloudArtRecord[]>(),[message,setMessage]=useState(''),[error,setError]=useState('')
 const [release,setRelease]=useState<PublishedBackground>();let reviewReady=false;try{assertBackgroundReview(draft?.review,draft?.candidate?.sha256??'');reviewReady=true}catch{}
 const pending=draft&&(['prepared','generating'].includes(draft.state)||draft.state==='failed'&&draft.retryable)
 async function operate(action:'save'|'list'|'restore'|'publish',record?:CloudArtRecord){
  if(busy)return;setBusy(true);setError('');setMessage(action==='publish'?t('正在发布背景版本…','Publishing the background version…'):action==='save'?t('正在保存原图…','Saving the original image…'):action==='restore'?t('正在取回并检查原图…','Retrieving and checking the original…'):t('正在读取在线草稿…','Loading online drafts…'))
  try{
   if(!navigator.locks)throw Error('CLOUD_LOCKS_UNAVAILABLE')
   await navigator.locks.request(artDraftDatabaseName(location.href),{ifAvailable:true},async lock=>{
    if(!lock)throw Error('OTHER_TAB')
    if(action==='list'){setRecords(await cloud.list());setMessage('');return}
    const current=await repo.get()
    if(current?.id!==draft?.id)throw Error('DRAFT_REPLACED')
    if(action==='publish'){if(!current)throw Error('ART_NOT_READY');setRelease(await cloud.publish(current));setMessage(t('背景版本已发布，原图可公开读取。已有旅程保持原样。','The background version is published and its image is public. Existing journeys are unchanged.'))}else if(action==='save'){
     if(!current)throw Error('ART_NOT_READY');await cloud.save(current);setRecords(await cloud.list());setMessage(t('原图已在线保存，可从当前制作身份取回。','Original saved online and retrievable with this creation identity.'))
    }else{
     if(current&&(['prepared','generating'].includes(current.state)||current.state==='failed'&&current.retryable))throw Error('PENDING')
     const restored=await cloud.restore(record!),url=await decodeArtCandidate(restored.candidate!);URL.revokeObjectURL(url)
     await repo.put(restored);onRestore(restored);setMessage(t('已取回同一版本，可以在地图中试走。','The same version is restored and ready for a map preview.'))
    }
   })
  }catch(e){const code=e instanceof Error?e.message:'';setMessage('');setError(code==='ART_DRAFT_LIMIT'?t('已保存6个候选，当前存储额度已满。浏览器中的候选仍保留。','Six candidates are already saved. Storage is full; your browser candidate is retained.'):code==='NOT_FOUND'||code==='RUNTIME_VERSION_MISMATCH'?t('这个部署尚未开放在线草稿。浏览器中的候选仍可使用。','Online drafts are not available on this deployment yet. Browser candidates still work.'):code==='OTHER_TAB'||code==='DRAFT_REPLACED'?t('另一窗口已操作草稿。请刷新后继续。','Another tab changed the draft. Reload to continue.'):t('在线操作未完成，当前候选仍保留。可以重试同一操作。','The online operation did not complete. Your current candidate is retained; retry the same operation.'))}finally{setBusy(false)}
 }
 if(location.hostname.endsWith('.github.io'))return <section aria-label={t('在线草稿','Online drafts')}><h2>{t('在线草稿','Online drafts')}</h2><p>{t('当前是静态镜像。在线草稿请从平台主站的制作入口使用；浏览器中的草稿不会自动跨站转移。','This is the static mirror. Use online drafts from the main site’s creation entry. Browser drafts do not transfer between sites automatically.')}</p><a href={`https://game.aiwaves.tech/${GAME_ID}/creator.html`}>{t('打开主站制作入口','Open the main creation entry')}</a></section>
 return <section aria-label={t('在线草稿','Online drafts')}><h2>{t('在线草稿','Online drafts')}</h2><p>{t('最多保存6个背景原图。使用当前浏览器的独立制作身份，尚未绑定平台账户；请保留浏览器数据以便再次取回。','Save up to six original backgrounds. Access uses this browser’s separate creation identity, not a platform account yet. Keep browser data to retrieve them again.')}</p><button disabled={busy||!draft?.candidate||!draft.taskId} onClick={()=>void operate('save')}>{t('在线保存当前候选','Save current candidate online')}</button><button disabled={busy} onClick={()=>void operate('list')}>{t('查看在线草稿','View online drafts')}</button>{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}{draft?.candidate&&<><p>{reviewReady?t('地图检查已保存。发布后，背景原图可通过版本链接公开读取。','Map review saved. Publishing makes the original image publicly readable through its version link.'):t('发布前先在地图里完成检查并确认画面。','Complete the map checks and visual review before publishing.')}</p><button disabled={busy||!reviewReady} onClick={()=>void operate('publish')}>{t('发布此背景版本','Publish this background version')}</button></>}{release&&release.sha256===draft?.candidate?.sha256&&release.id.split('.')[1]===draft.id&&<a href={originalEntry(import.meta.env.MODE,location.hostname,'?story=original')?`./?story=original&background_release=${encodeURIComponent(release.id)}`:backgroundReleasePath(release.id)+'/file'}>{originalEntry(import.meta.env.MODE,location.hostname,'?story=original')?t('以此背景开始新旅程','Start a new journey with this background'):t('查看已发布的背景图','View published background')}</a>}{records?.length===0&&<p>{t('还没有在线保存的背景。','No backgrounds saved online yet.')}</p>}{records?.map((r,i)=><button key={r.id} disabled={busy||Boolean(pending)} onClick={()=>void operate('restore',r)}>{t('取回背景','Retrieve background')} {i+1} · {r.lighting==='cool'?t('清晨冷光','Cool dawn'):t('暖灯倒影','Warm lamps')} · {new Date(r.createdAt).toLocaleDateString(zh?'zh-CN':'en-US')}</button>)}<p><a href="./creator.html?create_art=assembly">{t('组合多个素材版本进入旅程','Combine art versions in a journey')}</a></p></section>
}
