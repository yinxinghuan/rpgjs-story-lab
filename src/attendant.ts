import {departureAdvice} from './departure'
import {receptionAdvice} from './reception'
import type {CharacterDefinition,Locale,ParsedScene,StoryCartridge,StorySave} from './vendor/story/types'
import {applyParsedScene} from './vendor/story/engine/reducer'
import {hasVisibleCharacterDebut,validateCharacterContinuity} from './vendor/story/engine/characterContinuity'
export const ATTENDANT='zhou-yu'
const t=(l:Locale,zh:string,en:string)=>l==='zh'?zh:en
export const attendantName=(l:Locale)=>t(l,'周雨','Zhou Yu')
export const attendantDefinition=(l:Locale):CharacterDefinition=>({id:ATTENDANT,name:attendantName(l),role:t(l,'行李车乘务员','Baggage car attendant'),detail:t(l,'青色制服，米色围巾，发髻。留守行李车。','Teal uniform, cream scarf, dark hair in a bun. Stays in the baggage car.'),vitality:100,stress:0,skills:[],hiddenUntilIntroduced:true})
export const attendantIntro=(l:Locale)=>t(l,'青衣乘务员理了理围巾：“我叫周雨。我守着行李车，有需要就问我。”','The attendant in teal straightens her scarf. “I am Zhou Yu. I stay here; ask me if you need help.”')
export const knowsAttendant=(s:StorySave)=>Boolean(s.facts.attendant_introduced)&&s.characters.some(c=>c.id===ATTENDANT)
export function attendantReply(s:Pick<StorySave,'facts'|'locale'>){const advice=departureAdvice(s,'zhou-yu')??receptionAdvice(s,'zhou-yu');if(advice)return advice;return s.facts.rescue_sent?t(s.locale,'周雨守在货箱旁：“那我继续守着行李，过道也会留出来。你可以慢慢等。”','Zhou Yu stays beside the cargo. “I will keep watch over the baggage and keep the aisle clear. You can wait here.”'):!s.facts.battery_taken?t(s.locale,'周雨指向器材柜：“备用电池放在中层。先看看记录板，再带去车头，别选错频道。”','Zhou Yu points to the supply cabinet. “The spare battery is on the middle shelf. Check the clipboard before taking it to the cab, so you use the right channel.”'):!s.facts.record_read?t(s.locale,'周雨指了指墙上的记录板：“夜里有人值守的频道写在上面。带着电池，也记得看一眼。”','Zhou Yu points at the clipboard. “The attended night channel is written there. Take a look before carrying the battery forward.”'):t(s.locale,'周雨指向过道：“车头电台就在前面。我留在这儿看着行李，你沿连接门过去就好。”','Zhou Yu gestures along the aisle. “The cab radio is ahead. I will watch the baggage here; follow the connecting door.”')}
export function admitAttendant(base:StorySave,save:StorySave,cartridge:StoryCartridge,text:string){
 const parsed:ParsedScene={raw:text,blocks:[{id:'attendant-debut',kind:'narration',text}],commands:[{type:'character_update',characterId:ATTENDANT,character:attendantName(save.locale)}]}
 if(validateCharacterContinuity(base,parsed,cartridge).length||!hasVisibleCharacterDebut(parsed,attendantName(save.locale),save.locale))throw new Error('INVALID_ATTENDANT_DEBUT')
 const staged=applyParsedScene(base,parsed,cartridge,'baggage-attendant-introduction'),person=staged.characters.find(c=>c.id===ATTENDANT)
 if(!person)throw new Error('ATTENDANT_NOT_CREATED')
 save.characters=[...save.characters.filter(c=>c.id!==ATTENDANT),{...person,status:'known',lastKnownLocation:'baggage',updatedAtScene:save.scene}]
}
export function upgradeAttendantFacts(s:StorySave){
 const person=s.characters.find(c=>c.id===ATTENDANT)
 const visible=s.blocks.some(b=>b.kind==='narration'&&hasVisibleCharacterDebut({raw:b.text,blocks:[b],commands:[]},attendantName(s.locale),s.locale))
 const established=Boolean(person)&&(visible||s.partyMemberIds.includes(ATTENDANT)||s.relationships.some(r=>r.characterId===ATTENDANT))
 let changed=false
 if(person&&!established){s.characters=s.characters.filter(c=>c.id!==ATTENDANT);changed=true}
 if(s.facts.attendant_introduced!==established){s.facts.attendant_introduced=established;changed=true}
 return changed
}
