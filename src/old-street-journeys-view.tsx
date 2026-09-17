import {useEffect,useRef,useState} from 'react'
import './old-street-menu.css'
import {oldStreetRooms,type OldStreetRoom} from './old-street-cartridge'
type Row={id:string;scene:OldStreetRoom;updated:number;complete:boolean}
export function OldStreetJourneysView({locale,current,api,busy,select,create,close,soundEnabled,toggleSound,createCampaign,initialSection='game'}:{initialSection?:'game'|'journeys';createCampaign?:()=>void;soundEnabled?:boolean;toggleSound?:()=>void;locale:'zh'|'en';current:string;api:(path:string)=>Promise<any>;busy:boolean;select:(id:string)=>void;create:()=>void;close:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,dialog=useRef<HTMLDialogElement>(null)
 const [section,setSection]=useState<'game'|'journeys'>(initialSection),body=useRef<HTMLDivElement>(null)
 useEffect(()=>{if(body.current)body.current.scrollTop=0},[section])
 const [rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 useEffect(()=>{if(section!=='journeys')return;let live=true;setLoading(true);setFailed(false);void api('/sessions').then(value=>{if(!Array.isArray(value.sessions)||value.sessions.some((r:Row)=>typeof r.id!=='string'||!oldStreetRooms[r.scene]||!Number.isFinite(r.updated)))throw Error('INVALID_DIRECTORY');if(live)setRows(value.sessions)}).catch(()=>{if(live)setFailed(true)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[api,attempt,section])
 const dismiss=()=>{if(!busy){dialog.current?.close();close()}}
 return <dialog className="os-map os-journeys" data-section={section} ref={dialog} aria-label={t('菜单','Menu')} onCancel={e=>{e.preventDefault();dismiss()}}>
  <header><h2>{t('菜单','Menu')}</h2><button autoFocus disabled={busy} onClick={dismiss}>{t('收起','Close')}</button></header>
  <nav className="os-menu__sections" aria-label={t('菜单内容','Menu sections')}>
   <button aria-pressed={section==='game'} onClick={()=>setSection('game')}>{t('游戏','Game')}</button>
   <button aria-pressed={section==='journeys'} onClick={()=>setSection('journeys')}>{t('旅程','Journeys')}</button>
  </nav>
  <div className="os-journeys__body" ref={body}>
  {section==='journeys'?<>
  {loading?<p role="status">{t('正在寻找旅程……','Finding your journeys…')}</p>:failed?<><p role="alert">{t('暂时未能读取旅程，当前进度不受影响。','Could not load journeys. Your current progress is unchanged.')}</p><button onClick={()=>setAttempt(n=>n+1)}>{t('重试','Retry')}</button></>:rows.length?<ul>{rows.map(row=><li key={row.id}><button disabled={busy||row.id===current} onClick={()=>select(row.id)}><strong>{oldStreetRooms[row.scene][locale==='zh'?0:1]}</strong><span>{row.id===current?t('当前旅程','Current journey'):row.complete?t('已完成','Completed'):t('继续探索','Continue exploring')}</span><small>{new Date(row.updated).toLocaleString(locale==='zh'?'zh-CN':'en-US')}</small></button></li>)}</ul>:<p>{t('还没有其他旅程。','No other journeys yet.')}</p>}
  </>:<>
  {toggleSound&&<button aria-pressed={soundEnabled} onClick={toggleSound}>{soundEnabled?t('声音：开','Sound: on'):t('声音：关','Sound: off')}</button>}
  <details><summary>{t('操作方法','Controls')}</summary><p>{t('点击地面、拖动左下摇杆，或用方向键/WASD行走。点击物件只会走近；按右下按钮查看、交谈或通过出入口。','Tap the ground, use the lower-left stick, or move with arrow keys/WASD. Tapping an object walks closer; the lower-right button examines, talks or enters.')}</p><p>{t('预设选项可以直接执行；也可以展开自由输入。收起或走开后回到探索，委托和已发现线索保存在“随身”中。','Choose a suggested action or expand the text input. Close the panel or walk away to explore. Items keeps your errand and discoveries.')}</p></details>
  <details><summary>{t('旧版参考','Previous version')}</summary><p>{t('之前的列车故事，单独保留原有进度。','The earlier train story retains its separate progress.')}</p><a href="?story=original">{t('打开旧版参考','Open previous version')}</a></details>
  </>}
  </div>
  {section==='journeys'&&<div className="os-menu__new">
  <p>{t('另开一次探索时，当前旅程仍会保留。','Starting again keeps your current journey in this list.')}</p>
  <button disabled={busy} onClick={create}>{t('另开一段探索','Start another exploration')}</button>
  {createCampaign&&<button disabled={busy} onClick={createCampaign}>{t('试跑新的探索主线','Test the new exploration trail')}</button>}
  </div>}
 </dialog>
}
