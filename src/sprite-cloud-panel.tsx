import React,{useState} from 'react'
import {creatorCloudTransport} from './creator-cloud'
import {SpriteCloudArchive} from './sprite-cloud'
import {spriteDatabaseName,verifySpriteComposition,type SpriteDraft,type SpriteDraftRepository} from './sprite-draft'
import {decodeSpritePixels,spritePreviewUrl} from './sprite-browser-io'
import type {SpriteArchiveRecord} from './sprite-archive-contract'
import {GAME_ID} from './game-id'
export default function SpriteCloudPanel({repo,draft,busy,setBusy,onRestore,locale}:{repo:SpriteDraftRepository;draft?:SpriteDraft;busy:boolean;setBusy:(v:boolean)=>void;onRestore:(d:SpriteDraft)=>Promise<void>;locale:'zh'|'en'}){
 const t=(a:string,b:string)=>locale==='zh'?a:b
 const [cloud]=useState(()=>new SpriteCloudArchive(creatorCloudTransport(window.alteruLocalStorage,async(name,work)=>{if(!navigator.locks)throw Error('CLOUD_LOCKS_UNAVAILABLE');return navigator.locks.request(name,work)})))
 const [records,setRecords]=useState<SpriteArchiveRecord[]>(),[message,setMessage]=useState(''),[error,setError]=useState('')
 async function operate(action:'save'|'list'|'restore'|'cancel',record?:SpriteArchiveRecord){
  if(busy)return;setBusy(true);setError('');setMessage(t('正在处理在线素材…','Working on online art…'))
  try{await navigator.locks.request(spriteDatabaseName(location.href),{ifAvailable:true},async lock=>{
   if(!lock)throw Error('SPRITE_OTHER_TAB')
   if(action==='list'){setRecords(await cloud.list());setMessage('');return}
   if(action==='cancel'){await cloud.cancel(record!);setRecords(await cloud.list());setMessage(t('已清除未完成的在线上传，本地候选保持不变。','Incomplete online upload removed. The local candidate is unchanged.'));return}
   const current=await repo.get();if(current?.id!==draft?.id||current?.revision!==draft?.revision)throw Error('SPRITE_DRAFT_REPLACED')
   if(action==='save'){
    if(!current?.result)throw Error('SPRITE_NOT_READY');await verifySpriteComposition(current,decodeSpritePixels)
    await cloud.save(current,(done,total)=>setMessage(t(`正在保存素材 ${Math.round(done/total*100)}%`,`Saving art ${Math.round(done/total*100)}%`)))
    setRecords(await cloud.list());setMessage(t('原图、处理参数和候选已在线保存。尚未发布。','Originals, preparation settings and candidate saved online. Not published.'))
   }else{
    if(current?.state==='processing')throw Error('SPRITE_PROCESSING')
    const restored=await cloud.restore(record!);await verifySpriteComposition(restored,decodeSpritePixels)
    for(const png of [restored.source,restored.result!.png]){const url=await spritePreviewUrl(png);URL.revokeObjectURL(url)}
    await repo.save(restored,current);await onRestore(restored);setMessage(t('已取回同一候选和原始来源，可继续地图检查。','The candidate and original sources are restored. Continue map checks.'))
   }
  })}catch(e){const code=e instanceof Error?e.message:'';setMessage('');setError(code==='SPRITE_ARCHIVE_LIMIT'?t('已保存6份素材。可以清除未完成的上传；已完成版本会保留。','Six art records are stored. Incomplete uploads can be removed; completed versions are retained.'):code==='NOT_FOUND'||code==='RUNTIME_VERSION_MISMATCH'?t('当前部署尚未开放在线人物与设备素材，本地候选仍保留。','This deployment does not support online sprite art yet. The local candidate is retained.'):t('在线操作未完成，本地原图和候选保留。重试会继续同一份上传。','The online operation did not finish. Local originals and candidates are retained; retry resumes the same upload.'))}finally{setBusy(false)}
 }
 if(location.hostname.endsWith('.github.io'))return <section><h2>{t('在线人物与设备','Online character and equipment art')}</h2><p>{t('当前是静态镜像，在线保存需使用平台主站；浏览器草稿不会自动跨站转移。','This is a static mirror. Online storage requires the main site; local drafts do not transfer automatically.')}</p><a href={`https://game.aiwaves.tech/${GAME_ID}/creator.html?create_art=sprite`}>{t('打开主站制作入口','Open main-site creator')}</a></section>
 return <section aria-label={t('在线人物与设备','Online character and equipment art')}><h2>{t('在线人物与设备','Online character and equipment art')}</h2><p>{t('最多6份素材，每份原图和结果合计最多24MiB。来源记录保持私有；保存成功不等于画面检查通过。仍使用本浏览器制作身份，尚未绑定平台账户。','Up to six records, each containing at most 24MiB of originals and results. Sources stay private; storage success does not mean visual approval. Access uses this browser’s creation identity, not a platform account yet.')}</p><button disabled={busy||draft?.state!=='candidate'} onClick={()=>void operate('save')}>{t('在线保存当前人物或设备','Save current character or equipment online')}</button><button disabled={busy} onClick={()=>void operate('list')}>{t('查看在线人物与设备','View online character and equipment art')}</button>{message&&<p role="status">{message}</p>}{error&&<p role="alert">{error}</p>}{records?.length===0&&<p>{t('还没有在线素材。','No online art yet.')}</p>}{records?.map((r,i)=><div key={r.manifest.id}><p>{i+1} · {r.manifest.draft.sourceName} · {r.state==='ready'?t('已保存','Saved'):t('上传未完成','Upload incomplete')}</p>{r.state==='ready'?<button disabled={busy} onClick={()=>void operate('restore',r)}>{t('取回此素材及原图','Restore art and originals')}</button>:<button disabled={busy} onClick={()=>void operate('cancel',r)}>{t('清除未完成上传','Remove incomplete upload')}</button>}</div>)}</section>
}
