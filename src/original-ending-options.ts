import type {StoryCartridge,StorySave,StoryEndingAnchor,StoryEndingSnapshot,StoryEndingCandidate} from './vendor/original-train/types'
import {availableEndingCapabilities} from './vendor/original-train/engine/endingDirector'
import {originalEndingCartridge} from './original-ending-capabilities'
export const originalEndingOptionIds=['common-line','endless-rescue','first-street','the-last-bridge','open-ledger','many-hands','emergency-conductor','quiet-platform','settle-basic','bridge-basic'] as const
export type OriginalEndingOptionId=typeof originalEndingOptionIds[number]
export function originalEndingSpec(c:StoryCartridge,id:string):StoryEndingAnchor|undefined{
 const original=c.endingDirector?.anchors.find(a=>a.id===id);if(original)return structuredClone(original)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en
 if(id==='settle-basic')return {id,title:s('在枢纽安顿','A Place at the Junction'),thesis:s('先让抵达的人有地方生活，远行留给以后的选择。','Give those who arrived a place to live, leaving further journeys to later choices.'),capabilityIds:['settle-junction'],irreversibleCosts:[],preserved:[s('已经抵达的人与他们真实留下的关系','The people who arrived and their actual relationships')],lost:[s('整列车共同远行的生活','Life traveling together as one whole train')],unresolved:[s('如何分配住处并接纳后来者','How to share shelter and receive later arrivals')],finaleScenes:[s('列车在枢纽月台停稳。','The train settles at the junction platform.'),s('乘客选择自己的住处与共同空间。','Passengers choose places to live and spaces to share.'),s('既有伙伴按各自意愿留下或继续生活。','The companions choose how to continue their lives.'),s('最后一盏车厢灯成为新住处的灯。','The last carriage lamp becomes a light in a new home.')],finalImagePrompt:'stationary weathered train used as shelter beside a dawn railway junction, existing passengers settling into ordinary life, no text, no UI'}
 if(id==='bridge-basic')return {id,title:s('彼岸的人','The People on the Far Bank'),thesis:s('列车留下，队伍抵达；这份代价不会被抵达抹掉。','The train remains behind and the people arrive; arrival does not erase the cost.'),capabilityIds:['sacrifice-train'],irreversibleCosts:[],preserved:[s('已经过桥的乘客、伙伴与携带物资','The passengers, companions and supplies brought across')],lost:[s('末班车继续行驶的可能','The last train’s ability to travel again')],unresolved:[s('没有列车之后怎样继续生活','How to continue life without the train')],finaleScenes:[s('大家在彼岸按旧名单应答。','Everyone answers the old roll on the far bank.'),s('固定在缺口的列车留在水面上。','The anchored train remains across the gap.'),s('可携物资在枢纽外重新分放。','Portable supplies are redistributed outside the junction.'),s('天亮时，队伍带着损失也带着彼此走进枢纽。','At dawn the group enters the junction carrying their loss and one another.')],finalImagePrompt:'survivors on the far bank at dawn with the old train permanently anchored across a flood gap in the distance, no moving train, no text, no UI'}
}
export function originalEndingCosts(spec:StoryEndingAnchor,c:StoryCartridge){return [...new Set([...spec.capabilityIds.flatMap(id=>c.endingDirector!.capabilities.find(cap=>cap.id===id)?.mandatoryCosts??[]),...spec.irreversibleCosts])]}
const needsRunningTrain=new Set(['common-line','endless-rescue','many-hands','emergency-conductor'])
export function availableOriginalEndingOptions(save:StorySave,c:StoryCartridge){
 const adapted=originalEndingCartridge(save,c),available=new Set(availableEndingCapabilities(save,adapted))
 return originalEndingOptionIds.map(id=>originalEndingSpec(adapted,id)!).filter(spec=>spec.capabilityIds.every(id=>available.has(id))&&(!needsRunningTrain.has(spec.id)||save.stats.condition>0))
}
export function selectedOriginalEnding(snapshot:StoryEndingSnapshot,c:StoryCartridge){
 const id=snapshot.facts['junction-ending-choice'];if(id===undefined)return undefined
 const spec=typeof id==='string'&&originalEndingOptionIds.some(v=>v===id)?originalEndingSpec(c,id):undefined
 if(!spec||needsRunningTrain.has(spec.id)&&snapshot.stats.condition<=0||!spec.capabilityIds.every(id=>snapshot.availableCapabilities.includes(id))||snapshot.facts['junction-ending-capabilities']!==spec.capabilityIds.join('|'))throw Error('INVALID_ORIGINAL_ENDING_CHOICE')
 return spec
}
export function authoredOriginalEnding(snapshot:StoryEndingSnapshot,c:StoryCartridge):StoryEndingCandidate|undefined{
 const spec=selectedOriginalEnding(snapshot,c);if(!spec)return
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,f=snapshot.facts,party=new Set(snapshot.partyMemberIds)
 const scenes=[...spec.finaleScenes]
 if(!party.has('ren-medic')){
  if(spec.id==='first-street')scenes[1]=s('乘客把一节车厢整理成共同休息处。','Passengers turn one carriage into a shared resting place.')
  if(spec.id==='open-ledger')scenes[2]=s('大家把未能确认的部分留空，在页边写下下一次查访的方向。','The group leaves unconfirmed parts blank and notes where the next inquiry should begin.')
  if(spec.id==='many-hands')scenes[1]=s('原有岗位分别报出自己已经核实的事实。','The existing posts each report what they have actually verified.')
 }
 const characterEpilogues=snapshot.characters.map(person=>{
  let text=party.has(person.id)?s(`${person.name}和队伍共同走到了最后；新的安排保留了这段同行经历。`,`${person.name} reached the end with the crew; the new arrangement preserves that shared journey.`):s(`${person.name}没有作为同行者抵达，已经发生的关系仍被记录。`,`${person.name} did not arrive as a companion; the relationship already formed remains recorded.`)
  if(person.id==='ada-mechanic')text+=' '+s('她完成过启动、制动与桥前的机务工作，专业判断不再只靠一张证件证明。','Her work on starting, braking and the bridge approach stands as evidence of professional judgment beyond a certificate.')
  if(person.id==='ren-medic'&&f['river-patients-treated'])text+=' '+s('河谷的氧气已经用于救治；他没有把这次救援写成从未付出代价的奇迹。','The valley oxygen was used for treatment; he records the rescue without pretending it was costless.')
  if(person.id==='lin-scout')text+=' '+(f['pine-escort-decision']==='stayed'&&!party.has(person.id)?s('他留守黑松信号点，列车带走了他核实的路册。','He remained at Black Pine’s signal post while the train carried his verified route record.'):s('黑松路册与他亲自核实的线路继续留下。','The Black Pine record and the route he personally verified remain.'))
  if(person.id==='mara-raider')text+=' '+(f['yard-agreement']==='forced'?s('货场油账仍记着强取，不会在结局里把敌意改成未经发生的和解。','The yard ledger still records the fuel seizure; the ending does not turn hostility into a reconciliation that never happened.'):s('货场油账上的合作条目已经结清；他的名字与当时答应承担的责任写在一起。','The yard cooperation is settled in the ledger, his name beside the responsibility he agreed to carry.'))
  return {characterId:person.id,text}
 })
 const regionText=(id:string)=>{
  if(id==='dead-station')return s('启动机修复后，列车按最初承诺的支线离开；这段选择没有被终点重写。','After the starter repair, the train followed its committed first branch; the ending does not rewrite that choice.')
  if(id==='river-valley')return f['river-patients-treated']?s('诊所氧气已用于治疗，任医生把两名获救者的情况留在诊所记录里。','Clinic oxygen was used for treatment; Doctor Ren leaves the two rescued patients’ condition in the clinic record.'):s('河谷只保留已经实际发生的访问，没有补写救援。','The valley retains the visit that actually happened, without adding a rescue.')
  if(id==='pine-line')return s('伪安全信号被检查，林线采用过的避让方式与路册核实记录保留。','The false safe signal was inspected; the chosen avoidance method and route verification remain recorded.')
  if(id==='tunnel')return f['tunnel-cargo-policy']==='abandoned'?s('卸在洞口的物资仍留在那里，失去的备用品不会因抵达回来。','Supplies unloaded at the tunnel stay there; lost reserves do not return with arrival.'):s('排烟付出的燃料换来了保留物资的空间；燃料不会被终点返还。','Fuel spent on ventilation preserved the supplies; arrival does not refund it.')
  if(id==='graystone-yard')return f['yard-agreement']==='forced'?s('油账保留强取燃料的记载，守卫的敌意仍有来由。','The ledger keeps the fuel seizure recorded, preserving the reason for the guards’ hostility.'):s('合作换来的油已记入账册，同行者带着约定上路，留守者继续看管货场。','The exchanged fuel is entered in the ledger. Those traveling carry their agreement onward; those staying continue to watch the yard.')
  if(id==='mountain-pass')return s('山口采用过的制动方式、实际岗位与车损留在行车记录中。','The pass’s braking method, actual duties and damage remain in the operating record.')
  if(id==='sleeping-town')return (f['town-aid-policy']==='broadcast'?s('列车供出的燃料恢复了应急广播。','Fuel contributed by the train restored the emergency broadcast.'):s('列车保留燃料，小城广播没有由这支队伍恢复。','The train retained fuel; this crew did not restore the town broadcast.'))+' '+(f['town-rested']?s('停留恢复精神，也让过桥时的水位更高。','Rest restored morale and meant a higher water level at the bridge.'):s('队伍没有选择额外停留二十分钟。','The crew did not choose the extra twenty-minute stop.'))
  return f['bridge-train-fate']==='anchored'?s('队伍步行抵达，列车永久留在缺口。','The people arrived on foot; the train remains permanently in the gap.'):s('列车实际越过洪水桥后进入枢纽，抵达与过桥是两个不同的事实。','The train entered the junction after actually crossing the flood bridge; approach and crossing remain distinct facts.')
 }
 return {anchorFamily:spec.id,title:spec.title,thesis:spec.thesis,capabilitiesUsed:[...spec.capabilityIds],irreversibleCosts:originalEndingCosts(spec,c),preserved:[...spec.preserved],lost:[...spec.lost],unresolved:[...spec.unresolved],finaleScenes:scenes,characterEpilogues,regionalEpilogues:snapshot.map.filter(m=>m.visited).map(m=>({regionId:m.id,text:regionText(m.id)})),finalImagePrompt:spec.finalImagePrompt}
}
export function validateSelectedOriginalEnding(candidate:StoryEndingCandidate,snapshot:StoryEndingSnapshot,c:StoryCartridge){
 const spec=selectedOriginalEnding(snapshot,c);if(!spec)return
 const same=(a:string[],b:string[])=>a.length===b.length&&a.every(id=>b.includes(id))&&new Set(a).size===a.length
 if(candidate.anchorFamily!==spec.id||!same(candidate.capabilitiesUsed,spec.capabilityIds)||!same(candidate.irreversibleCosts,originalEndingCosts(spec,c))||!same(candidate.characterEpilogues.map(e=>e.characterId),snapshot.characters.map(p=>p.id))||!same(candidate.regionalEpilogues.map(e=>e.regionId),snapshot.map.filter(m=>m.visited).map(m=>m.id)))throw Error('ORIGINAL_ENDING_CHOICE_MISMATCH')
 const prose=[candidate.title,candidate.thesis,...candidate.finaleScenes,...candidate.preserved,...candidate.lost,...candidate.unresolved,...candidate.characterEpilogues.map(e=>e.text),...candidate.regionalEpilogues.map(e=>e.text),candidate.finalImagePrompt].join('\n')
 for(const person of c.characters)if(!snapshot.characters.some(p=>p.id===person.id)&&new RegExp(/^[\x00-\x7F]+$/.test(person.name)?`\\b${person.name}\\b`:person.name,'i').test(prose))throw Error('ORIGINAL_ENDING_UNKNOWN_CHARACTER')
}
