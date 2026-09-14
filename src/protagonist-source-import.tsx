import React,{useEffect,useRef,useState} from 'react'
import {inspectSpritePng,type SpritePng} from './sprite-draft'
import {spritePreviewUrl} from './sprite-browser-io'

export default function ProtagonistSourceImport({disabled,locale,onImport}:{disabled:boolean;locale:'zh'|'en';onImport:(source:SpritePng,reference:SpritePng)=>Promise<boolean>}) {
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const [files,setFiles]=useState<Array<{png:SpritePng;url:string}|undefined>>([undefined,undefined])
 const [loading,setLoading]=useState(false),[message,setMessage]=useState<'invalid'|'saved'|'failed'|''>('')
 const live=useRef(true),urls=useRef<string[]>([]),sequence=useRef(0)
 useEffect(()=>{live.current=true;return()=>{live.current=false;sequence.current++;urls.current.forEach(URL.revokeObjectURL)}},[])
 async function choose(index:number,file:File){
  const turn=++sequence.current;if(urls.current[index]){URL.revokeObjectURL(urls.current[index]);urls.current[index]=''};setLoading(true);setMessage('');setFiles(old=>old.map((v,i)=>i===index?undefined:v))
  try{
   if(file.size>8*1024*1024)throw Error('size')
   const png=await inspectSpritePng(new Uint8Array(await file.arrayBuffer()))
   if(index===1&&(png.width%3||png.height%4))throw Error('grid')
   const url=await spritePreviewUrl(png)
   if(!live.current||turn!==sequence.current){URL.revokeObjectURL(url);return}
   urls.current[index]=url;setFiles(old=>old.map((v,i)=>i===index?{png,url}:v))
  }catch{if(live.current&&turn===sequence.current)setMessage('invalid')}
  finally{if(live.current&&turn===sequence.current)setLoading(false)}
 }
 async function save(){
  if(!files[0]||!files[1]||disabled||loading)return
  setLoading(true);setMessage('')
  try{const saved=await onImport(files[1].png,files[0].png);if(live.current)setMessage(saved?'saved':'failed')}
  catch{if(live.current)setMessage('failed')}
  finally{if(live.current)setLoading(false)}
 }
 return <details><summary>{t('导入主角与身份参考','Import protagonist and identity reference')}</summary>
 <p>{t('选择参考图与对应的四方向图集。这里只保存待检查原图，不发起生成，也不自动通过身份检查。','Select a reference and its four-direction sheet. This saves an unreviewed source; it neither generates art nor approves identity.')}</p>
 <div className="cl-protagonist-import__images">{files.map((entry,index)=><div key={index}>
 <label htmlFor={`protagonist-source-${index}`}>{index===0?t('参考 PNG','Reference PNG'):t('图集 PNG · 3列4行','Sheet PNG · 3 columns, 4 rows')}</label>
 <input id={`protagonist-source-${index}`} type="file" accept="image/png" disabled={disabled||loading} onChange={e=>{const file=e.target.files?.[0];e.target.value='';if(file)void choose(index,file)}}/>
 {entry&&<img src={entry.url} draggable={false} alt={index===0?t('主角身份参考','Protagonist identity reference'):t('待检查的主角图集','Unreviewed protagonist sheet')}/>}
 </div>)}</div>
 <button disabled={disabled||loading||files.some(f=>!f)} onClick={()=>void save()}>{loading?t('正在读取或保存…','Reading or saving…'):t('保存主角原图','Save protagonist source')}</button>
 <p role={message==='invalid'||message==='failed'?'alert':'status'}>{message==='invalid'?t('请选择有效PNG，每张不超过8 MiB；图集宽高需能分别按3列4行分格。','Use valid PNGs up to 8 MiB each. Sheet dimensions must divide into 3 columns and 4 rows.'):message==='failed'?t('未能保存，请查看页面错误后重试。','Could not save. Check the page error and retry.'):message==='saved'?t('主角原图已保存，继续下方处理与检查。','Protagonist source saved. Continue with preparation and review below.'):t('参考图只在此页面保留；草稿仅记录其摘要。尚未点击保存的选择不会保留。','The reference stays in this page only; the draft stores its digest. Unsaved selections are not retained.')}</p>
 </details>
}
