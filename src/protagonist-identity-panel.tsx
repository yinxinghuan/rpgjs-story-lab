import React,{useEffect,useRef,useState} from 'react'
import {inspectSpritePng,type SpriteDraft} from './sprite-draft'
import {spritePreviewUrl} from './sprite-browser-io'
import {currentActorReview} from './actor-sheet-review'
import {PROTAGONIST_IDENTITY_CHECKS,type ProtagonistIdentityReview} from './protagonist-identity'

export default function ProtagonistIdentityPanel({draft,imageUrl,busy,locale,onSave}:{draft:SpriteDraft;imageUrl:string;busy:boolean;locale:'zh'|'en';onSave:(review:ProtagonistIdentityReview)=>Promise<void>}){
 const t=(a:string,b:string)=>locale==='zh'?a:b,identity=draft.protagonistIdentity!,review=currentActorReview(draft)
 const empty=()=>Object.fromEntries(PROTAGONIST_IDENTITY_CHECKS.map(k=>[k,'unchecked'])) as ProtagonistIdentityReview['checks']
 const [checks,setChecks]=useState(()=>review?.identity?.checks??empty()),[url,setUrl]=useState(''),[loading,setLoading]=useState(false),[error,setError]=useState('')
 const active=useRef(true),preview=useRef(''),sequence=useRef(0)
 useEffect(()=>{active.current=true;return()=>{active.current=false;sequence.current++;URL.revokeObjectURL(preview.current)}},[])
 useEffect(()=>{setChecks(structuredClone(review?.identity?.checks??empty()))},[draft.actorReview])
 async function reference(file:File){
  const turn=++sequence.current;URL.revokeObjectURL(preview.current);preview.current='';setUrl('');setLoading(true);setError('')
  try{
   if(file.size>8*1024*1024)throw Error('invalid')
   const png=await inspectSpritePng(new Uint8Array(await file.arrayBuffer()))
   if(png.sha256!==identity.referenceSha256)throw Error('mismatch')
   const next=await spritePreviewUrl(png)
   if(!active.current||turn!==sequence.current){URL.revokeObjectURL(next);return}
   preview.current=next;setUrl(next)
  }catch(e){if(active.current&&turn===sequence.current)setError(e instanceof Error&&e.message==='mismatch'?'mismatch':'invalid')}
  finally{if(active.current&&turn===sequence.current)setLoading(false)}
 }
 const labels={silhouette:t('轮廓与物种一致','Matching silhouette and species'),covering:t('毛发、面罩及遮盖保持一致','Matching fur, mask and coverings'),costume:t('衣装与单侧配件保持一致','Matching costume and sided accessories'),proportions:t('比例与选定俯视方向一致','Matching proportions and chosen top-down direction')}
 const dirty=JSON.stringify(checks)!==JSON.stringify(review?.identity?.checks??empty())
 return <section aria-label={t('主角身份比对','Protagonist identity comparison')}><details><summary>{t('比对主角与参考图','Compare protagonist with reference')}</summary>
 <p>{t('先保存上方图集检查，再比对身份，最后进入地图试走。改动图集检查会清空身份与地图确认。','Save the sheet review above, compare identity, then try the map. Changing sheet checks clears identity and map confirmation.')}</p>
 <label htmlFor="protagonist-review-reference">{t('重新选择原参考PNG（最多8 MiB）','Select original reference PNG (up to 8 MiB)')}</label>
 <input id="protagonist-review-reference" type="file" accept="image/png" disabled={busy||loading} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void reference(file)}}/>
 {error&&<p role="alert">{error==='mismatch'?t('这不是导入时的参考图，请选择同一份原文件。','This is not the imported reference. Select the same original file.'):t('无法读取该PNG，请检查文件后重试。','Could not read this PNG. Check the file and retry.')}</p>}
 {url&&<div className="cl-protagonist-import__images"><img src={url} alt={t('已核对摘要的原参考图','Original reference with matching digest')} draggable={false}/><img src={imageUrl} alt={t('待比对候选人物','Candidate protagonist for comparison')} draggable={false}/></div>}
 {PROTAGONIST_IDENTITY_CHECKS.map(k=><React.Fragment key={k}><label htmlFor={`identity-${k}`}>{labels[k]}</label><select id={`identity-${k}`} value={checks[k]} disabled={busy||loading||!url} onChange={e=>setChecks(old=>({...old,[k]:e.target.value as typeof checks[typeof k]}))}><option value="unchecked">{t('未检查','Not checked')}</option><option value="pass">{t('通过','Pass')}</option><option value="fail">{t('不通过','Fail')}</option></select></React.Fragment>)}
 <p role="status">{!review?t('请先保存图集检查记录。','Save a sheet review first.'):dirty?t('修改尚未保存。','Changes are not saved.'):review.identity?t('身份检查记录已保存；修改后需重新确认地图。','Identity observations saved; changes require another map confirmation.'):t('身份尚未检查。','Identity has not been reviewed.')}</p>
 <button disabled={busy||loading||!url||!review||!dirty} onClick={()=>void onSave({referenceSha256:identity.referenceSha256,checks:structuredClone(checks)})}>{t('保存身份检查','Save identity observations')}</button>
 <p>{t('参考图不上传，刷新后需重选。摘要匹配只确认文件相同，不代表画面合格。','The reference is not uploaded; reselect it after refreshing. A matching digest confirms the file, not visual quality.')}</p>
 </details></section>
}
