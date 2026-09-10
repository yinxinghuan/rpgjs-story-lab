import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {LabError} from './journey-runtime'

// Authored continuation of the original river-valley chapter. Only these server
// definitions may construct commands; player text is never parsed as protocol.
const definitions=[
 {id:'river-survey',zh:'检查断桥承重',en:'Inspect the broken bridge'},
 {id:'river-rescue-powered',zh:'用列车绞盘接应诊所（燃料−6）',en:'Evacuate the clinic with the train winch (Fuel −6)'},
 {id:'river-rescue-manual',zh:'用人工牵引接应诊所（车况−8）',en:'Evacuate the clinic by hand (Condition −8)'},
 {id:'river-treat',zh:'让任医生用氧气救治病人',en:'Have Doctor Ren treat the patients with oxygen'},
 {id:'river-refuel',zh:'抽取岸边应急柴油',en:'Pump the shore emergency diesel'},
 {id:'river-stabilize',zh:'请阿达加固传动架',en:'Ask Ada to brace the transmission frame'},
 {id:'river-depart',zh:'返回列车前往白石隧道（燃料−6）',en:'Return to the train and travel to White Stone Tunnel (Fuel −6)'},
] as const
export type RiverActionId=typeof definitions[number]['id']
export const riverActions=definitions
export const riverActionLabel=(id:RiverActionId,locale:Locale)=>definitions.find(d=>d.id===id)![locale]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
export function resolveRiverAction(text:string,locale:Locale){const input=normalize(text);return definitions.find(d=>[d[locale],d[locale].replace(/\s*[（(][^()（）]*[）)]\s*$/,'')].some(label=>normalize(label)===input))?.id}
export const riverBindingRules=definitions.map(d=>({id:d.id,effects:d.id==='river-depart'?[{type:'map',nodeId:'tunnel'}]:[]}))
export const riverRejections=['ORIGINAL_RIVER_REQUIRED','ORIGINAL_BRIDGE_UNSURVEYED','ORIGINAL_RESCUE_REQUIRED','ORIGINAL_RESCUE_COMPLETED','ORIGINAL_TREATMENT_COMPLETED','ORIGINAL_OXYGEN_REQUIRED','ORIGINAL_FUEL_REQUIRED','ORIGINAL_RESERVE_EMPTY','ORIGINAL_CHAPTER_DONE','ORIGINAL_BRIDGE_ALREADY_SURVEYED','ORIGINAL_CONDITION_REQUIRED','ORIGINAL_BRACING_UNAVAILABLE'] as const
export function riverRejection(save:StorySave,id:RiverActionId):string|undefined{
 const f=save.facts
 if(save.map.find(n=>n.current)?.id!=='river-valley')return 'ORIGINAL_RIVER_REQUIRED'
 if(f['chapter-river-complete'])return 'ORIGINAL_CHAPTER_DONE'
 if(id==='river-survey')return f['river-bridge-surveyed']?'ORIGINAL_BRIDGE_ALREADY_SURVEYED':undefined
 if(id==='river-refuel')return f['river-reserve-used']?'ORIGINAL_RESERVE_EMPTY':undefined
 if(id==='river-stabilize')return f['river-bracing-used']||save.stats.condition>=20?'ORIGINAL_BRACING_UNAVAILABLE':undefined
 if(!f['river-bridge-surveyed'])return 'ORIGINAL_BRIDGE_UNSURVEYED'
 if(id.startsWith('river-rescue-')){
  if(f['river-rescue-method'])return 'ORIGINAL_RESCUE_COMPLETED'
  if(id==='river-rescue-powered'&&save.stats.fuel<6)return 'ORIGINAL_FUEL_REQUIRED'
  if(id==='river-rescue-powered'&&save.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
  if(id==='river-rescue-manual'&&save.stats.condition<8)return 'ORIGINAL_CONDITION_REQUIRED'
  return
 }
 if(!f['river-rescue-method'])return 'ORIGINAL_RESCUE_REQUIRED'
 if(id==='river-treat'){
  if(f['river-patients-treated'])return 'ORIGINAL_TREATMENT_COMPLETED'
  if(!save.characters.some(c=>c.id==='ren-medic')||(save.inventory.find(i=>i.id==='clinic-oxygen')?.count??0)<1)return 'ORIGINAL_OXYGEN_REQUIRED'
 }
 if(id==='river-depart'){
  if(!f['river-patients-treated'])return 'ORIGINAL_RESCUE_REQUIRED'
  if(save.stats.fuel<6)return 'ORIGINAL_FUEL_REQUIRED'
  if(save.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
 }
}
export function availableRiverActions(save:StorySave){return definitions.filter(d=>!riverRejection(save,d.id)).map(d=>d.id)}

export function executeRiverTurn(save:StorySave,c:StoryCartridge,id:RiverActionId){
 const rejection=riverRejection(save,id);if(rejection)throw new LabError(rejection,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en
 const commands:ParsedCommand[]=[]
 const fact=(key:string,value:string|number|boolean)=>commands.push({type:'fact',id:key,value})
 const stat=(key:string,delta:number)=>commands.push({type:'widget',id:key,operation:delta<0?'remove':'add',value:Math.abs(delta)})
 const oxygen=s('诊所氧气瓶','Clinic Oxygen Cylinder'),ren=c.characters.find(p=>p.id==='ren-medic')!
 let text='',objective=''
 if(id==='river-survey'){
  text=s('阿达把测绳探进冲空的桥墩，绳结一直沉到水下：列车不能上桥。电台里，诊所的一名医生报告两名病人需要接应。近岸检修通路还能挂牵引索；列车绞盘会耗油，人工牵引则会磨损车上的滑轮。','Ada lowers a measuring line into the hollow pier. The knot sinks below the water: the train cannot cross. A doctor at the clinic radios for help evacuating two patients. The near-bank maintenance route can take a hauling line; the train winch needs fuel, while hand hauling will wear the train’s pulleys.')
  fact('river-bridge-surveyed',true);commands.push({type:'encounter',phase:'warning',kind:s('河谷桥墩被洪水掏空','Flood undermining the valley pier'),severity:2})
  objective=s('选择接应方式，把诊所病人带回近岸','Choose a hauling method to bring the clinic patients to the near bank')
 }
 if(id==='river-rescue-powered'||id==='river-rescue-manual'){
  const powered=id==='river-rescue-powered'
  text=s(powered?'列车绞盘绷紧牵引索，两副担架沿检修通路抵达近岸，发动机为这趟接应烧掉了燃料。':'大家轮流拉动牵引索，两副担架沿检修通路抵达近岸；车上的滑轮被磨出一道深槽。',powered?'The train winch tightens the hauling line. Two stretchers reach the near bank along the maintenance route, burning fuel in the process.':'The passengers take turns hauling. Two stretchers reach the near bank along the maintenance route; a deep groove wears into a train pulley.')
  text+='\n'+(save.characters.some(p=>p.id===ren.id)?s('任医生抱着诊所氧气瓶跟上担架，请你腾出地方继续救治。','Doctor Ren follows the stretchers with the clinic oxygen cylinder and asks for space to treat the patients.'):s('一个袖口浸透、抱着急救箱的男人跟上担架。“我姓任，诊所的医生。”他把一瓶氧气放在近岸棚下，先查看病人的呼吸，才请求借用列车的医务角。','A man with soaked cuffs follows the stretchers, clutching a medical case. “I’m Doctor Ren, from the clinic.” He places an oxygen cylinder under the near-bank shelter, checks the patients’ breathing, then asks to use the train’s medical corner.'))
  stat(powered?'fuel':'condition',powered?-6:-8);fact('river-rescue-method',powered?'powered':'manual')
  commands.push({type:'inventory',action:'add',itemId:'clinic-oxygen',item:oxygen,count:1,detail:s('诊所撤离队带到近岸的氧气瓶','Brought to the near bank by the clinic evacuation team'),effect:s('供两名病人急救，一次用完','Emergency treatment for two patients; consumed once')},{type:'character_update',characterId:ren.id,character:ren.name},{type:'encounter',phase:'resolution',kind:s('河谷诊所接应','Valley clinic evacuation'),outcome:powered?'success':'costly-success'})
  objective=s('把诊所氧气交给任医生救治病人','Let Doctor Ren use the clinic oxygen to treat the patients')
 }
 if(id==='river-treat'){
  text=s('任医生把氧气接上面罩，两名病人的呼吸逐渐平稳，瓶中的余气也用尽了。他背起急救箱，带病人登上列车：“我随你们走，医务角由我负责。”阿达挪出过道，让他把诊所的求援频率记在电台旁。','Doctor Ren connects the oxygen masks. Both patients breathe more steadily as the cylinder runs empty. He shoulders his medical case and boards with them. “I’ll travel with you and take care of the medical corner.” Ada clears the aisle while he records the clinic’s relief frequency beside the radio.')
  commands.push({type:'inventory',action:'remove',itemId:'clinic-oxygen',item:oxygen,count:1},{type:'party_change',characterId:ren.id,character:ren.name,change:'add'},{type:'reputation',npc:ren.name,action:'clinic-rescue-kept'})
  stat('morale',6);fact('river-patients-treated',true);fact('rescued-count',Number(save.facts['rescued-count']??0)+2);fact('aid-network-known',true)
  objective=s('沿近岸返回列车，离开继续上涨的河水','Return along the near bank and leave the rising river behind')
 }
 if(id==='river-refuel'){
  text=s('岸边铁路应急油柜里还剩一份干净柴油。阿达用手泵把它抽进列车油箱，随后翻转空柜的标牌；这里没有第二份储备。','One clean reserve remains in the shore railway fuel locker. Ada hand-pumps it into the train’s tank and turns the locker’s tag over. No second reserve remains here.')
  stat('fuel',12);fact('river-reserve-used',true)
 }
 if(id==='river-stabilize'){
  text=s('阿达从岸边废检修架拆下最后两根撑杆，将松脱的传动架固定回车底。列车恢复了低速牵引能力；撑杆已经用完，不能再靠这里重复抢修。','Ada removes the last two braces from the abandoned shore maintenance stand and secures the loose transmission frame beneath the train. Low-speed traction is restored; the stand has no braces left for another repair.')
  stat('condition',20);fact('river-bracing-used',true)
 }
 if(id==='river-depart'){
  text=s('任医生和两名病人已经安顿好。阿达收起岸边牵引索，列车沿近岸回接线离开河谷，没有驶上断桥。白石隧道口的通风机一动不动，风把一缕烟推到车灯前。','Doctor Ren and both patients are settled aboard. Ada retrieves the shore line, and the train leaves along the near-bank connecting track without crossing the broken bridge. At White Stone Tunnel the ventilation fan is still; a thread of smoke drifts into the headlamp.')
  stat('fuel',-6);fact('chapter-river-complete',true);fact('chapter-dead-station-complete',true)
  commands.push({type:'map_update',location:c.initialMap.find(n=>n.id==='tunnel')!.label},{type:'clock',value:s('第 1 夜 · 03:26','Night One · 03:26')},{type:'encounter',phase:'warning',kind:s('白石隧道烟雾','Smoke in White Stone Tunnel'),severity:2})
  objective=s('查明隧道烟源，决定怎样带队通过','Identify the tunnel smoke and decide how to bring the crew through')
 }
 if(objective)commands.push({type:'state',value:objective})
 // The canonical v8 reducer owns all facts, inventory, cast, danger and history.
 // Text is an event so its inventory-inference heuristic cannot invent a second item.
 const parsed={blocks:[{id:`river-${save.scene+1}-${id}`,kind:'event' as const,text}],commands,raw:text}
 const next=applyParsedScene(structuredClone(save),parsed,c,riverActionLabel(id,c.locale))
 // Grounded choices are presentation derived from the resulting authoritative save.
 next.choices=availableRiverActions(next).map(action=>({id:action,label:riverActionLabel(action,c.locale)}))
 return {save:next,source:'author' as const,acceptedActionId:id}
}
