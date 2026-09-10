import type {DomainActionRule,DomainRequirement,Locale,StorySave} from './vendor/story/types'
const tr=(l:Locale,zh:string,en:string)=>l==='zh'?zh:en
export const departureLabels:Record<string,[string,string]>={
 'receive-clearance':['接收通路确认','Receive access clearance'],
 'release-guidance':['撤收临时引导供电','Release temporary guidance power'],
 'enter-walkway':['走向接应步道','Enter the reception walkway'],
 'return-carriage':['返回07号客厢','Return to carriage 07'],
 'report-safe-arrival':['向调度报告安全抵达','Report safe arrival to dispatch'],
 'talk-callpoint':['接听联络器','Listen at the call point'],
}
export function departureRules(locale:Locale,save?:StorySave):DomainActionRule[]{
 const f=save?.facts??{},t=(zh:string,en:string)=>tr(locale,zh,en)
 const need=(id:string,zh:string,en:string):DomainRequirement=>({type:'fact',id,equals:true,reason:t(zh,en)})
 const fresh=(id:string):DomainRequirement=>({type:'fact',id,notEquals:true,reason:t('这一步已经完成，进度已保留。','This step is complete; your progress is saved.')})
 const mark=(id:string)=>({type:'fact' as const,id,value:true})
 const known:DomainRequirement[]=[need('dispatcher_introduced','先与值班调度建立联络。','Establish contact with the dispatcher first.'),{type:'character',id:'xu-lan',status:'known',reason:t('需要已认识的调度联系人。','You need an introduced dispatcher.')}]
 const handed=need('handover_complete','先完成车内交接准备。','Complete the preparations inside the train first.')
 const cleared=need('access_cleared','先到驾驶室接收调度的通路确认。','Receive access clearance from dispatch in the cab first.')
 const released=need('guidance_released','先在客厢配电箱撤收临时引导供电。','Release temporary guidance power at the carriage panel first.')
 const rule=(id:string,map:string,requirements:DomainRequirement[],effects:DomainActionRule['effects'],zh:string,en:string):DomainActionRule=>({id,intent:id,match:[id],matchMode:'exact',requirements:[{type:'map',nodeId:map,reason:t('走到对应地点再操作。','Go to the appropriate place first.')},...requirements],effects,successText:t(zh,en),successChoices:[],dangerPolicy:'suppress',successContinuation:'resume'})
 return [
 rule('receive-clearance','cab',[handed,...known,fresh('access_cleared')],[mark('access_cleared')],
 '电台里传来许岚的声音：“接应线路已经封锁确认，车后固定步道可以通行。只走带护栏的木板道，不要下到铁轨。先回客厢撤收临时引导供电，再从后端门出去。走到步道尽头的固定联络器，向我报平安。”她重复了一遍通路的位置。',
 'Xu Lan comes over the radio. “The reception route is secured. The fixed walkway behind the carriage is clear. Stay between its rails; do not step onto the tracks. Release temporary guidance power at the carriage panel, then use the rear door. Report to me at the fixed call point at the end of the walkway.” She repeats the route.'),
 rule('release-guidance','carriage',[handed,cleared,need('repaired','先修复电路。','Restore the circuit first.'),fresh('guidance_released')],[mark('guidance_released'),...(f.power_chosen&&f.power_radio?[{type:'stat' as const,id:'light',delta:100-(save?.stats.light??35)}]:[])],
 f.power_chosen&&f.power_radio?'你把临时增幅开关拨回常态，电台转回普通联络，客厢顶灯重新亮起。林核对线路后点头：“这次不用摸着应急灯走了。我留在这里看护电路，你沿后端步道去报平安。”':f.beacon_set?'你撤收临时引导档。连接门的灯不再闪烁，改为稳定的暖光，客厢照明没有熄灭。林点头：“你留住的光，现在照着回来的路。我留在这里，你沿后端步道去报平安。”':'你将临时引导切回常态，原有照明保持。林核对线路：“我留在这里看护电路。后端步道已确认，你去联络点报平安。”',
 f.power_chosen&&f.power_radio?'You release the temporary amplifier. The radio returns to ordinary contact and the carriage ceiling lights come back on. Lin checks the circuit. “No more finding your way by emergency lights. I will watch the circuit. Take the rear walkway and report your safe arrival.”':f.beacon_set?'You release guide mode. The door lamp stops pulsing and holds a steady warm light; the carriage stays lit. Lin nods. “The light you kept now marks the way back. I will stay here. Take the rear walkway and report your safe arrival.”':'You return temporary guidance to normal, keeping the existing lighting. Lin checks the circuit. “I will stay here. The rear walkway is clear; report your arrival at the call point.”'),
 rule('enter-walkway','carriage',[handed,cleared,released],[{type:'map',nodeId:'walkway'},mark('walkway_visited')],
 '你推开客厢后端门，走上带护栏的固定步道。雨点落在木板上，两侧铁轨隐在暗处，步道尽头的联络器亮着。林留守电路，周雨继续看护行李车通道。',
 'You open the rear door and step onto the fixed walkway. Rain taps the boards; dark tracks run beyond the rails. A call point glows at the far end. Lin remains with the circuit, and Zhou Yu keeps watch over the baggage aisle.'),
 rule('return-carriage','walkway',[cleared],[{type:'map',nodeId:'carriage'}],
 '你沿原步道返回07号客厢。车内仍亮着，先前的检修、分工和联络记录都保留着。',
 'You follow the walkway back into carriage 07. The lights are still on; your repairs, agreements and contact records remain.'),
 rule('report-safe-arrival','walkway',[handed,cleared,released,...known,need('walkway_visited','先亲自抵达接应步道。','Reach the reception walkway in person first.'),fresh('journey_complete')],[mark('journey_complete')],
 '你拿起固定联络器：“我已抵达步道尽头，07号客厢照明稳定，车内的分工已经交接。”\n许岚的声音这次没有被静电割断：“平安抵达已登记。接下来的接应联络由我们接手。你可以歇一会儿了。”\n你回头望去，列车的灯仍亮在雨里。从一枚保险丝开始，你修好了线路，认出了愿意协作的人，也为自己走出了一条安全的路。',
 'You lift the fixed handset. “I have reached the end of the walkway. Carriage 07 has steady lighting, and the duties inside are handed over.”\nXu Lan answers without the earlier static. “Your safe arrival is recorded. We will handle reception coordination from here. You can rest now.”\nYou look back at the train lights in the rain. Starting with one fuse, you restored a circuit, found people to work with and made a safe way out.'),
 rule('talk-callpoint','walkway',[cleared,...known],[],
 f.journey_complete?'许岚说：“你的平安抵达已经记下。接应联络由我们继续负责。想回顾这段路，可以看看旅途记录；返回客厢仍走原步道。”':'联络器里是熟悉的许岚：“听得清。你到了步道尽头，确认准备好后，向我报上平安抵达。”',
 f.journey_complete?'Xu Lan says, “Your safe arrival is recorded. We are handling reception coordination. You can revisit your journal, or follow the same walkway back to the carriage.”':'Xu Lan’s familiar voice answers. “I can hear you. You have reached the end of the walkway. When ready, report your safe arrival.”'),
 ]
}
export function departureActions(save:StorySave,target:string):string[]{
 const f=save.facts;if(!f.handover_complete)return []
 if(target==='radio'&&!f.access_cleared)return ['receive-clearance']
 if(target==='panel'&&f.access_cleared&&!f.guidance_released)return ['release-guidance']
 if(target==='callpoint'&&f.walkway_visited&&!f.journey_complete)return ['report-safe-arrival']
 return []
}
export function departureObjective(save:StorySave,locale:Locale):[string,string]|null{
 const f=save.facts,t=(zh:string,en:string)=>tr(locale,zh,en);if(!f.handover_complete)return null
 if(f.journey_complete)return [t('已安全抵达 · 旅程完成','Safe arrival · Journey complete'),t('调度已登记你的抵达并接手接应联络。可以回顾旅途，也可以沿原路继续探索。','Dispatch recorded your arrival and took over coordination. Revisit your journey or keep exploring along the same route.')]
 if(!f.access_cleared)return [t('接收离车通路确认','Receive access clearance'),t('车内已交接。到驾驶室电台接收调度确认，之后才能离车。','The duties inside are handed over. Receive route clearance at the cab radio before leaving the train.')]
 if(!f.guidance_released)return [t('撤收临时引导供电','Release temporary guidance power'),t('回客厢配电箱切回常态，保持照明，再走后端门。','Restore normal power at the carriage panel, keep the lights on, then use the rear door.')]
 if(save.map.some(n=>n.id==='walkway'&&n.current))return [t('在联络器报告安全抵达','Report safe arrival at the call point'),t('沿护栏内的木板道走到尽头，使用固定联络器。','Follow the boards between the rails to the fixed call point at the far end.')]
 return [t('从客厢后端走向接应点','Take the rear walkway to reception'),t('回07号客厢，走到与行李车连接门相反的后端门。只走已确认的固定步道。','Return to carriage 07 and use the rear door opposite the baggage connection. Stay on the cleared fixed walkway.')]
}
export function departureAdvice(s:Pick<StorySave,'facts'|'locale'>,target:string,locale=s.locale):string|null{
 const f=s.facts,t=(zh:string,en:string)=>tr(locale,zh,en);if(!f.access_cleared)return null
 if(target==='lin')return t('林留在配电箱旁：“通路已经确认。保持车内照明，后端门通向固定步道；到联络器报平安。我继续看护这里。”','Lin stays by the panel. “The route is clear. Keep the carriage lit and use the rear walkway to the call point. I will watch things here.”')
 if(target==='zhou-yu')return t('周雨仍在货箱旁：“我继续看护车内通道。回07号客厢，从后端门走固定步道，别走铁轨。”','Zhou Yu stays by the cargo. “I will watch the aisle. Return to carriage 07 and use its rear walkway, not the tracks.”')
 if(target==='radio'||target==='callpoint')return f.journey_complete?t('许岚说：“你的平安抵达已经登记，后续接应联络由我们负责。原步道仍可通行。”','Xu Lan says, “Your safe arrival is recorded. We are coordinating reception now; the same walkway remains open.”'):t('许岚说：“固定步道已确认。先在客厢撤收临时引导，再从后端门走到联络器，亲自报平安。”','Xu Lan says, “The fixed walkway is clear. Release temporary guidance in the carriage, then use the rear door to reach the call point and report your arrival.”')
 return null
}
