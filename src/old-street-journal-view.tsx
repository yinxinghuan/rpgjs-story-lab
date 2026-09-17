import {OldStreetPreparationsView} from './old-street-preparations-view'
import type {Preparation} from './old-street-preparations'
import {useEffect,useRef,useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetJournal} from './old-street-journal'
import type {OldStreetCampaign} from './old-street-campaign'
export function OldStreetJournalView({save,campaign,onClose,preparations=[]}:{preparations?:Preparation[];save:StorySave;campaign?:OldStreetCampaign;onClose:()=>void}){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,[tab,setTab]=useState<'items'|'notes'|'people'>('items'),dialog=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 const close=()=>{dialog.current?.close();onClose()},journal=oldStreetJournal(save,campaign),entries=tab==='items'?journal.items:tab==='notes'?journal.notes:journal.people
 return <dialog className="os-map os-journal" ref={dialog} aria-labelledby="os-journal-title" onCancel={e=>{e.preventDefault();close()}}>
  <header><h2 id="os-journal-title">{t('随身与发现','Items & discoveries')}</h2><button onClick={close} autoFocus>{t('收起','Close')}</button></header>
  <p>{journal.purpose}</p><OldStreetPreparationsView rows={preparations} locale={save.locale}/>
  <nav aria-label={t('查看内容','View')}><button aria-pressed={tab==='items'} onClick={()=>setTab('items')}>{t('随身','Items')}</button><button aria-pressed={tab==='notes'} onClick={()=>setTab('notes')}>{t('发现','Notes')}</button><button aria-pressed={tab==='people'} onClick={()=>setTab('people')}>{t('人物','People')}</button></nav>
  <div className="os-journal__entries">{entries.length?<ul>{entries.map(e=><li key={e.id}><strong>{e.title}{'count' in e&&typeof e.count==='number'&&e.count>1?` × ${e.count}`:''}</strong><p>{e.text}</p></li>)}</ul>:<p>{tab==='items'?t('还没有随身物品。','You are not carrying anything yet.'):tab==='people'?t('在街区遇见的人会记在这里。','People you meet in the neighbourhood will appear here.'):t('亲自发现的线索会记在这里。','Clues you discover will be kept here.')}</p>}</div>
 </dialog>
}
