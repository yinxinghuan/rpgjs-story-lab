import {journalMediaSubjects} from './old-street-journal-media'
import {useJournalMedia} from './use-journal-media'
import {OldStreetJournalArt,JournalSymbol} from './old-street-journal-art'
import './old-street-content.css'
import {OldStreetPreparationsView} from './old-street-preparations-view'
import type {Preparation} from './old-street-preparations'
import {useEffect,useRef,useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetJournal} from './old-street-journal'
import type {OldStreetCampaign} from './old-street-campaign'
export function OldStreetJournalView({save,campaign,onClose,photoImage,api,sessionId,preparations=[]}:{api?:(path:string,body?:unknown)=>Promise<any>;sessionId?:string;photoImage?:string;preparations?:Preparation[];save:StorySave;campaign?:OldStreetCampaign;onClose:()=>void}){
 const t=(zh:string,en:string)=>save.locale==='zh'?zh:en,[tab,setTab]=useState<'now'|'items'|'notes'|'people'>('now'),dialog=useRef<HTMLDialogElement>(null),body=useRef<HTMLDivElement>(null)
 useEffect(()=>{const node=dialog.current;node?.showModal();return()=>node?.close()},[])
 useEffect(()=>{if(body.current)body.current.scrollTop=0},[tab])
 const media=useJournalMedia(journalMediaSubjects(save).length?api:undefined,sessionId)
 const close=()=>{dialog.current?.close();onClose()},journal=oldStreetJournal(save,campaign),entries=tab==='items'?journal.items:tab==='notes'?journal.notes:journal.people
 return <dialog className="os-map os-journal" ref={dialog} aria-labelledby="os-journal-title" onCancel={e=>{e.preventDefault();close()}}>
  <header><h2 id="os-journal-title">{t('背包','Backpack')}</h2><button onClick={close} autoFocus>{t('收起','Close')}</button></header>
  <nav aria-label={t('查看内容','View')}><button aria-pressed={tab==='now'} onClick={()=>setTab('now')}>{t('目标','Goal')}</button><button aria-pressed={tab==='items'} onClick={()=>setTab('items')}>{t('物品','Items')}</button><button aria-pressed={tab==='notes'} onClick={()=>setTab('notes')}>{t('线索','Clues')}</button><button aria-pressed={tab==='people'} onClick={()=>setTab('people')}>{t('人物','People')}</button></nav>
  <div className="os-journal__entries" ref={body}>
   {media.rows.some(r=>r.recoverable)&&<p className="os-journal__media-status" role="status">{t('正在补齐图片，可以继续探索。','Pictures are being prepared. You can keep exploring.')}</p>}
   {media.rows.filter(r=>r.state==='failed'&&!r.recoverable).map(r=><button className="os-journal__media-retry" key={r.id} onClick={()=>media.retry(r.id)}>{t('重试图片','Retry picture')} · {r.id.startsWith('item:')?journal.items.find(i=>'item:'+i.id===r.id)?.title:journal.people.find(p=>'person:'+p.id===r.id)?.title}</button>)}
   {media.error&&<button className="os-journal__media-retry" onClick={()=>media.retry()}>{t('重新加载图片','Reload pictures')}</button>}
{tab==='now'?<>
   <section className="os-journal__objective"><span className="os-journal__thumb"><JournalSymbol kind="goal"/></span><div><h3>{t('当前目标','Current objective')}</h3><p>{journal.purpose}</p></div></section>
   <div className="os-journal__overview">{(['items','notes','people'] as const).map((key,i)=><button key={key} onClick={()=>setTab(key)}><JournalSymbol kind={key==='items'?'bag':key==='people'?'person':'paper'}/><strong>{journal[key].length}</strong><span>{[t('物品','Items'),t('线索','Clues'),t('人物','People')][i]}</span></button>)}</div>
   <OldStreetPreparationsView rows={preparations} locale={save.locale}/>
  </>:entries.length?<><p className="os-journal__section-hint">{tab==='items'?t('随身携带的物品与用途','What you carry and how it helps'):tab==='people'?t('认识的人 · 点开查看往来','People you know · Open to view your history'):t('发现的线索 · 点开查看详情','Clues you found · Open for details')}</p><ul className={'os-journal__collection os-journal__collection--'+tab}>{entries.map(e=><li key={e.id}>{tab==='items'?<div className="os-journal__item"><OldStreetJournalArt id={e.id} category="items" save={save} photoImage={photoImage} generatedImage={media.images['item:'+e.id]}/><div><strong>{e.title}</strong>{'count' in e&&typeof e.count==='number'&&e.count>1&&<span className="os-journal__count">× {e.count}</span>}<p>{e.text}</p></div></div>:<details><summary><OldStreetJournalArt id={e.id} category={tab} save={save} photoImage={photoImage} generatedImage={tab==='people'?media.images['person:'+e.id]:undefined}/><span className="os-journal__entry-heading"><strong>{e.title}</strong>{tab==='people'&&<small>{save.characters.find(c=>c.id===e.id)?.role}</small>}</span><svg className="os-journal__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m9 5 7 7-7 7"/></svg></summary><p>{e.text}</p></details>}</li>)}</ul></>:<div className="os-journal__empty"><JournalSymbol kind={tab==='items'?'bag':tab==='people'?'person':'paper'}/><p>{tab==='items'?t('还没有随身物品。','You are not carrying anything yet.'):tab==='people'?t('遇见并交谈后，人物会记在这里。','People appear here after you meet and talk.'):t('亲自发现的线索会记在这里。','Clues you discover will be kept here.')}</p></div>}</div>
 </dialog>
}
