import {findPath} from './pathfinding'
import type {DomainActionRule,DomainRequirement,Locale,StorySave} from './vendor/story/types'
import {actorArt,artDirection} from './art-catalog'
import {scenes,approachPoints,type SceneId} from './scene-layout'

export const RELAY_KEY='spatial_relay_v1'
export type RelayPerson='lin'|'zhou-yu'
export type RelayTheme='thanks'|'reassurance'
export type RelayChoice={templateId:'relay-message-v1';theme:RelayTheme}
type Binding={scene:SceneId;graphic:'mechanic'|'attendant';path:string}
export type RelayPlan={version:1;id:string;seed:string;templateId:'relay-message-v1';theme:RelayTheme;source:RelayPerson;recipient:RelayPerson;artVersion:string;bindings:Record<RelayPerson,Binding>}
export type RelayRecord={version:1;plan:RelayPlan;state:'active'|'failed';stages:string[];issues:string[];phase:'offered'|'accepted'|'delivered'|'completed'|'declined'}
const people:RelayPerson[]=['lin','zhou-yu']
const t=(l:Locale,zh:string,en:string)=>l==='zh'?zh:en
export const relayName=(id:RelayPerson,l:Locale)=>id==='lin'?t(l,'林','Lin'):t(l,'周雨','Zhou Yu')
export function relayAction(verb:string,person:RelayPerson){return `relay-${verb}-${person}`}
export const relayLabels:Record<string,[string,string]>=Object.fromEntries(people.flatMap(p=>[
 [relayAction('offer',p),['聊聊一路上的牵挂','Hear a personal concern']],
 [relayAction('accept',p),['答应替对方传话','Agree to carry the message']],
 [relayAction('decline',p),['婉拒这次传话','Decline this request']],
 [relayAction('deliver',p),['转达约定的那句话','Deliver the promised message']],
 [relayAction('finish',p),['告知传话已收到回应','Report the reply']],
]))
export const isRelayOffer=(id?:string)=>people.some(p=>id===relayAction('offer',p))
export function relayChoiceIssues(value:unknown):string[]{
 if(value===undefined)return []
 const v=value as RelayChoice
 return !v||typeof v!=='object'||Object.keys(v).some(k=>!['templateId','theme'].includes(k))||v.templateId!=='relay-message-v1'||!['thanks','reassurance'].includes(v.theme)?['UNSUPPORTED_CONTENT_TEMPLATE']:[]
}
function bindings():Record<RelayPerson,Binding>{return {lin:{scene:'carriage',graphic:'mechanic',path:actorArt.balanced.mechanic.path},'zhou-yu':{scene:'baggage',graphic:'attendant',path:actorArt.balanced.attendant.path}}}
function hash(seed:string){let n=2166136261;for(const c of seed)n=Math.imul(n^c.charCodeAt(0),16777619);return n>>>0}
export function proposeRelay(source:RelayPerson,seed:string,choice?:RelayChoice):RelayPlan{
 if(!people.includes(source)||!seed||seed.length>100||relayChoiceIssues(choice).length)throw Error('INVALID_RELAY_PROPOSAL')
 return {version:1,id:'relay-'+hash(seed).toString(16),seed,templateId:'relay-message-v1',theme:choice?.theme??(hash(seed)%2?'thanks':'reassurance'),source,recipient:source==='lin'?'zhou-yu':'lin',artVersion:artDirection.referenceVersion,bindings:bindings()}
}
export function relayPlanIssues(plan:RelayPlan,save:StorySave):string[]{
 const issues:string[]=[]
 if(!plan||plan.version!==1||plan.templateId!=='relay-message-v1'||!people.includes(plan.source)||!people.includes(plan.recipient)||plan.source===plan.recipient||!['thanks','reassurance'].includes(plan.theme)||typeof plan.seed!=='string'||!plan.seed||plan.seed.length>100||plan.id!=='relay-'+hash(plan.seed).toString(16))return ['INVALID_RELAY_PLAN']
 if(plan.artVersion!==artDirection.referenceVersion||JSON.stringify(plan.bindings)!==JSON.stringify(bindings()))issues.push('RELAY_ASSET_VERSION')
 if(!save.facts.repaired)issues.push('RELAY_ROUTE_LOCKED')
 for(const person of people){const binding=bindings()[person],layout=scenes[binding.scene];if(!save.characters.some(c=>c.id===person)||!save.facts[person==='lin'?'introduced':'attendant_introduced'])issues.push('RELAY_UNINTRODUCED_PERSON');if(layout.resident?.id!==person||layout.resident.graphic!==binding.graphic||!layout.npc||!approachPoints[person])issues.push('RELAY_MISSING_PRESENTATION')}
 return issues
}
/** A bounded synchronous preparation over already admitted assets. Each stage
 * is recorded; the authority commits the final record with the visible turn.
 * This is not an asynchronous media generation queue. */
export function prepareRelay(plan:RelayPlan,save:StorySave):RelayRecord{
 const stages=['proposed','preparing'],issues=relayPlanIssues(plan,save)
 if(!issues.length)for(const person of people){const binding=plan.bindings[person],layout=scenes[binding.scene];if(!findPath(layout.spawn,approachPoints[person],binding.scene).length)issues.push('RELAY_UNREACHABLE_PERSON')}
 if(issues.length)return {version:1,plan,state:'failed',stages,issues,phase:'offered'}
 stages.push('validated','active');return {version:1,plan,state:'active',stages,issues:[],phase:'offered'}
}
export function readRelay(save?:Pick<StorySave,'facts'>):RelayRecord|null{
 const raw=save?.facts[RELAY_KEY];if(typeof raw!=='string'||raw.length>5000)return null
 try{const r=JSON.parse(raw) as RelayRecord;return r?.version===1&&['active','failed'].includes(r.state)&&['offered','accepted','delivered','completed','declined'].includes(r.phase)&&Array.isArray(r.stages)&&Array.isArray(r.issues)&&r.plan?.templateId==='relay-message-v1'?r:null}catch{return null}
}
export function activeRelay(save:StorySave){const r=readRelay(save);return r?.state==='active'&&!relayPlanIssues(r.plan,save).length?r:null}
export function assertRelayProjection(before:StorySave,after:StorySave,actionId:string|null){
 if(before.facts[RELAY_KEY]===after.facts[RELAY_KEY])return
 if(!actionId||!relayLabels[actionId])throw Error('UNADMITTED_CONTENT_CHANGE')
 const previous=readRelay(before),next=readRelay(after)
 if(!next)throw Error('INVALID_CONTENT_RECORD')
 if(previous&&JSON.stringify(previous.plan)!==JSON.stringify(next.plan))throw Error('CONTENT_IDENTITY_CHANGED')
 if(next.state==='active'&&(relayPlanIssues(next.plan,after).length||JSON.stringify(next.stages)!==JSON.stringify(['proposed','preparing','validated','active'])))throw Error('UNVALIDATED_CONTENT_ACTIVATION')
 const source=next.plan.source,recipient=next.plan.recipient
 const transition=actionId===relayAction('offer',source)?['offer','offered']:actionId===relayAction('accept',source)?['offered','accepted']:actionId===relayAction('decline',source)?['offered','declined']:actionId===relayAction('deliver',recipient)?['accepted','delivered']:actionId===relayAction('finish',source)?['delivered','completed']:null
 if(!transition||next.phase!==transition[1])throw Error('UNADMITTED_CONTENT_PHASE')
 if(transition[0]==='offer'){if(previous&&previous.state!=='failed')throw Error('UNADMITTED_CONTENT_PHASE')}else if(!previous||previous.state!=='active'||previous.phase!==transition[0]||next.state!=='active')throw Error('UNADMITTED_CONTENT_PHASE')
}
export function relayMessage(plan:RelayPlan,locale:Locale){
 return plan.theme==='thanks'?t(locale,'“谢谢你一直守在自己的位置。知道另一处也有人认真照应，我就不觉得自己在孤零零地撑着。”','“Thank you for staying at your post. Knowing someone else is taking care makes this feel less lonely.”'):t(locale,'“这场雨里的等待不好熬，心里紧张也没关系。不必一个人把担心都咽回去。”','“Waiting through this rain is hard, and it is all right to feel nervous. Nobody has to keep every worry to themselves.”')
}

export function relayActions(save:StorySave,target:string):string[]{
 if(!people.includes(target as RelayPerson))return []
 const p=target as RelayPerson,r=readRelay(save)
 if(!save.facts.repaired||!save.facts.introduced||!save.facts.attendant_introduced||!people.every(id=>save.characters.some(c=>c.id===id)))return []
 if(!r)return save.facts[RELAY_KEY]===undefined?[relayAction('offer',p)]:[]
 if(r.state==='failed')return r.plan.source===p?[relayAction('offer',p)]:[]
 if(!activeRelay(save))return []
 if(r.phase==='offered'&&r.plan.source===p)return [relayAction('accept',p),relayAction('decline',p)]
 if(r.phase==='accepted'&&r.plan.recipient===p)return [relayAction('deliver',p)]
 if(r.phase==='delivered'&&r.plan.source===p)return [relayAction('finish',p)]
 return []
}
export function relaySummary(save:StorySave,locale:Locale):[string,string]|null{
 const r=activeRelay(save);if(!r)return null
 const {source,recipient}=r.plan,a=relayName(source,locale),b=relayName(recipient,locale)
 const details={offered:t(locale,`${a}想请你给${b}带一句话。是否答应由你决定。`,`${a} has a message for ${b}. You can accept or decline.`),accepted:t(locale,`已答应${a}。走到${b}身边，亲自转达。`,`You agreed to help ${a}. Find ${b} and deliver the message in person.`),delivered:t(locale,`${b}已经收到。回到${a}身边，告诉对方回应。`,`${b} received the message. Return to ${a} with the reply.`),completed:t(locale,`你替${a}把话带给${b}，也带回了回应。`,`You carried ${a}’s message to ${b} and brought back the reply.`),declined:t(locale,`你婉拒了${a}，对方理解。你没有承诺传话。`,`You declined ${a}’s request, and they understood. You made no promise.`)}
 return [t(locale,r.phase==='completed'?'约定已完成':r.phase==='declined'?'已婉拒的请求':'替人带一句话',r.phase==='completed'?'Promise kept':r.phase==='declined'?'Request declined':'A message to carry'),details[r.phase]]
}
export function relayRules(locale:Locale,save?:StorySave,seed='preview',choice?:RelayChoice):DomainActionRule[]{
 const copy=(zh:string,en:string)=>t(locale,zh,en),r=readRelay(save),rules:DomainActionRule[]=[]
 for(const p of people)for(const verb of ['offer','accept','decline','deliver','finish']){
  const id=relayAction(verb,p),allowed=!!save&&relayActions(save,p).includes(id)
  const requirements:DomainRequirement[]=[{type:'map',nodeId:bindings()[p].scene,reason:copy('走到对方身边再说。','Speak to this person in their car.')},{type:'fact',id:'repaired',equals:true,reason:copy('先恢复车厢之间的通路。','Restore the passage between the cars first.')}]
  // Impossible requirement represents a disallowed phase without trusting text.
  if(!allowed)requirements.push({type:'fact',id:'repaired',equals:false,reason:copy('当前没有这一步需要确认的约定。','There is no promise at this stage to confirm.')})
  let next=r,effects:DomainActionRule['effects']=[],text=''
  if(verb==='offer'&&allowed&&save){next=prepareRelay(r?.state==='failed'?r.plan:proposeRelay(p,seed,choice),save);text=next.state==='active'?`${relayName(p,locale)}${copy('轻声说：',' says quietly: ')}${copy('想请你给'+relayName(next.plan.recipient,locale)+'带一句话。','Could you carry a message to '+relayName(next.plan.recipient,locale)+'? ')}${relayMessage(next.plan,locale)}`:copy('这段对话尚未准备好。可以重试，或先继续探索。你还没有作出承诺。','This conversation is not ready. Retry or keep exploring. You have made no promise.')}
  if(r?.state==='active'&&allowed){
   const a=relayName(r.plan.source,locale),b=relayName(r.plan.recipient,locale)
   if(verb==='accept'){next={...r,phase:'accepted'};text=copy(`你答应${a}，会亲自把这句话带给${b}。对方点了点头，仍留在原处。`,`You promise ${a} to carry the message to ${b} in person. They nod and remain at their post.`)}
   if(verb==='decline'){next={...r,phase:'declined'};text=copy(`你婉转说明，想先专心处理自己的行程。${a}表示理解，没有再催促。`,`You explain that you want to focus on your own journey. ${a} understands and does not press you.`)}
   if(verb==='deliver'){next={...r,phase:'delivered'};text=copy(`你把${a}托付的话原意转达给${b}：`, `You convey ${a}’s message to ${b}: `)+relayMessage(r.plan,locale)+copy(`\n${b}听完，轻轻点头：“谢谢你跑这一趟。也请告诉对方，这句话我记住了。”`,`\n${b} nods after listening. “Thank you for coming. Please tell them I will remember that.”`);effects.push({type:'relationship',characterId:r.plan.recipient,axis:'message-received',delta:1})}
   if(verb==='finish'){next={...r,phase:'completed'};text=copy(`你告诉${a}，${b}已经收到那句话，也让你带回了谢意。${a}松了口气：“这就好。谢谢你把这件小事放在心上。”这次约定完成了。`,`You tell ${a} that ${b} received the message and sent thanks in return. ${a} relaxes. “Good. Thank you for caring about this small thing.” You have kept your promise.`);effects.push({type:'relationship',characterId:r.plan.source,axis:'message-promise-kept',delta:1})}
  }
  if(next&&allowed)effects.unshift({type:'fact',id:RELAY_KEY,value:JSON.stringify(next)})
  rules.push({id,intent:id,match:[id],matchMode:'exact',requirements,effects,successText:text,successChoices:[],dangerPolicy:'suppress'})
 }
 return rules
}
