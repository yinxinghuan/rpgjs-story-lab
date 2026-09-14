import type {OriginalDialogueContext} from '../server/original-dialogue'
/** Authored conversation choices. Questions only: authority owns all consequences. */
export function originalTalkTopics(c:Pick<OriginalDialogueContext,'locale'|'speaker'|'sceneId'|'objective'|'availableActions'|'recentTurns'>){
 const zh=c.locale==='zh',t=(a:string,b:string)=>zh?a:b
 if(c.speaker.id==='ada-mechanic'&&c.sceneId==='train-at-dead-station'&&c.availableActions.some(a=>a.id==='repair-starter'))return [
  {text:t('启动机哪里坏了？','What is wrong with the starter?'),reply:t('继电器烧坏了。先把启动电路重新接通，列车才能动起来。','The relay is burnt out. We need to reconnect the starter circuit before the train can move.')},
  {text:t('修好以后往哪走？','Where do we go after the repair?'),reply:t('先让列车能启动，再核对出站道岔。走哪条线路，得由你来决定。','First get the train running, then check the departure points. You will have to choose our route.')},
  {text:t('你有把握吗？','Are you confident about this?'),reply:t('这列车的异响我听得出来。我们先检查启动机，一步一步来。','I know the sounds this train should not make. Let us check the starter and take this one step at a time.')},
 ]
 const replies:Record<string,[string,string]>={
  'ada-mechanic':['先把眼前的故障和线路看清楚。别急，我们一项一项处理。','Let us understand the fault and the route before us. We can take them one at a time.'],
  'ren-medic':['先顾好眼前的人。要走多远，也得看大家还能承受多少。','Look after the people here first. How far we can go also depends on what everyone can endure.'],
  'lin-scout':['看清实际路况，再做决定。我宁愿多核对一次。','Check the actual track conditions before deciding. I would rather check once more.'],
  'mara-raider':['先把要承担的事说清楚。同行的人都应该知道。','Be clear about what has to be taken on. The people traveling together should know.'],
 }
 const reassurance=replies[c.speaker.id]
 return [
  {text:t('我们眼下该怎么做？','What should we do next?'),reply:c.objective},
  ...(reassurance?[{text:t('我有点担心接下来的路。','I am worried about the road ahead.'),reply:t(...reassurance)}]:[]),
  ...(c.recentTurns.length?[{text:t('还记得我们刚才聊的事吗？','Do you remember what we talked about?'),reply:t('你刚才说：“','You said: “')+c.recentTurns.at(-1)!.input+'”'}]:[]),
 ]
}
