import React,{useEffect,useMemo,useRef,useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetEndingReel} from './old-street-ending-reel'
import clock from '../doc/oldstreet-mantel-clock/cutout.png'
import street from '../doc/oldstreet-street-atmosphere/ground/candidate.png'
import {actorArt} from './art-catalog'
import {oldStreetPhotoPuzzle} from './old-street-photo-puzzle'
import './old-street-ending-view.css'
export function OldStreetEndingView({save,busy,onJourneys,onRestart}:{save:StorySave;busy:boolean;onJourneys:()=>void;onRestart:()=>void}){
 const zh=save.locale==='zh',t=(a:string,b:string)=>zh?a:b
 const beats=useMemo(()=>oldStreetEndingReel(save),[save]),[index,setIndex]=useState(0),[paused,setPaused]=useState(false)
 const [reduced,setReduced]=useState(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)
 const [hidden,setHidden]=useState(document.hidden),[imageFailed,setImageFailed]=useState(false)
 const root=useRef<HTMLDialogElement>(null),beat=beats[index],ended=!beat
 useEffect(()=>{root.current?.showModal();const query=matchMedia('(prefers-reduced-motion: reduce)'),change=()=>setReduced(query.matches),visibility=()=>setHidden(document.hidden);query.addEventListener('change',change);document.addEventListener('visibilitychange',visibility);return()=>{root.current?.close();query.removeEventListener('change',change);document.removeEventListener('visibilitychange',visibility)}},[])
 useEffect(()=>setImageFailed(false),[index])
 useEffect(()=>{if(!beat||paused||reduced||hidden)return;const ms=Math.max(6500,Math.min(16000,beat.text.length*(zh?155:55)));const timer=setTimeout(()=>setIndex(n=>n+1),ms);return()=>clearTimeout(timer)},[beat,paused,reduced,hidden,zh])
 const replay=()=>{setIndex(0);setPaused(false)}
 return <dialog ref={root} className="os-ending" onCancel={e=>{e.preventDefault();setIndex(beats.length)}} aria-label={t('旅程尾声','Journey epilogue')}>
  <div className="os-ending__backdrop" style={{backgroundImage:`url("${street}")`}} aria-hidden="true"/>
  <header><span>{t('旧街最后一封信','THE LAST LETTER')}</span>{!ended&&<button onClick={()=>setIndex(beats.length)}>{t('跳过演出','Skip epilogue')}</button>}</header>
  <main key={beat?.id??'end'} className="os-ending__stage">
   {(!beat||beat.art==='street')&&!imageFailed&&<svg className="os-ending__object" viewBox="362 0 362 362" aria-hidden="true"><defs><clipPath id="os-ending-hero-frame"><rect x="362" y="0" width="362" height="362"/></clipPath></defs><image clipPath="url(#os-ending-hero-frame)" href={actorArt.balanced.hero.path} width="1086" height="1448" onError={()=>setImageFailed(true)}/></svg>}
   {beat&&beat.art!=='street'&&!imageFailed&&<img className={'os-ending__object os-ending__object--'+beat.art} src={beat.art==='clock'?clock:oldStreetPhotoPuzzle.image} alt="" draggable={false} onError={()=>setImageFailed(true)}/>}
   <div className="os-ending__caption" aria-live={paused||reduced?'polite':'off'}><small>{beat?.label??t('旅程结束','END OF THIS JOURNEY')}</small>{ended?<><h1>{save.finale.ending?.title??t('信已送到','The letter is home')}</h1><p>{save.finale.ending?.thesis}</p></>:<p>{beat.text}</p>}</div>
  </main>
  <footer>{ended?<><button onClick={onJourneys} disabled={busy}>{t('查看旅程','View journeys')}</button><button onClick={replay}>{t('重看尾声','Replay epilogue')}</button><button onClick={onRestart} disabled={busy}>{t('重新探索','Explore again')}</button></>:<><span className="os-ending__progress" aria-label={t('尾声段落','Epilogue passage')}>{index+1} / {beats.length}</span>{index>0&&<button onClick={()=>{setIndex(n=>n-1);setPaused(true)}}>{t('上一段','Previous')}</button>}{!reduced&&<button onClick={()=>setPaused(p=>!p)}>{paused?t('播放','Play'):t('暂停','Pause')}</button>}<button onClick={()=>setIndex(n=>n+1)}>{t('继续','Continue')}</button></>}</footer>
 </dialog>
}
