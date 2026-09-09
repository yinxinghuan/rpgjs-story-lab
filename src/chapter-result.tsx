import React from 'react'
import {tr,type Locale,type StorySave} from './story'

export function chapterResult(save:StorySave,locale:Locale){
 if(!save.facts.rescue_sent)return null
 const f=save.facts,t=(zh:string,en:string)=>tr(locale,zh,en)
 const route=f.power_chosen&&f.power_radio?'radio':f.power_chosen&&f.beacon_set?'lights':'legacy'
 return {
  route,
  title:route==='radio'?t('把功率留给电台','Power for the radio'):route==='lights'?t('为列车留一盏灯','A light left on for the train'):t('求援已经确认','Your rescue call is confirmed'),
  consequence:route==='radio'?t('你选择了持续电台引导。客厢降为应急照明，接应正沿信号靠近。','You chose continuous radio guidance. The carriage has emergency light; rescuers are following the signal.'):route==='lights'?t('你保住了客厢照明，返回开启了门边引导灯。接应正循光寻找列车。','You kept the carriage lit and returned to set the door guide light. Rescuers are following the light.'):t('此前的求援仍然有效，接应正在靠近。你可以继续走访列车。','Your earlier rescue call remains valid. Help is approaching, and you can keep exploring the train.'),
  milestones:[f.repaired?t('恢复了客厢电路','Restored the carriage circuit'):null,f.record_read?t('确认了夜间救援频道','Identified the night emergency channel'):null,t('建立了救援引导','Established rescue guidance')].filter((v):v is string=>Boolean(v)),
 }
}

export function ChapterResult({save,locale}:{save:StorySave;locale:Locale}){
 const result=chapterResult(save,locale),t=(zh:string,en:string)=>tr(locale,zh,en)
 if(!result)return null
 return <div className="cl-chapter" data-chapter-result={result.route}>
  <p className="cl-chapter__kicker">{t('留一盏灯','A light left on')}</p>
  <h3>{result.title}</h3><p>{result.consequence}</p>
  <details><summary>{t('完成的事','What you accomplished')}</summary><ul>{result.milestones.map(m=><li key={m}>{m}</li>)}</ul></details>
  <p className="cl-chapter__stop">{t('可以在这里停下。进度已保存在本机，下次回来仍能继续这段旅程。','You can stop here. Progress is saved on this computer; return later to continue this journey.')}</p>

 </div>
}
