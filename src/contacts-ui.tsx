import React from 'react'
import {tr,type Locale,type StorySave} from './story'
import {ATTENDANT,attendantName,knowsAttendant} from './attendant'
import {DISPATCHER,dispatcherName,knowsDispatcher,radioContactAvailable} from './contacts'

export function RadioContact({save,locale,disabled,onAction}:{save:StorySave;locale:Locale;disabled:boolean;onAction:(id:string)=>void}){
 const t=(zh:string,en:string)=>tr(locale,zh,en)
 if(!save.facts.battery_installed||!save.facts.signal_acknowledged)return null
 const known=knowsDispatcher(save)
 return <div className="cl-contact" data-contact={known?DISPATCHER:'unintroduced'}>
  <p className="cl-contact__channel">{known?dispatcherName(locale)+' · ':''}{t('3 频道 · 电台联络','Channel 3 · Radio contact')}</p>
  {!known?<button disabled={disabled} onClick={()=>onAction('meet-dispatch')}>{t('接听调度','Answer dispatch')}</button>:radioContactAvailable(save)&&<>
   <button disabled={disabled} onClick={()=>onAction('ask-dispatch')}>{t('询问接应','Ask about rescue')}</button>
   {save.facts.introduced&&!save.facts.dispatcher_briefed&&<button disabled={disabled} onClick={()=>onAction('brief-dispatch')}>{t('告知车内情况','Report carriage situation')}</button>}
   {save.facts.dispatcher_briefed&&<p className="cl-help">{t('已告知：林在客厢看护电路。','Reported: Lin is watching the carriage circuit.')}</p>}
  </>}
 </div>
}

export function PeopleMet({save,locale}:{save:StorySave;locale:Locale}){
 const t=(zh:string,en:string)=>tr(locale,zh,en)
 const lin=save.facts.introduced&&save.characters.some(c=>c.id==='lin'),dispatch=knowsDispatcher(save),attendant=knowsAttendant(save)
 return <div className="cl-people">
  {!lin&&!dispatch&&!attendant&&<p>{t('你还没有与人交谈。走近车内的人，听听他们怎么说。','You have not spoken to anyone yet. Approach someone in the carriage to talk.')}</p>}
  {lin&&<article data-person="lin"><h3>{t('林','Lin')}</h3><p>{t('客厢 · 修理工','Carriage · Mechanic')}</p><p>{t('他留在客厢看护电路，愿意帮你恢复照明。','He stays in the carriage to watch the circuit and help restore the lights.')}</p></article>}
  {attendant&&<article data-person={ATTENDANT}><h3>{attendantName(locale)}</h3><p>{t('行李车 · 乘务员','Baggage car · Attendant')}</p><p>{t('青衣、米色围巾。她留在行李车看护器材与货箱。','Teal uniform and cream scarf. She watches the equipment and cargo in the baggage car.')}</p></article>}
  {dispatch&&<article data-person={DISPATCHER}><h3>{dispatcherName(locale)}</h3><p>{t('3 频道 · 值班调度','Channel 3 · Duty dispatcher')}</p><p>{t('只闻其声，尚未见面。到驾驶室电台前可以联系她，询问接应进展。','You have heard her voice but have not met in person. Contact her at the cab radio for rescue updates.')}</p>{save.facts.dispatcher_briefed&&<p className="cl-help">{t('她已记下你告知的车内情况。','She has noted your report about the carriage.')}</p>}</article>}
 </div>
}
