import {useEffect,useRef,useState} from 'react'
import {oldStreetRooms,type OldStreetRoom} from './old-street-cartridge'
type Row={id:string;scene:OldStreetRoom;updated:number;complete:boolean}
export function OldStreetJourneysView({locale,current,api,busy,select,close,soundEnabled,toggleSound}:{soundEnabled?:boolean;toggleSound?:()=>void;locale:'zh'|'en';current:string;api:(path:string)=>Promise<any>;busy:boolean;select:(id:string)=>void;close:()=>void}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,dialog=useRef<HTMLDialogElement>(null)
 const [rows,setRows]=useState<Row[]>([]),[loading,setLoading]=useState(true),[failed,setFailed]=useState(false),[attempt,setAttempt]=useState(0)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 useEffect(()=>{let live=true;setLoading(true);setFailed(false);void api('/sessions').then(value=>{if(!Array.isArray(value.sessions)||value.sessions.some((r:Row)=>typeof r.id!=='string'||!oldStreetRooms[r.scene]||!Number.isFinite(r.updated)))throw Error('INVALID_DIRECTORY');if(live)setRows(value.sessions)}).catch(()=>{if(live)setFailed(true)}).finally(()=>{if(live)setLoading(false)});return()=>{live=false}},[api,attempt])
 const dismiss=()=>{if(!busy){dialog.current?.close();close()}}
 return <dialog className="os-map os-journeys" ref={dialog} aria-label={t('我的旅程','My journeys')} onCancel={e=>{e.preventDefault();dismiss()}}>
  <header><h2>{t('我的旅程','My journeys')}</h2><button disabled={busy} onClick={dismiss}>{t('收起','Close')}</button></header>
  <p>{t('继续之前的探索，或重看已经完成的旅程。','Continue an earlier exploration or revisit a completed journey.')}</p>
  {loading?<p role="status">{t('正在寻找旅程……','Finding your journeys…')}</p>:failed?<><p role="alert">{t('暂时未能读取旅程，当前进度不受影响。','Could not load journeys. Your current progress is unchanged.')}</p><button onClick={()=>setAttempt(n=>n+1)}>{t('重试','Retry')}</button></>:rows.length?<ul>{rows.map(row=><li key={row.id}><button disabled={busy||row.id===current} onClick={()=>select(row.id)}><strong>{oldStreetRooms[row.scene][locale==='zh'?0:1]}</strong><span>{row.id===current?t('当前旅程','Current journey'):row.complete?t('已完成','Completed'):t('继续探索','Continue exploring')}</span><small>{new Date(row.updated).toLocaleString(locale==='zh'?'zh-CN':'en-US')}</small></button></li>)}</ul>:<p>{t('还没有其他旅程。','No other journeys yet.')}</p>}
  {toggleSound&&<button aria-pressed={soundEnabled} onClick={toggleSound}>{soundEnabled?t('声音：开','Sound: on'):t('声音：关','Sound: off')}</button>}
  <details><summary>{t('旧版参考','Previous version')}</summary><p>{t('之前的列车故事，单独保留原有进度。','The earlier train story retains its separate progress.')}</p><a href="?story=original">{t('打开旧版参考','Open previous version')}</a></details>
 </dialog>
}
