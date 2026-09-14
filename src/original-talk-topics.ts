import type {OriginalDialogueContext} from '../server/original-dialogue'
/** Authored conversation choices. Questions only: authority owns all consequences. */
export function originalTalkTopics(c:Pick<OriginalDialogueContext,'locale'|'speaker'|'sceneId'|'objective'|'availableActions'|'recentTurns'>){
 const zh=c.locale==='zh',t=(a:string,b:string)=>zh?a:b
 if(c.speaker.id==='ada-mechanic'&&c.sceneId==='train-at-dead-station'&&c.availableActions.some(a=>a.id==='repair-starter'))return [
  {text:t('启动机哪里坏了？','What is wrong with the starter?'),reply:t('继电器烧坏了。先把启动电路重新接通，列车才能动起来。','The relay is burnt out. We need to reconnect the starter circuit before the train can move.')},
  {text:t('修好以后往哪走？','Where do we go after the repair?'),reply:t('先让列车能启动，再核对出站道岔。走哪条线路，得由你来决定。','First get the train running, then check the departure points. You will have to choose our route.')},
  {text:t('你有把握吗？','Are you confident about this?'),reply:t('这列车的异响我听得出来。我们先检查启动机，一步一步来。','I know the sounds this train should not make. Let us check the starter and take this one step at a time.')},
 ]
 const has=(action:string)=>c.availableActions.some(a=>a.id===action)
 const contextual:Array<{text:string;reply:string}>=[]
 const offer=(speakers:string[],action:string,question:[string,string],answer:[string,string])=>{
  if(speakers.includes(c.speaker.id)&&has(action))contextual.push({text:t(...question),reply:t(...answer)})
 }
 offer(['ada-mechanic','mara-raider'],'yard-work-pact',['修泵换油，要付出什么？','What will repairing the pump cost us?'],['要拆用列车的固定件，连接架会多些磨损。车况要付出六份，换来十二份燃料；这笔交换得你点头。','We would use fittings from the train and wear its coupling frame. It costs six Condition for twelve Fuel. You have to agree to that exchange.'])
 offer(['ren-medic','mara-raider'],'yard-medical-pact',['诊疗合作能帮上什么？','What could medical cooperation achieve?'],['货场有人受伤。把诊疗安排谈妥，再按约交接燃料；不必靠强开油泵解决。','There are injured people in the yard. We can agree on medical care and exchange fuel as arranged, without forcing the pump open.'])
 offer(['mara-raider'],'yard-invite',['你愿意和我们同行吗？','Would you travel with us?'],['我愿意去山口交接防卫岗位。你若邀请我，我会把泵房交给副手，再带上岗位图上车。','I am willing to hand over the defense post at the pass. If you invite me, I will leave the pump room with my deputy and bring the duty plan aboard.'])
 offer(['ren-medic'],'river-treat',['病人现在最需要什么？','What do the patients need right now?'],['先用现有的氧气救治接过来的病人。氧气用出去就收不回来了，但眼下不能只顾列车。','Use the oxygen we have to treat the patients we brought across. We cannot get that oxygen back, but the train is not our only concern.'])
 offer(['lin-scout'],'pine-survey-route',['木场的路能直接走吗？','Can we take the timber route straight away?'],['先一起核对线路簿。实际路况要和记录对上，不能只凭一条熟悉的路名出发。','Let us check the route book together first. The records must match the actual track conditions; a familiar name is not enough.'])
 offer(['lin-scout'],'pine-invite',['你愿意负责沿途巡检吗？','Would you inspect the route with us?'],['我可以随车巡检，也可以留下守信号点。先把这个安排定下来，再离开林线。','I can inspect the route aboard the train or remain at the signal post. Decide that arrangement before we leave the forest line.'])
 offer(['ada-mechanic'],'tunnel-ventilate',['排烟会用掉多少油？','How much fuel will ventilation use?'],['通风机要用掉八份燃料，后车厢的物资就能保留下来。先看清油量，再决定要不要供油。','The fan needs eight Fuel, allowing us to keep the supplies in the rear carriage. Check the fuel before deciding.'])
 offer(['ada-mechanic'],'tunnel-discard',['清空后车厢会失去什么？','What would we lose by clearing the rear carriage?'],['备用油罐和软管都得放弃，大家也会难受。省下这次排烟用油，不等于后面的路没有代价。','We would abandon the spare diesel cans and hoses, and people would be upset. Saving ventilation fuel does not make the road ahead cost-free.'])
 offer(['ada-mechanic'],'pass-air-brake',['那根备用软管能派上用场吗？','Can the spare hose help us here?'],['可以接回气路来制动。软管会安装到车上，之后就不能再当备用件取用了。','We can connect it to restore air braking. Once installed, the hose will no longer be a spare in our inventory.'])
 offer(['mara-raider'],'pass-mako-duty',['车厢里该怎么安排？','How should we organize the carriage?'],['先固定会移动的物资，让每个人抓稳支点。我可以按岗位图组织，但需要你把这项安排交给我。','Secure loose supplies and give everyone a stable handhold. I can organize it from the duty plan if you assign that task to me.'])
 offer(['ada-mechanic'],'bridge-anchor-crossing',['把列车固定在桥边，意味着什么？','What would anchoring the train at the bridge mean?'],['人能借它步行过去，但列车会永久失去行驶能力。这不是过桥后还能开走的临时停车。','People could use it to cross on foot, but the train would permanently lose its ability to travel. This is not a temporary stop we can drive away from.'])
 const replies:Record<string,[string,string]>={
  'ada-mechanic':['先把眼前的故障和线路看清楚。别急，我们一项一项处理。','Let us understand the fault and the route before us. We can take them one at a time.'],
  'ren-medic':['先顾好眼前的人。要走多远，也得看大家还能承受多少。','Look after the people here first. How far we can go also depends on what everyone can endure.'],
  'lin-scout':['看清实际路况，再做决定。我宁愿多核对一次。','Check the actual track conditions before deciding. I would rather check once more.'],
  'mara-raider':['先把要承担的事说清楚。同行的人都应该知道。','Be clear about what has to be taken on. The people traveling together should know.'],
 }
 const reassurance=replies[c.speaker.id]
 const remembered=[...c.recentTurns].reverse().find(turn=>!/(?:记得|回忆|remember|recall)/i.test(turn.input))
 return [
  ...contextual,
  {text:t('我们眼下该怎么做？','What should we do next?'),reply:c.objective},
  ...(reassurance?[{text:t('我有点担心接下来的路。','I am worried about the road ahead.'),reply:t(...reassurance)}]:[]),
  ...(remembered?[{text:t('还记得我们刚才聊的事吗？','Do you remember what we talked about?'),reply:t('你刚才说：“','You said: “')+remembered!.input+'”'}]:[]),
 ].slice(0,4)
}
