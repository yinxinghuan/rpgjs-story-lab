import {useEffect,useRef,useState} from 'react'
import {developingPreview,validDevelopingSetting,type DevelopingSetting} from './old-street-developing-puzzle'
import './old-street-developing-view.css'
export function OldStreetDevelopingView({locale,image,version,sessionId,busy,feedback,submit,close,clearFeedback}:{locale:'zh'|'en';image:string;version:string;sessionId:string;busy:boolean;feedback:string;clearFeedback:()=>void;submit:(proof:unknown)=>void;close:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,key=`oldstreet-developing:${sessionId}:${version}`
 const [setting,setSetting]=useState<DevelopingSetting>(()=>{try{const draft=JSON.parse(window.alteruSessionStorage.getItem(key)??'null');if(validDevelopingSetting(draft))return draft}catch{}return {focus:0,exposure:0}})
 const [loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false)
 const root=useRef<HTMLDialogElement>(null),preview=developingPreview(version,setting)
 useEffect(()=>{root.current?.showModal();return()=>root.current?.close()},[])
 useEffect(()=>{try{window.alteruSessionStorage.setItem(key,JSON.stringify(setting))}catch{}},[key,setting])
 const adjust=(axis:keyof DevelopingSetting,value:number)=>{if(!busy&&loaded&&!failed){clearFeedback();setSetting(old=>({...old,[axis]:Math.max(0,Math.min(6,value))}))}}
 const focusText=preview.focusReady?t('边缘清晰','Edges are sharp'):t('边缘还发虚','Edges are soft')
 const lightText=preview.light==='dark'?t('暗部细节看不清','Shadows hide the details'):preview.light==='bright'?t('亮部有些泛白','Highlights are washed out'):t('明暗细节都能看清','Light and shadow hold their detail')
 return <dialog ref={root} className="os-map os-photo os-developing" aria-label={t('显出旧照片','Bring the photograph into view')} onCancel={e=>{e.preventDefault();if(!busy)close()}}>
  <header><h2>{t('显出旧照片','Develop the print')}</h2><button disabled={busy} onClick={close}>{t('收起','Close')}</button></header>
  <div className="os-photo__content">
   <p>{t('调清边缘，调整明暗，让照片细节显出来。','Adjust focus and exposure to reveal the details.')}</p>
   <div className="os-developing__print"><img src={image} alt={t('显影台上正在调整的旧街照片','The street photograph being adjusted on the developing bench')} draggable={false} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} style={{filter:`grayscale(1) blur(${preview.blur}px) brightness(${preview.brightness})`}}/></div>
   <p role="status">{failed?t('照片没能载入。收起后可重新载入。','The photograph could not load. Close and reload it.'):!loaded?t('正在展开照片…','Opening the print…'):`${focusText} · ${lightText}`}</p>
   {(['focus','exposure'] as const).map(axis=>{const label=axis==='focus'?t('焦距','Focus'):t('曝光','Exposure');return <div className="os-developing__control" key={axis}>
    <label htmlFor={'developing-'+axis}>{label}<span>{setting[axis]+1}/7</span></label>
    <div><button aria-label={t(`降低${label}`,`Decrease ${label.toLowerCase()}`)} disabled={busy||!loaded||failed||setting[axis]===0} onPointerDown={()=>adjust(axis,setting[axis]-1)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();adjust(axis,setting[axis]-1)}}}>−</button>
    <input id={'developing-'+axis} type="range" min="0" max="6" step="1" value={setting[axis]} aria-valuetext={`${setting[axis]+1}/7 — ${axis==='focus'?focusText:lightText}`} disabled={busy||!loaded||failed} onChange={e=>adjust(axis,Number(e.target.value))}/>
    <button aria-label={t(`提高${label}`,`Increase ${label.toLowerCase()}`)} disabled={busy||!loaded||failed||setting[axis]===6} onPointerDown={()=>adjust(axis,setting[axis]+1)} onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();adjust(axis,setting[axis]+1)}}}>+</button></div>
   </div>})}
   {feedback&&<p role="alert">{feedback}</p>}
  </div>
  <div className="os-photo__controls"><button disabled={busy||!loaded||failed} onClick={()=>submit({method:'develop-v1',version,...setting})}>{t('确认这张照片','Keep this adjustment')}</button></div>
 </dialog>
}
