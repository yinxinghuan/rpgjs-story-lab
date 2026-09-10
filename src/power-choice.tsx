import React from 'react'
import {departureAdvice} from './departure'
import {tr,type Locale,type StorySave} from './story'

export function radioDescription(s:StorySave,locale:Locale){const advice=departureAdvice(s,'radio',locale);if(advice)return advice;const f=s.facts;return tr(locale,
 f.rescue_sent?(f.power_radio?'两盏连接灯亮着。电台正在持续引导接应，客厢保留应急光。':f.beacon_set?'引导灯已开启，接应正在循光靠近。电台保持待机。':'两盏连接灯亮着。旧旅程的求援已经完成。'):
 f.signal_acknowledged?'短报文已收到。返回客厢的配电箱设置引导灯，接应才能循光找到列车。':
 !f.battery_installed?'电池槽空着。装入电池后，可以决定如何分配共用线路的功率。':
 !f.power_chosen?'共用线路只能全力带一路。保住客厢灯光，就用短报文加引导灯；集中给电台，则客厢只留应急光。':
 f.power_radio?'电台已经增幅，客厢降为应急照明。3 频道收到呼叫后，可以持续引导接应。':'客厢保持明亮，电台只发短报文。3 频道收到回执后，返回配电箱设置引导灯。',
 f.rescue_sent?(f.power_radio?'Two connection lamps glow. The radio guides help continuously; the carriage has emergency light.':f.beacon_set?'The guide light is set. Help is following it; the radio remains on standby.':'The connection lamps glow. Your earlier rescue is complete.'):
 f.signal_acknowledged?'Your short message was received. Return to the carriage panel and set the guide light so rescuers can locate the train.':
 !f.battery_installed?'The battery bay is empty. Install a battery to choose how the shared circuit supplies power.':
 !f.power_chosen?'The shared circuit can fully power one route. Keep the lights and use a short message plus a guide light, or amplify the radio and leave emergency light in the carriage.':
 f.power_radio?'The radio is amplified; the carriage has emergency light. An acknowledged call on channel 3 will establish continuous guidance.':'The carriage stays bright; the radio sends short messages only. After channel 3 acknowledges, return to the panel to set a guide light.')}

export function radioStatus(s:StorySave,locale:Locale){const f=s.facts;if(f.guidance_released)return tr(locale,'普通联络 · 客厢常亮','Ordinary contact · Steady carriage lights');return tr(locale,f.rescue_sent?'接应已定位':f.signal_acknowledged?'短报文已收 · 待引导':f.power_chosen?(f.power_radio?'电台增幅 · 客厢应急光':'客厢常亮 · 电台短报文'):f.battery_installed?'已通电 · 待选择供电':'电池槽为空',f.rescue_sent?'Rescue guidance established':f.signal_acknowledged?'Acknowledged · Guide light needed':f.power_chosen?(f.power_radio?'Radio amplified · Emergency light':'Carriage lit · Short-message radio'):f.battery_installed?'Powered · Choose a route':'Battery bay empty')}

export function PowerChoice({save,locale,disabled,onChoose}:{save:StorySave;locale:Locale;disabled:boolean;onChoose:(action:string)=>void}){
 const f=save.facts,t=(zh:string,en:string)=>tr(locale,zh,en)
 if(!f.battery_installed||f.signal_acknowledged||f.rescue_sent)return null
 return <fieldset className="cl-power-choice" disabled={disabled}>
  <legend>{t('供电优先级','Power priority')}</legend>
  <p>{t('共用线路只能全力带一路。发送前可改选，3 频道确认后锁定。','The shared circuit can fully power one route. Change before sending; channel 3 acknowledgment locks it.')}</p>
  {[{id:'route-lights',radio:false,title:t('保持客厢照明','Keep carriage lights'),cost:t('保住暖光；回执后需返回设置引导灯。','Keep the warm lights; return to set the guide light after acknowledgment.')},{id:'route-radio',radio:true,title:t('集中供电给电台','Prioritize radio'),cost:t('持续引导接应；客厢降为应急照明。','Guide help continuously; the carriage drops to emergency light.')}].map(o=>{
   const selected=Boolean(f.power_chosen)&&Boolean(f.power_radio)===o.radio
   return <button type="button" key={o.id} data-power-choice={o.id} aria-pressed={selected} disabled={disabled||selected} onClick={()=>onChoose(o.id)}><span><b>{o.title}</b><small>{o.cost}</small></span>{selected&&<span className="cl-power-selected">{t('已选','Selected')}</span>}</button>
  })}
 </fieldset>
}
