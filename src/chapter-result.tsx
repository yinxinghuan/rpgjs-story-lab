import React from 'react'
import {tr,type Locale,type StorySave} from './story'

export function chapterResult(save:StorySave,locale:Locale){
 if(!save.facts.rescue_sent)return null
 const f=save.facts,t=(zh:string,en:string)=>tr(locale,zh,en)
 if(f.journey_complete)return {route:'complete',title:t('走到灯下','Under the light'),consequence:t('你走过已确认的轨旁步道，在联络器向许岚报了平安。调度已经接手后续接应联络；列车保留着光，林与周雨仍守着各自的岗位。','You followed the cleared trackside walkway and reported your safe arrival to Xu Lan. Dispatch is coordinating reception now. The train stays lit, with Lin and Zhou Yu at their posts.'),milestones:[f.power_chosen?(f.power_radio?t('先用电台引导，通路确认后恢复客厢照明','Used radio guidance, then restored carriage lighting after clearance'):t('保留客厢照明，用引导灯迎来接应','Kept the carriage lit and guided help with its lamp')):t('保留旧旅程的供电选择','Preserved the earlier journey’s power arrangement'),t('完成三人的协作交接','Coordinated the three contacts'),t('亲自抵达轨旁接应点并报平安','Reached the trackside reception point and reported safe arrival')]}
 if(f.handover_complete)return {route:'handover',title:t('每个人都知道自己的位置','Everyone knows their part'),consequence:t('你核实了照明与通道，和调度核对了接应信号，并把确认带回客厢。车内交接准备已经完成，此前的供电选择已记入旅途记录。','You checked the lighting and aisle, verified the arrival signal with dispatch, and brought the confirmation back to the carriage. Handover preparations are complete; your earlier power choice is recorded in the journal.'),milestones:[f.power_chosen&&f.power_radio?t('曾用电台增幅与客厢应急光','Used radio amplification and carriage emergency lighting'):f.power_chosen&&f.beacon_set?t('曾用客厢照明与引导灯','Used carriage lighting and the guide light'):t('保留旧旅程的供电安排','Kept the earlier journey’s power arrangement'),t('与修理工核实照明','Checked lighting with the mechanic'),t('与乘务员确认通道','Checked the aisle with the attendant'),t('正确核对接应识别信号','Verified the arrival signal')]}
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
  <p className="cl-chapter__stop">{t('可以在这里停下。进度已经保存，下次回来仍能继续这段旅程。','You can stop here. Progress is saved; return later to continue this journey.')}</p>

 </div>
}
