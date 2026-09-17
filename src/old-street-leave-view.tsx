import {useEffect,useRef} from 'react'

export function OldStreetLeaveView({locale,borrowed,confirm,close}:{locale:'zh'|'en';borrowed:string[];confirm:()=>void;close:()=>void}){
 const root=useRef<HTMLDialogElement>(null),stay=useRef<HTMLButtonElement>(null)
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 useEffect(()=>{const node=root.current;node?.showModal();stay.current?.focus();return()=>node?.close()},[])
 return <dialog ref={root} className="os-map os-leave" aria-labelledby="os-leave-title" aria-describedby="os-leave-description" onCancel={e=>{e.preventDefault();close()}}>
  <header><h2 id="os-leave-title">{t('结束这次探索？','Finish exploring?')}</h2></header>
  <p id="os-leave-description">{t('带着信回家？离开后这次探索结束。','Take the letter home? This ends the exploration.')}</p>
  {borrowed.length>0&&<p>{t('还带着待归还的物品：','You still have items to return: ')}{borrowed.join(' · ')}{t('。可以再逛逛，先把它们送回去。','. You can stay and return them first.')}</p>}
  <div className="os-leave__actions"><button ref={stay} onClick={close}>{t('再逛逛','Stay')}</button><button onClick={confirm}>{t('回家','Go home')}</button></div>
 </dialog>
}
