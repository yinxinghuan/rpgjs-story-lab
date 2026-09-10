import {departureAdvice} from './departure'
import {receptionAdvice} from './reception'
import type {CharacterDefinition,Locale,ParsedScene,StoryCartridge,StorySave} from './vendor/story/types'
import {applyParsedScene} from './vendor/story/engine/reducer'
import {hasVisibleCharacterDebut,validateCharacterContinuity} from './vendor/story/engine/characterContinuity'

export const DISPATCHER='xu-lan'
const t=(l:Locale,zh:string,en:string)=>l==='zh'?zh:en
export const dispatcherName=(l:Locale)=>t(l,'许岚','Xu Lan')
export const dispatcherDefinition=(l:Locale):CharacterDefinition=>({id:DISPATCHER,name:dispatcherName(l),role:t(l,'值班调度 · 电台联系人','Duty dispatcher · Radio contact'),detail:t(l,'通过 3 频道联系，负责协调接应。只听到她的声音，尚未见面。','Reached on channel 3 to coordinate rescue. You have heard her voice, but have not met in person.'),vitality:100,stress:0,skills:[],hiddenUntilIntroduced:true})
export const dispatcherIntro=(l:Locale)=>t(l,'听筒沙沙响起，一个女声说：“我是许岚，值班调度。我会帮你联系接应。”','The handset crackles. A woman says, “I am Xu Lan, the duty dispatcher. I will help guide rescue.”')
export const knowsDispatcher=(s:StorySave)=>Boolean(s.facts.dispatcher_introduced)&&s.characters.some(c=>c.id===DISPATCHER)
export function radioContactAvailable(s:StorySave){return knowsDispatcher(s)&&Boolean(s.facts.battery_installed)&&Boolean(s.facts.signal_acknowledged)&&s.map.some(m=>m.current&&(m.id==='cab'||m.id==='walkway'&&s.facts.access_cleared))}
export function dispatcherReports(s:StorySave){return s.facts.dispatcher_briefed&&s.facts.introduced?[{id:'carriage-circuit-report',source:'player-report',subjectId:'lin',subjectName:s.locale==='zh'?'林':'Lin',content:s.locale==='zh'?'玩家告诉许岚：林留在客厢看护电路。':'The player told Xu Lan that Lin is watching the carriage circuit.',scope:'Remembered player report; not a current remote observation or permission to interact.'}]:[]}
export function dispatcherReply(s:Pick<StorySave,'facts'|'locale'>,l=s.locale){
 const advice=departureAdvice(s,'radio',l)??receptionAdvice(s,'radio',l);if(advice)return advice
 const f=s.facts
 const memory=f.dispatcher_briefed?t(l,'“你说林留在客厢看电路，我已经记下。”','“You said Lin is watching the carriage circuit. I have noted that.”'):''
 return t(l,f.beacon_set?'许岚的声音再次传来：“接应已确认引导灯，正在循光找车。保持照明，在车内等候。”':f.power_radio?'许岚说：“电台信号稳定，接应正沿信号靠近。你选择了电台增幅，客厢会暗一些，沿应急灯走就好。”':f.rescue_sent?'许岚说：“此前的求援已经确认，接应正在靠近。不需要重新操作，留在安全的位置等候。”':'许岚说：“短报文已经收到，还需要门边的引导灯。回客厢配电箱设置好，接应才能循光找到列车。”',f.beacon_set?'Xu Lan answers again. “The rescue team has confirmed the guide light and is following it. Keep the carriage lit and wait inside.”':f.power_radio?'Xu Lan says, “The radio signal is steady; help is following it. You chose radio priority, so use the emergency lights in the dimmer carriage.”':f.rescue_sent?'Xu Lan says, “Your earlier rescue call is confirmed. Help is approaching. There is no need to repeat it; wait somewhere safe.”':'Xu Lan says, “The short message was received. We still need the door guide light. Set it at the carriage panel so help can locate the train.”')+memory
}
// Project only the canonical character_update result into this domain transaction.
// The staging reducer's extra scene/log/choice outputs are deliberately not applied.
export function admitDispatcher(base:StorySave,save:StorySave,cartridge:StoryCartridge,text:string){
 const parsed:ParsedScene={raw:text,blocks:[{id:'dispatcher-debut',kind:'narration',text}],commands:[{type:'character_update',characterId:DISPATCHER,character:dispatcherName(save.locale)}]}
 const issues=validateCharacterContinuity(base,parsed,cartridge)
 if(issues.length||!hasVisibleCharacterDebut(parsed,dispatcherName(save.locale),save.locale))throw new Error('INVALID_DISPATCHER_DEBUT')
 const staged=applyParsedScene(base,parsed,cartridge,'radio-contact-introduction')
 const contact=staged.characters.find(c=>c.id===DISPATCHER)
 if(!contact)throw new Error('DISPATCHER_NOT_CREATED')
 save.characters=[...save.characters.filter(c=>c.id!==DISPATCHER),{...contact,status:'known',lastKnownLocation:'radio-channel-3',updatedAtScene:save.scene}]
}
export function upgradeContactFacts(s:StorySave){
 let changed=false
 const contact=s.characters.find(c=>c.id===DISPATCHER)
 const visible=s.blocks.some(b=>b.kind==='narration'&&hasVisibleCharacterDebut({raw:b.text,blocks:[b],commands:[]},dispatcherName(s.locale),s.locale))
 const established=Boolean(contact)&&(visible||s.partyMemberIds.includes(DISPATCHER)||s.relationships.some(r=>r.characterId===DISPATCHER))
 if(contact&&!established){s.characters=s.characters.filter(c=>c.id!==DISPATCHER);changed=true}
 if(s.facts.dispatcher_introduced!==established){s.facts.dispatcher_introduced=established;changed=true}
 if(s.facts.dispatcher_briefed===undefined||!established&&s.facts.dispatcher_briefed!==false){s.facts.dispatcher_briefed=false;changed=true}
 return changed
}
