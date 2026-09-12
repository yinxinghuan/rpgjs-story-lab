import React,{useState} from 'react'
import type {SpriteDraft} from './sprite-draft'

export default function ActorFramePatchPanel({draft,busy,locale,onReplace}:{draft:SpriteDraft;busy:boolean;locale:'zh'|'en';onReplace:(file:File,row:number,column:number)=>Promise<void>}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const [file,setFile]=useState<File>(),[row,setRow]=useState(3),[column,setColumn]=useState(2)
 const directions=[t('向下 · 面向镜头','Down · Toward camera'),t('向左','Left'),t('向右','Right'),t('向上 · 背对镜头','Up · Away from camera')]
 return <details><summary>{t('替换人物的一帧','Replace one character frame')}</summary>
  <p>{t('只替换原图中的一个格子，另存新记录。其余十一帧保持原样；新候选需要重新处理和检查。','Replace one source cell and save a new record. The other eleven frames stay unchanged; process and review the new candidate again.')}</p>
  <p>{t('替换图必须与一个格子尺寸相同：','The replacement must match one cell: ')}{draft.source.width/3} × {draft.source.height/4} px</p>
  <label htmlFor="actor-patch-row">{t('替换方向','Direction to replace')}</label><select id="actor-patch-row" value={row} disabled={busy} onChange={e=>setRow(Number(e.target.value))}>{directions.map((name,i)=><option key={i} value={i}>{name}</option>)}</select>
  <label htmlFor="actor-patch-column">{t('替换帧','Frame to replace')}</label><select id="actor-patch-column" value={column} disabled={busy} onChange={e=>setColumn(Number(e.target.value))}><option value={0}>{t('第1帧 · 行走','Frame 1 · Walking')}</option><option value={1}>{t('第2帧 · 站立','Frame 2 · Standing')}</option><option value={2}>{t('第3帧 · 行走','Frame 3 · Walking')}</option></select>
  <label htmlFor="actor-patch-file">{t('选择单帧 PNG（最多 8 MiB）','Choose a single-frame PNG (up to 8 MiB)')}</label><input id="actor-patch-file" type="file" accept="image/png" disabled={busy} onChange={e=>setFile(e.target.files?.[0])}/>
  {file&&<p>{file.name} · {t('尚未保存','Not saved yet')}</p>}
  <button disabled={busy||!file} onClick={()=>{if(file)void onReplace(file,row,column)}}>{t('替换并另存原图','Replace and save a new source')}</button>
  {draft.actorPatch&&<p>{t('当前原图已替换：','Current source replacement: ')}{directions[draft.actorPatch.row]} · {t('第','Frame ')}{draft.actorPatch.column+1}{t('帧','')} · {draft.actorPatch.frame.sourceName}</p>}
 </details>
}
