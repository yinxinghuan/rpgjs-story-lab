import {receptionObjective} from './reception'
import {tr,type Locale,type StorySave} from './story'
// Presentation of the next actionable step, derived only from authoritative facts.
export function objectiveCopy(save:StorySave|undefined,locale:Locale):[string,string]{
 const t=(zh:string,en:string)=>tr(locale,zh,en),f=save?.facts??{}
 const reception=save&&receptionObjective(save,locale);if(reception)return reception
 if(!f.repaired){
  if(!f.cabinet_open)return [t('查看检修柜','Examine the cabinet'),t('沿过道走到左侧检修柜旁，查看里面是否有备用部件。','Follow the aisle to the cabinet on the left and look for a spare part.')]
  if(!f.fuse_taken)return [t('取出备用保险丝','Collect the spare fuse'),t('检修柜已经打开。在近景中拿起保险丝，再检查配电箱。','The cabinet is open. Collect the fuse in the close-up, then inspect the circuit panel.')]
  if(!f.introduced)return [t('询问修理工','Speak to the mechanic'),t('和配电箱旁穿灰色工作服的人交谈，确认需要更换的部件。','Speak to the person in grey by the circuit panel to identify the part that needs replacing.')]
  return [t('修复配电箱','Restore the circuit'),t('走到配电箱旁，装入随身物品中的备用保险丝。','Approach the circuit panel and install the spare fuse from your belongings.')]
 }
 if(!f.finished)return [t('穿过前方连接门','Go through the connecting door'),t('照明已经恢复，车厢前端的连接门也已解锁。走近门口继续探索。','The lights are restored and the front connecting door is unlocked. Approach it to continue.')]
 if(f.rescue_sent&&f.power_radio)return [t('联络保持 · 接应靠近','Radio guidance established'),t('电台正在持续引导。客厢保留应急光，可以返回与林会合。','The radio guides rescuers continuously. The carriage has emergency light; you can return to Lin.')]
 if(f.rescue_sent&&f.beacon_set)return [t('引导灯已亮 · 接应靠近','Guide light established'),t('连接门的灯正在引导接应，客厢照明仍然保留。你可以查看记录或与林交谈。','The door light guides help to the train; the carriage stays bright. You can read the journal or talk with Lin.')]
 if(f.signal_acknowledged&&!f.rescue_sent)return [t('返回客厢设置引导灯','Set the carriage guide light'),t('短报文已收到，接应还需要灯光定位。穿过行李车返回客厢，在配电箱设置引导灯。','Your message was received. Help needs a light to locate the train. Return through the baggage car and set guide mode at the carriage panel.')]
 if(f.rescue_sent)return [t('求援已收到 · 等待接应','Help is coming'),t('接应正在靠近。保持照明，你也可以继续走访列车、查看记录或与林交谈。','Help is approaching. Keep the lights on; you can explore the train, read your journal or talk to Lin.')]
 if(!f.battery_taken)return [t('寻找电台电池','Find a radio battery'),t('检查行李车的器材柜。里面的备用电池可以给电台供电。','Check the supply cabinet in the baggage car for a spare radio battery.')]
 if(!f.record_read)return [t('确认救援频道','Find the emergency channel'),t('阅读行李车墙上的调度记录，确认夜间有人值守的频道。','Read the dispatch record on the baggage car wall to find the attended night channel.')]
 if(!f.battery_installed)return [t('接通电台电源','Power the radio'),t('前往驾驶室，在电台近景中装入电池。夜间救援使用 3 频道。','Enter the driving cab and install the battery in the radio close-up. Night emergency uses channel 3.')]
 if(!f.power_chosen)return [t('选择供电路线','Choose a power route'),t('在电台选择：保住客厢照明、回执后返回设置引导灯；或集中给电台、客厢降为应急光。发送前可改选。','At the radio, keep the carriage lit and return to set a guide light after acknowledgment, or prioritize the radio and dim the carriage. You may change before sending.')]
 return [t('用 3 频道呼叫救援','Call for help on channel 3'),t('电台已通电。在近景中选择 3 频道，发出求援呼叫。','The radio is powered. Select channel 3 in the close-up to call for help.')]
}
export function actionFeedback(action:string,locale:Locale){const messages:Record<string,[string,string]>={
 'open-cabinet':['检修柜已打开','Cabinet opened'],'take-fuse':['保险丝 +1 · 已收好','Fuse +1 · Collected'],repair:['照明恢复 · 连接门解锁','Lights restored · Door unlocked'],
 leave:['抵达行李车','Entered the baggage car'],'go-baggage':['抵达行李车','Entered the baggage car'],'back-carriage':['回到客厢','Returned to the carriage'],'enter-cab':['抵达驾驶室','Entered the driving cab'],'back-baggage':['回到行李车','Returned to the baggage car'],
 'open-supply':['器材柜已打开','Supply cabinet opened'],'take-battery':['电台电池 +1 · 已收好','Radio battery +1 · Collected'],'read-record':['救援频道已记下','Emergency channel noted'],'install-battery':['电台电源已接通','Radio power connected'],'send-signal':['呼叫已有回执','Call acknowledged'],'route-lights':['客厢常亮 · 电台短报文','Carriage lit · Short-message radio'],'route-radio':['电台增幅 · 客厢应急光','Radio amplified · Emergency light'],'set-beacon':['引导灯已开启 · 接应靠近','Guide light set · Help approaches']}
 const value=messages[action];return value?value[locale==='zh'?0:1]:null
}
