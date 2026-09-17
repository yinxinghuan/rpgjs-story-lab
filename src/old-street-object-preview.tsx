import {useEffect,useRef,useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetDrawerPose,oldStreetCompartmentPose} from './old-street-prop-art'
import {oldStreetPropState} from './old-street-prop-state'
import './old-street-object-preview.css'

/** Explicitly admitted objects only; no generic stock image for other interactions. */
export function OldStreetObjectPreview({target,save,drawer,cabinet,disabled,onOpenChange}:{target:string;save:Pick<StorySave,'facts'|'locale'>;drawer:string;cabinet:string;disabled:boolean;onOpenChange:(open:boolean)=>void}){
 const [open,setOpen]=useState(false),dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null)
 const isDrawer=target==='drawer',admitted=isDrawer||target==='letter-compartment'
 const pose=isDrawer?oldStreetDrawerPose(save):oldStreetCompartmentPose(save)
 const frame=pose==='closed'?0:pose==='open'?1:2
 const title=oldStreetPropState(target,save)?.[save.locale==='zh'?0:1]??''
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en
 useEffect(()=>{if(open){dialog.current?.showModal();return()=>dialog.current?.close()}},[open])
 const close=()=>{setOpen(false);onOpenChange(false);trigger.current?.focus()}
 if(!admitted)return null
 const art=<svg viewBox={isDrawer?`${frame*512+94} 172 340 350`:`${frame%2*512+86} ${Math.floor(frame/2)*512+80} 350 370`} role="img" aria-label={title}>
  <image href={isDrawer?drawer:cabinet} width={isDrawer?1536:1024} height={isDrawer?768:1024}/>
 </svg>
 return <>
  <button type="button" className="os-object-preview" ref={trigger} disabled={disabled} onClick={()=>{setOpen(true);onOpenChange(true)}} aria-label={t(`近看：${title}`,`Look closer: ${title}`)}>
   {art}<span>{t('近看物品','Look closer')}</span>
  </button>
  {open&&<dialog ref={dialog} className="os-map os-object-detail" aria-labelledby="os-object-detail-title" onCancel={e=>{e.preventDefault();close()}}>
   <header><h2 id="os-object-detail-title">{title}</h2><button onClick={close}>{t('返回物品','Back to object')}</button></header>
   <div className="os-object-detail__art">{art}</div>
  </dialog>}
 </>
}
