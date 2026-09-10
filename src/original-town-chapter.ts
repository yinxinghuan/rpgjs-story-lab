import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {LabError} from './journey-runtime'
export const townActions=[
 {id:'town-inspect',zh:'检查小城站台与广播电源',en:'Inspect the town platform and broadcast power'},
 {id:'town-grid-aid',zh:'供油恢复小城应急广播（燃料−6，人心+8）',en:'Fuel the town emergency broadcast (Fuel −6, Morale +8)'},
 {id:'town-keep-reserve',zh:'保留燃料给最后一段（人心−3）',en:'Keep the fuel for the final stretch (Morale −3)'},
 {id:'town-public-rules',zh:'公开危险物资岗位与乘客离站权利',en:'Make dangers, supplies, duties and passengers’ right to leave public'},
 {id:'town-emergency-command',zh:'保留紧急指挥并说明乘客离站权利',en:'Retain emergency command and state passengers’ right to leave'},
 {id:'town-repair',zh:'使用小城最后一组检修件加固列车',en:'Brace the train with the town’s final service fittings'},
 {id:'town-refuel',zh:'领取小城登记过的列车燃料',en:'Collect the town’s registered train fuel allocation'},
 {id:'town-use-diesel',zh:'把现有一桶铅封柴油转入油箱',en:'Transfer one owned sealed diesel can into the tank'},
 {id:'town-pack-kit',zh:'领取站台桥检工具箱',en:'Collect the platform bridge inspection kit'},
 {id:'town-rest',zh:'停留休息二十分钟（人心+6，洪水继续上涨）',en:'Rest for twenty minutes (Morale +6, floodwater rises)'},
 {id:'town-route-brief',zh:'核对站台线路板的过桥提示',en:'Check the bridge instructions on the platform route board'},
 {id:'town-depart',zh:'驶向枢纽外的洪水桥（燃料−6）',en:'Depart for the flood bridge outside the junction (Fuel −6)'},
] as const
export type TownActionId=typeof townActions[number]['id']
export const townLabel=(id:TownActionId,l:Locale)=>townActions.find(a=>a.id===id)![l]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
export const resolveTownAction=(text:string,l:Locale)=>townActions.find(a=>[a[l],a[l].replace(/\s*[（(][^()（）]*[）)]\s*$/,'')].some(label=>normalize(label)===normalize(text)))?.id
export const townBindingRules=townActions.map(a=>({id:a.id,effects:a.id==='town-depart'?[{type:'map',nodeId:'dawn-junction'}]:[]}))
export const townRejections=['ORIGINAL_TOWN_REQUIRED','ORIGINAL_TOWN_DONE','ORIGINAL_TOWN_INSPECTED','ORIGINAL_TOWN_UNINSPECTED','ORIGINAL_TOWN_AID_DECIDED','ORIGINAL_TOWN_AID_REQUIRED','ORIGINAL_TOWN_RULES_DECIDED','ORIGINAL_TOWN_RULES_REQUIRED','ORIGINAL_TOWN_PUBLIC_PROMISE','ORIGINAL_TOWN_REPAIR_UNAVAILABLE','ORIGINAL_TOWN_RESERVE_EMPTY','ORIGINAL_TOWN_DIESEL_REQUIRED','ORIGINAL_TOWN_TANK_SPACE_REQUIRED','ORIGINAL_TOWN_KIT_UNAVAILABLE','ORIGINAL_TOWN_RESTED','ORIGINAL_TOWN_ROUTE_CHECKED','ORIGINAL_TOWN_ROUTE_UNCHECKED','ORIGINAL_FUEL_REQUIRED','ORIGINAL_CONDITION_REQUIRED'] as const
export function townRejection(s:StorySave,id:TownActionId){
 const f=s.facts
 if(s.map.find(n=>n.current)?.id!=='sleeping-town')return 'ORIGINAL_TOWN_REQUIRED'
 if(f['chapter-town-complete'])return 'ORIGINAL_TOWN_DONE'
 if(id==='town-inspect')return f['town-inspected']?'ORIGINAL_TOWN_INSPECTED':undefined
 if(!f['town-inspected'])return 'ORIGINAL_TOWN_UNINSPECTED'
 if(id==='town-grid-aid'||id==='town-keep-reserve'){
  if(f['town-aid-policy'])return 'ORIGINAL_TOWN_AID_DECIDED'
  if(id==='town-grid-aid'&&s.stats.fuel<6)return 'ORIGINAL_FUEL_REQUIRED'
  return
 }
 if(id==='town-public-rules'||id==='town-emergency-command'){
  if(f['town-command-policy'])return 'ORIGINAL_TOWN_RULES_DECIDED'
  if(id==='town-emergency-command'&&f['passenger-rules-public'])return 'ORIGINAL_TOWN_PUBLIC_PROMISE'
  return
 }
 if(id==='town-repair')return f['town-repair-used']||s.stats.condition>=100?'ORIGINAL_TOWN_REPAIR_UNAVAILABLE':undefined
 if(id==='town-refuel')return f['town-reserve-used']?'ORIGINAL_TOWN_RESERVE_EMPTY':undefined
 if(id==='town-use-diesel'){
  if(!s.inventory.some(i=>i.id==='sealed-diesel'&&i.count>=1))return 'ORIGINAL_TOWN_DIESEL_REQUIRED'
  if(s.stats.fuel>80)return 'ORIGINAL_TOWN_TANK_SPACE_REQUIRED'
  return
 }
 if(id==='town-pack-kit')return f['town-kit-collected']||s.inventory.some(i=>i.id==='bridge-kit'&&i.count>0)?'ORIGINAL_TOWN_KIT_UNAVAILABLE':undefined
 if(id==='town-rest')return f['town-rested']?'ORIGINAL_TOWN_RESTED':undefined
 if(id==='town-route-brief')return f['town-route-checked']?'ORIGINAL_TOWN_ROUTE_CHECKED':undefined
 if(!f['town-aid-policy'])return 'ORIGINAL_TOWN_AID_REQUIRED'
 if(!f['town-command-policy'])return 'ORIGINAL_TOWN_RULES_REQUIRED'
 if(!f['town-route-checked'])return 'ORIGINAL_TOWN_ROUTE_UNCHECKED'
 if(s.stats.fuel<6)return 'ORIGINAL_FUEL_REQUIRED'
 if(s.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
}
export const availableTownActions=(s:StorySave)=>townActions.filter(a=>!townRejection(s,a.id)).map(a=>a.id)
export function executeTownTurn(save:StorySave,c:StoryCartridge,id:TownActionId){
 const error=townRejection(save,id);if(error)throw new LabError(error,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,commands:ParsedCommand[]=[]
 const fact=(key:string,value:string|number|boolean)=>commands.push({type:'fact',id:key,value})
 const stat=(key:string,delta:number)=>commands.push({type:'widget',id:key,operation:delta<0?'remove':'add',value:Math.abs(delta)})
 let text='',objective=''
 if(id==='town-inspect'){
  text=s('你查到站台灯接着独立蓄电池，应急广播的发电机却已断油。纸面登记显示居民已进入避难处，沉默并非无人。列车可以供出燃料恢复广播，也可以保留余量赶往洪水桥；阿达提醒，休息二十分钟能让人缓过来，但水位不会等你们。','The platform lights run on a separate battery, but the emergency broadcast generator has no fuel. A paper register records residents moving into shelter; silence does not mean abandonment. The train can supply the broadcast or keep its reserve for the flood bridge. Ada notes that twenty minutes of rest would help the crew, but the water will keep rising.')
  fact('town-inspected',true);objective=s('选择如何帮助小城，并准备列车最后一段','Decide how to help the town and prepare the final stretch')
 }
 if(id==='town-grid-aid'){
  text=s('你把约定的燃料接到应急发电机，广播重新播出避难处位置和桥前水位。列车的供油记录留在登记册上，沿线救援呼号也被交给你们；这次帮助有真实消耗。','You feed the agreed fuel to the emergency generator. Shelter locations and bridge-water warnings return to the broadcast. The train’s contribution is entered in the register and relief call signs are shared; this help consumes real fuel.')
  stat('fuel',-6);stat('morale',8);fact('town-aid-policy','broadcast');fact('aid-network-known',true)
 }
 if(id==='town-keep-reserve'){
  text=s('你保留油箱里的燃料，把避难处纸面位置逐节告知乘客。广播仍然沉默，有人看着发电机叹气；此前已经帮助过的站点与关系并没有因此消失。','You keep the fuel and relay the written shelter directions through the train. The broadcast stays silent and some passengers sigh at the generator; earlier aid and relationships are not erased.')
  stat('morale',-3);fact('town-aid-policy','reserve')
 }
 if(id==='town-public-rules'){
  const prior=save.facts['passenger-rules-public']===true
  text=s(prior?'你把此前公开过的危险、物资和岗位登记重新贴好，重申乘客可以在下一站离开；这是履行旧承诺，不是重新授予权利。':'你公开危险、物资和岗位登记，并明确每个人都能在下一站选择离开。乘客可以核对记录，也能追问路线决定；你把这份承诺留在车厢里。',prior?'You repost the already public danger, supply and duty records and reaffirm the right to leave at the next stop. This honors an existing promise rather than granting the right again.':'You make the danger, supply and duty records public and affirm everyone’s right to leave at the next stop. Passengers can check the records and question route decisions; the commitment stays posted in the carriage.')
  stat('morale',prior?2:8);fact('passenger-rules-public',true);fact('town-command-policy','public')
 }
 if(id==='town-emergency-command'){
  text=s('你说明最后一段仍由紧急指挥统一发令，但乘客可以拒绝继续同行、在下一站离开。大家知道这不是列车永久的归属，抵达枢纽后还要重新讨论。','You retain unified emergency orders for the final stretch while affirming passengers may decline to continue and leave at the next stop. This is not permanent ownership of the train; the junction will require another decision.')
  stat('morale',2);fact('town-command-policy','emergency')
 }
 if(id==='town-repair'){text=s('阿达用小城检修点最后一组固定件加固受损连接，登记后清空了备件架。','Ada braces the damaged coupling with the town’s final service fittings, records their use and empties the parts rack.');stat('condition',20);fact('town-repair-used',true)}
 if(id==='town-refuel'){text=s('你领取登记册为过路列车保留的最后一份柴油，签完记录后油桶归空。','You collect the final diesel allocation reserved for passing trains and sign the register; the barrel is empty afterward.');stat('fuel',16);fact('town-reserve-used',true)}
 if(id==='town-use-diesel'){
  const item=save.inventory.find(i=>i.id==='sealed-diesel')!
  text=s('你拆开物资舱中实际保留的一桶铅封柴油，把它全部转入列车油箱。空桶退出可用库存；它不是小城新发的物资。','You open one sealed diesel can actually retained in the supply bay and transfer all of it to the train tank. The empty can leaves usable inventory; it is not a new town reward.')
  commands.push({type:'inventory',action:'remove',itemId:item.id,item:item.label,count:1});stat('fuel',20)
 }
 if(id==='town-pack-kit'){
  text=s('你按登记取走站台唯一一份桥检工具箱，核过钢索夹、探伤锤和两枚短路信号器。箱子现在随列车携带，需要在桥前明确使用才会发挥作用。','You sign out the platform’s only bridge inspection kit, checking its cable clamps, sounding hammer and two signal lamps. It travels with the train and must be explicitly used at the bridge.')
  commands.push({type:'inventory',action:'add',itemId:'bridge-kit',item:s('桥检工具箱','Bridge Inspection Kit'),count:1,rarity:'rare',detail:s('钢索夹、探伤锤和两枚短路信号器','Cable clamps, sounding hammer and two signal lamps'),effect:s('用于一次桥梁检查，使用后消耗','For one bridge inspection; consumed on use')});fact('town-kit-collected',true)
 }
 if(id==='town-rest'){
  text=s('列车停留二十分钟，大家轮流喝水、松开紧绷的手。再次望向线路板时，桥前水位的标记已经上移；恢复的精神伴随着更紧的过桥窗口。','The train waits twenty minutes while people drink and loosen their cramped hands. When they look again, the bridge-water marker has risen. The recovered morale comes with a tighter crossing window.')
  stat('morale',6);fact('town-rested',true);commands.push({type:'clock',value:s('第1夜 · 04:38','Night 1 · 04:38')})
 }
 if(id==='town-route-brief'){
  text=s('你从站台线路板抄下洪水桥入口、近岸检修台和枢纽内侧的警冲标。提示明确写着：看到桥不等于已经过桥，必须先核实支撑、人员和剩余手段；列车的最后归属只能抵达后决定。','You copy the flood bridge entrance, near-bank service platform and junction-side clearance marker from the route board. Its instructions distinguish reaching the bridge from crossing it: supports, people and remaining options must be checked before the train’s future can be decided after arrival.')
  fact('town-route-checked',true)
 }
 if(id==='town-depart'){
  text=s('列车离开小城，停在黎明枢纽外侧洪水桥的近岸检修台。枢纽灯光仍隔着水面，车轮尚未踏上桥面；这不是已经抵达终点。','The train leaves town and stops at the near-bank service platform of the flood bridge outside Dawn Junction. The junction lights remain across the water; the wheels have not reached the deck. This is not final arrival.')
  stat('fuel',-6);fact('chapter-town-complete',true);fact('bridge-approach-reached',true)
  commands.push({type:'map_update',location:c.initialMap.find(n=>n.id==='dawn-junction')!.label},{type:'clock',value:s(save.facts['town-rested']?'第1夜 · 04:48':'第1夜 · 04:28',save.facts['town-rested']?'Night 1 · 04:48':'Night 1 · 04:28')},{type:'encounter',phase:'warning',kind:s('终点洪水桥','Final flood bridge'),severity:save.facts['town-rested']?3:2})
  objective=s('在近岸核实洪水桥，保留人员与列车的最后选择','Inspect the flood bridge from the near bank and preserve the last choices for people and train')
 }
 if(objective)commands.push({type:'state',value:objective})
 const next=applyParsedScene(structuredClone(save),{blocks:[{id:`town-${save.scene+1}-${id}`,kind:'event',text}],commands,raw:text},c,townLabel(id,c.locale));next.choices=availableTownActions(next).map(a=>({id:a,label:townLabel(a,c.locale)}))
 return {save:next,source:'author' as const,acceptedActionId:id}
}
