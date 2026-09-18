import {useState} from 'react'
import type {StorySave} from './vendor/original-train/types'
import type {OldStreetCampaign} from './old-street-campaign'
import {photoDisplayed} from './old-street-photo-display'

export function OldStreetRecordDesk({campaign,save,photoImage,published,locale,busy,act}:{campaign:OldStreetCampaign;save?:StorySave;photoImage?:string;published:boolean;locale:'zh'|'en';busy:boolean;act:(selection:number|string)=>Promise<void>}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en,ready=!!campaign.archive?.order,trace=campaign.trace!
 const [section,setSection]=useState<'find'|'leave'>(ready?'leave':'find')
 const displayed=!!save&&photoDisplayed(save),carried=!!save?.inventory.some(i=>i.id==='darkroom-print'&&i.count>0),left=save?.facts['darkroom-photo-choice']==='leave'
 const canPlace=carried&&save?.facts['darkroom-photo-choice']==='keep'&&typeof save.facts['darkroom-photo-matched']==='string'
 return <div className="os-record-desk">
  <p className="os-record-desk__intro">{t('查找家人寄存的材料，也可以把查清的旧事留在这里。','Find your family’s filed papers, or leave an account of the history you uncover.')}</p>
  <nav className="os-record-desk__nav" aria-label={t('记录册用途','Record book purpose')}>
   <button aria-pressed={section==='find'} onClick={()=>setSection('find')}>{t('查找材料','Find papers')}</button>
   <button aria-pressed={section==='leave'} onClick={()=>setSection('leave')}>{t('留下记录','Leave a record')}</button>
  </nav>
  {section==='find'?<section>
   {trace.selected!==undefined?<>
    <p className="os-record-desk__status">{t('已找到对应记录','Matching record found')}</p>
    <h3>{trace.content.records[trace.selected].label}</h3>
    <p>{ready?t('这份材料里的旧事已经查清，可以切到“留下记录”保存调查经过。','You have reconstructed this history. Choose “Leave a record” to keep an account here.'):t('下一步：到地下储物室的资料架，取阅这条记录对应的纸袋。','Next: visit the paper shelf in the cellar and examine the matching packet.')}</p>
    <details><summary>{t('回看比对依据','Review the matching details')}</summary><RecordMatches trace={trace} locale={locale} busy={busy} act={act}/></details>
   </>:<>
    <h3>{t('按寄存条找材料','Match the filing slip')}</h3>
    <p>{t('对照标记和包扎方式，选出两项都相同的记录。','Compare the mark and wrapping. Choose the record that matches both.')}</p>
    <RecordMatches trace={trace} locale={locale} busy={busy} act={act}/>
   </>}
  </section>:!ready?<section>
   <h3>{t('先查清事情的经过','First reconstruct what happened')}</h3>
   <p>{trace.selected===undefined?t('先在“查找材料”里找到对应的寄存记录。','First find the matching filing record under “Find papers”.'):t('到地下储物室查看寄存材料，再去旁边的档案间查阅、整理原始记录。完成后可回来写下经过。','Read the filed papers in the cellar, then examine and sort the source records in the adjoining archive. Return here once the history is clear.')}</p>
   <p className="os-record-desk__muted">{t('留下记录是可选的；查清的线索仍会保存在背包中。','Leaving a record is optional. Your discovered clues stay in Backpack.')}</p>
  </section>:<>
   <section className="os-record-desk__entry">
    <div className="os-record-desk__entry-heading"><h3>{t('调查经过','Your findings')}</h3><span className="os-record-desk__status">{t(published?'已写入':'尚未写入',published?'Recorded':'Not recorded')}</span></div>
    <details><summary>{t(published?'查看已留下的经过':'查看将留下的经过','Read the account')}</summary><p>{campaign.archive!.content.discovery}</p></details>
    <p>{published?t('经过已留在这里，线索仍保存在背包中。','The account is recorded here. Your clues remain in Backpack.'):t('把查清的经过抄一份留在册里。不会公开密封信，也不改变材料原件的去向。','Leave a written account here. Your letter and original papers stay where they are.')}</p>
    {published&&displayed&&<p className="os-record-desk__muted">{t('撤下经过时，旁边的照片也会收回背包。','Removing the account also returns the photograph to your bag.')}</p>}
    <button className={!published?'os-record-desk__primary':undefined} disabled={busy} onClick={()=>void act(published?'withdraw':'share')}>{t(published?'撤下调查经过':'写入调查经过',published?'Remove the account':'Record my findings')}</button>
   </section>
   <section className="os-record-desk__entry">
    <div className="os-record-desk__entry-heading"><h3>{t('相关照片','Related photograph')}</h3><span className="os-record-desk__status">{t(displayed?'已放在册旁':carried?'在背包中':left?'留在暗房':'尚未带来',displayed?'Beside the book':carried?'In your bag':left?'In the darkroom':'Not brought here')}</span></div>
    {(displayed||carried)&&photoImage&&<img className="os-record-photo-preview" src={photoImage} alt={t('本次旅程的旧街照片','This journey’s street photograph')} draggable={false}/>}
    <p>{displayed?t('照片已留在册旁，背包中不再携带。随时可以取回。','The photograph is beside the book, no longer in your bag. You can take it back.'):carried?t('把背包里的照片放在记录旁，和经过一起保存。之后可以取回。','Place the photograph beside your account. You can take it back later.'):left?t('你把照片留在了暗房；这里还没有照片。','You left the photograph in the darkroom. There is no photograph here yet.'):t('在照相馆完成相关旧照，并选择带走后，可以放在这里。','Complete the related photograph at the studio and choose to take it with you. Then you can place it here.')}</p>
    {(displayed||canPlace)&&<>
     {!published&&<p id="os-photo-placement-requirement" className="os-record-desk__muted">{t('先完成上面的“写入调查经过”，再放照片。','Choose “Record my findings” above before placing the photograph.')}</p>}
     <button className={published&&!displayed?'os-record-desk__primary':undefined} aria-describedby={!published?'os-photo-placement-requirement':undefined} disabled={busy||!published} onClick={()=>void act(displayed?'retrieve-photo':'display-photo')}>{t(displayed?'取回照片':'放置照片',displayed?'Take back photograph':'Place photograph')}</button>
    </>}
   </section>
   <p className="os-record-desk__muted">{t('留下经过和照片都由你决定，不影响带信回家。','Leaving your account or photograph is optional. You can still take the letter home.')}</p>
  </>}
 </div>
}

function RecordMatches({trace,locale,busy,act}:{trace:NonNullable<OldStreetCampaign['trace']>;locale:'zh'|'en';busy:boolean;act:(selection:number|string)=>Promise<void>}){
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 return <>
  <dl className="os-record-desk__slip"><div><dt>{t('寄存条 · 标记','Slip · mark')}</dt><dd>{trace.content.clue.mark}</dd></div><div><dt>{t('寄存条 · 包扎','Slip · wrapping')}</dt><dd>{trace.content.clue.wrapping}</dd></div></dl>
  <div className="os-campaign__records">{trace.content.records.map((r,index)=><button key={index} disabled={busy||trace.selected!==undefined} onClick={()=>void act(index)} aria-pressed={trace.selected===index}><strong>{r.label}</strong><span>{t('标记：','Mark: ')}{r.mark}</span><span>{t('包扎：','Wrapping: ')}{r.wrapping}</span></button>)}</div>
 </>
}
