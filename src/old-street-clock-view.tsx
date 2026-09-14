import {useEffect,useRef,useState} from 'react'
import image from '../doc/oldstreet-clock-inspection/candidate.png'
import {oldStreetClockPuzzle as puzzle} from './old-street-clock-puzzle'
const regions=[['north-west','左上','upper left'],['north','上方','top'],['north-east','右上','upper right'],['west','左侧','left'],['center','中间','centre'],['east','右侧','right'],['south-west','左下','lower left'],['south','下方','bottom'],['south-east','右下','lower right']] as const
export function OldStreetClockView({locale,busy,feedback,submit,close}:{locale:'zh'|'en';busy:boolean;feedback:string;submit:(proof:unknown)=>void;close:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,dialog=useRef<HTMLDialogElement>(null)
 const [region,setRegion]=useState<number|null>(null),[loaded,setLoaded]=useState(false),[failed,setFailed]=useState(false)
 useEffect(()=>{const n=dialog.current;n?.showModal();return()=>n?.close()},[])
 const dismiss=()=>{if(busy)return;dialog.current?.close();close()}
 const offset=(n:number)=>Math.max(1-puzzle.zoom,Math.min(0,.5-(n+.5)/3*puzzle.zoom))*100
 return <dialog className="os-map os-clock" ref={dialog} aria-labelledby="os-clock-title" onCancel={e=>{e.preventDefault();dismiss()}}>
  <header><h2 id="os-clock-title">{t('看看钟底','Look beneath the clock')}</h2><button disabled={busy} onClick={dismiss}>{t('收起','Close')}</button></header>
  <p>{t('点一处，用放大镜看清细节。','Choose an area to examine with the lens.')}</p>
  {failed?<p role="alert">{t('图片暂未载入，可以收起后重试。','The image could not load. Close and try again.')}</p>:<>
   <div className="os-clock__image">
    <img src={image} alt={t('旧钟底部','Underside of the old clock')} draggable={false} onLoad={()=>setLoaded(true)} onError={()=>setFailed(true)} style={region===null?{}:{width:`${puzzle.zoom*100}%`,left:`${offset(region%3)}%`,top:`${offset(Math.floor(region/3))}%`}}/>
    {region===null&&regions.map((r,i)=><button disabled={busy||!loaded} key={r[0]} aria-label={t(`观察${r[1]}`,`Examine ${r[2]}`)} style={{left:`${i%3/3*100}%`,top:`${Math.floor(i/3)/3*100}%`}} onClick={()=>setRegion(i)}/>)}
   </div>
   {!loaded&&<p role="status">{t('正在拿近看……','Bringing it closer…')}</p>}
   {region!==null&&<><button disabled={busy} onClick={()=>setRegion(null)}>{t('换一处看看','Look elsewhere')}</button><p>{t('你看见了什么？','What can you make out?')}</p><div className="os-clock__choices">{[['leaf','一片树叶','A leaf'],['swallows','一对燕子','Two swallows'],['key','一把钥匙','A key']].map(([id,zh,en])=><button key={id} disabled={busy||!loaded} onClick={()=>submit({version:puzzle.version,region:regions[region][0],zoom:puzzle.zoom,mark:id})}>{t(zh,en)}</button>)}</div></>}
  </>}
  {feedback&&<p role="status">{feedback}</p>}
 </dialog>
}
