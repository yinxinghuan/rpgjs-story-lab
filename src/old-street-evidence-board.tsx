import {OldStreetMaterialButton} from './old-street-material-reader'
import {archiveEvidence} from './old-street-archive'
import type {ArchiveCardId,ArchiveProgress,ArchiveSource} from './old-street-archive'
import {archiveLoanLead} from './old-street-archive-loan'
import './old-street-evidence-board.css'
type Locale='zh'|'en'
export function EvidenceSteps({labels,done,locale}:{labels:string[];done:number;locale:Locale}){
 return <ol className="os-evidence-steps" aria-label={locale==='zh'?'调查进度':'Investigation progress'}>{labels.map((label,i)=><li key={label} data-done={i<done} aria-current={i===done?'step':undefined}><b>{i<done?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="m5 12 4 4 10-10"/></svg>:i+1}</b><span>{label}</span></li>)}</ol>
}
export function EvidenceTimeline({archive,order,locale,onChange,busy=false}:{archive:ArchiveProgress;order:ArchiveCardId[];locale:Locale;onChange?:(order:ArchiveCardId[])=>void;busy?:boolean}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 return <ol className="os-evidence-timeline" aria-label={t('事件先后顺序','Events in chronological order')}>{[0,1,2,3].map(i=>{
  const id=order[i],card=archive.content.cards.find(c=>c.id===id)
  return <li key={i} data-filled={!!card}><b className="os-evidence-timeline__number">{i+1}</b><div>{card?<><span className="os-evidence-code">{card.id.toUpperCase()}</span><span>{card.label}</span></>:<span className="os-evidence-empty">{t(i===0?'最早发生的事':'接下来发生的事',i===0?'First event':'Next event')}</span>}</div>{card&&onChange&&<div className="os-evidence-timeline__actions">{i>0&&<button disabled={busy} aria-label={t('上移：','Move earlier: ')+card.label} onClick={()=>{const next=[...order];[next[i-1],next[i]]=[next[i],next[i-1]];onChange(next)}}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button>}<button disabled={busy} aria-label={t('撤回：','Remove: ')+card.label} onClick={()=>onChange(order.filter(v=>v!==id))}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="m6 6 12 12M6 18 18 6"/></svg></button></div>}</li>
 })}</ol>
}
export function ArchiveSourceEvidence({archive,source,locale}:{archive:ArchiveProgress;source:ArchiveSource;locale:Locale}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,seen=archive.examined.includes(source)
 const event=(id:ArchiveCardId)=><span className="os-evidence-event"><b className="os-evidence-code">{id.toUpperCase()}</b>{archive.content.cards.find(c=>c.id===id)?.label}</span>
 return <section className="os-evidence-source"><header><h4>{t(source==='index'?'施工索引':'工作日志',source==='index'?'Work index':'Work log')}</h4><span>{seen?t('已查阅','Read'):t('未查阅','Not read')}</span></header>{seen?<div className="os-evidence-relations">{archive.content.sources[source].map(r=><div className="os-evidence-relation" key={r.before+r.after}>{event(r.before)}<span className="os-evidence-arrow">{t('先于','before')} ↓</span>{event(r.after)}</div>)}</div>:<p>{source==='ledger'&&archive.content.ledgerSite?archiveLoanLead(archive.content,locale):t('到档案工作间的这处资料架查阅，线索会保留在这里。','Examine this shelf in the archive workroom. Its evidence will stay here.')}</p>}{seen&&<OldStreetMaterialButton title={t(source==='index'?'施工索引 · 已摘录线索':'工作日志 · 已摘录线索',source==='index'?'Work index · collected evidence':'Work log · collected evidence')} locale={locale} paragraphs={archiveEvidence(archive.content,source,locale)}/>}</section>
}
export function ArchiveEvidenceBoard({archive,order,onChange,locale,busy}:{archive:ArchiveProgress;order:ArchiveCardId[];onChange:(order:ArchiveCardId[])=>void;locale:Locale;busy:boolean}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 return <div className="os-evidence-board">
  <EvidenceSteps labels={[t('查阅资料','Read sources'),t('排列事件','Order events'),t('核对结果','Check result')]} done={archive.examined.length===2?(order.length===4?2:1):0} locale={locale}/>
  <section><h3>{t('已发现的证据','Evidence found')} <span className="os-evidence-count">{archive.examined.length}/2</span></h3><p className="os-evidence-help">{t('箭头只表示先后，不一定紧挨着。字母用于对应同一件事。','Arrows mean earlier, not necessarily immediately before. Letters identify the same event across records.')}</p>{(['index','ledger'] as const).map(source=><ArchiveSourceEvidence key={source} archive={archive} source={source} locale={locale}/>)}</section>
  <section><h3>{t('你的排列','Your reconstruction')} <span className="os-evidence-count">{order.length}/4</span></h3><p className="os-evidence-help">{t('从最早到最晚排列。点下方事件放入空位；可上移或撤回。','Arrange from earliest to latest. Tap an event below to add it; move it earlier or remove it to revise.')}</p><EvidenceTimeline archive={archive} order={order} onChange={onChange} locale={locale} busy={busy}/>
  <div className="os-evidence-pool" aria-label={t('待放入的事件','Events to place')}>{archive.content.cards.map(c=><button key={c.id} disabled={busy||order.includes(c.id)} onClick={()=>onChange([...order,c.id])}><b className="os-evidence-code">{c.id.toUpperCase()}</b><span>{c.label}</span><small>{order.includes(c.id)?t('已放入','Placed'):t('放入','Add')}</small></button>)}</div>
  <p className="os-evidence-help" role="status">{archive.examined.length<2?t('还缺资料：查阅两处记录后才能核对。','Missing evidence: read both sources before checking.'):order.length<4?t(`还需放入 ${4-order.length} 个事件。`,`Place ${4-order.length} more event(s).`):t('四个事件已就位，可以核对；不吻合时可继续调整。','All four events are placed. Check your order; you can revise if it does not match.')}</p></section>
 </div>
}
