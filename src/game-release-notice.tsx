import {useEffect,useRef,useState} from 'react'
import {createReleaseProbe,releaseReloadUrl} from './game-release'
import './game-release-notice.css'
declare const __GAME_RELEASE__:string
export function useGameRelease(current=typeof __GAME_RELEASE__==='undefined'?undefined:__GAME_RELEASE__,base?:string){
 const [version,setVersion]=useState<string>()
 useEffect(()=>{
  if(!current)return
  const probe=createReleaseProbe(current,setVersion,fetch,base)
  let disposed=false,recheck:ReturnType<typeof setTimeout>|undefined
  const check=async()=>{if(document.hidden||disposed)return;if(await probe.check()&&!disposed){clearTimeout(recheck);recheck=setTimeout(()=>void check(),2500)}}
  void check();const timer=setInterval(()=>void check(),60000)
  const visible=()=>{if(!document.hidden)void check()}
  window.addEventListener('focus',visible);document.addEventListener('visibilitychange',visible);window.addEventListener('online',visible)
  return()=>{disposed=true;probe.dispose();clearInterval(timer);clearTimeout(recheck);window.removeEventListener('focus',visible);document.removeEventListener('visibilitychange',visible);window.removeEventListener('online',visible)}
 },[current,base])
 return version
}
export function GameReleaseNotice({version,locale}:{version:string;locale:'zh'|'en'}){
 const dialog=useRef<HTMLDialogElement>(null),[reloading,setReloading]=useState(false),zh=locale==='zh'
 useEffect(()=>{dialog.current?.showModal();return()=>dialog.current?.close()},[])
 return <dialog ref={dialog} className="game-release" aria-labelledby="game-release-title" aria-describedby="game-release-copy" onCancel={e=>e.preventDefault()}>
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 9a8 8 0 1 1-1 7M5 3v6h6"/></svg>
  <h2 id="game-release-title">{zh?'游戏已更新':'Game updated'}</h2>
  <p id="game-release-copy">{zh?'请刷新后继续游玩。已保存的旅程进度会保留，尚未确认的操作会在重连时恢复。':'Refresh to continue playing. Your saved journey is kept, and unconfirmed actions will be recovered when you reconnect.'}</p>
  <button autoFocus disabled={reloading} onClick={()=>{setReloading(true);location.replace(releaseReloadUrl(location.href,version))}}>{reloading?(zh?'正在刷新…':'Refreshing…'):(zh?'刷新并继续':'Refresh and continue')}</button>
 </dialog>
}
