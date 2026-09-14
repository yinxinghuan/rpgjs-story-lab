import {useEffect,useRef,useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetJournal} from './old-street-journal'
export function OldStreetJournalView({save,onClose}:{save:StorySave;onClose:()=>void}){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,[tab,setTab]=useState<'items'|'notes'>('items'),dialog=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 const close=()=>{dialog.current?.close();onClose()},journal=oldStreetJournal(save),entries=tab==='items'?journal.items:journal.notes
 return <dialog className="os-map os-journal" ref={dialog} aria-labelledby="os-journal-title" onCancel={e=>{e.preventDefault();close()}}>
  <header><h2 id="os-journal-title">{t('随身与发现','Items & discoveries')}</h2><button onClick={close} autoFocus>{t('收起','Close')}</button></header>
  <p>{journal.purpose}</p>
  <nav aria-label={t('查看内容','View')}><button aria-pressed={tab==='items'} onClick={()=>setTab('items')}>{t('随身','Items')}</button><button aria-pressed={tab==='notes'} onClick={()=>setTab('notes')}>{t('发现','Discoveries')}</button></nav>
  {entries.length?<ul>{entries.map(e=><li key={e.id}><strong>{e.title}{'count' in e&&typeof e.count==='number'&&e.count>1?` × ${e.count}`:''}</strong><p>{e.text}</p></li>)}</ul>:<p>{tab==='items'?t('还没有随身物品。','You are not carrying anything yet.'):t('亲自发现的线索会记在这里。','Clues you discover will be kept here.')}</p>}
 </dialog>
}
