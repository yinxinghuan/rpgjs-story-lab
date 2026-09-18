import {useEffect,useId,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import './old-street-material-reader.css'
type Material={title:string;locale:'zh'|'en';paragraphs?:string[];image?:string}
/** Reading is display-only: it never commits an observation or a puzzle answer. */
export function OldStreetMaterialReader({title,locale,paragraphs=[],image,onClose}:Material&{onClose:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,dialog=useRef<HTMLDialogElement>(null),titleId=useId(),[zoom,setZoom]=useState(1),[failed,setFailed]=useState(false),[retry,setRetry]=useState(0)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 return createPortal(<dialog ref={dialog} className={'os-material-reader'+(!image?' os-material-reader--text':'')} aria-labelledby={titleId} onCancel={e=>{e.preventDefault();e.stopPropagation();onClose()}}>
  <header><h2 id={titleId}>{title}</h2><button type="button" autoFocus onClick={onClose}>{t('返回','Back')}</button></header>
  <div className="os-material-reader__tools" aria-label={t('调整阅读大小','Reading size')}><button type="button" disabled={zoom===1} aria-label={t('缩小','Zoom out')} onClick={()=>setZoom(n=>Math.max(1,n-.5))}>−</button><output aria-live="polite">{Math.round(zoom*100)}%</output><button type="button" disabled={zoom===(image?3:2)} aria-label={t('放大','Zoom in')} onClick={()=>setZoom(n=>Math.min(image?3:2,n+.5))}>+</button><button type="button" disabled={zoom===1} onClick={()=>setZoom(1)}>{t('还原','Reset')}</button></div>
  {image&&<div className="os-material-reader__image" tabIndex={0} aria-label={t('照片，放大后可上下左右滚动查看','Photograph. Scroll in any direction after zooming.')}>
   {failed?<div role="status"><p>{t('图片暂未载入，已发现的线索仍然保留。','The image is unavailable. Your discovered clues are still saved.')}</p><button type="button" onClick={()=>{setFailed(false);setRetry(n=>n+1)}}>{t('重试图片','Retry image')}</button></div>:<img key={retry} src={image} alt={title} draggable={false} onError={()=>setFailed(true)} style={{width:`${zoom*100}%`}}/>}
  </div>}
  {image&&<p className="os-material-reader__hint">{t('放大后滑动查看细节。','Zoom in, then scroll to inspect details.')}</p>}
  {paragraphs.length>0&&<div className="os-material-reader__text" style={{fontSize:image?18:18*zoom}}>{paragraphs.map((p,i)=><p key={i}>{p}</p>)}</div>}
 </dialog>,document.body)
}
export function OldStreetMaterialButton({title,locale,paragraphs,image,thumbnail=false,label}:Material&{thumbnail?:boolean;label?:string}){
 const [open,setOpen]=useState(false),[failed,setFailed]=useState(false)
 useEffect(()=>setFailed(false),[image])
 const text=label??(locale==='zh'?(image?'查看大图':'展开阅读'):(image?'View larger':'Read enlarged'))
 return <><button type="button" className={'os-material-open'+(thumbnail?' os-material-open--photo':'')} aria-label={`${text} · ${title}`} onClick={()=>setOpen(true)}>
  {thumbnail&&image&&!failed&&<img src={image} alt={title} draggable={false} onError={()=>setFailed(true)}/>}
  <span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM15 15l6 6M7 10h6M10 7v6"/></svg>{text}</span>
 </button>{open&&<OldStreetMaterialReader title={title} locale={locale} paragraphs={paragraphs} image={image} onClose={()=>setOpen(false)}/>}</>
}
