import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
import {LabError} from './journey-runtime'
export const bridgeActions=[
 {id:'bridge-inspect',zh:'检查近岸桥台与水位',en:'Inspect the near-bank supports and flood level'},
 {id:'bridge-kit-survey',zh:'使用现有桥检工具箱勘测（工具箱−1）',en:'Survey with the owned bridge kit (Kit −1)'},
 {id:'bridge-manual-survey',zh:'沿近岸检修道人工勘测',en:'Survey manually from the near-bank service walk'},
 {id:'bridge-arrange',zh:'按既有名单安排过桥顺序',en:'Arrange the crossing order from the existing passenger list'},
 {id:'bridge-rail-crossing',zh:'按勘测结果带列车过主桥',en:'Take the train over the surveyed main bridge'},
 {id:'bridge-key-crossing',zh:'用总调度钥匙通过桥侧维修线（燃料−8，覆盖−1）',en:'Cross the bridge maintenance line with the master key (Fuel −8, Override −1)'},
 {id:'bridge-anchor-crossing',zh:'固定列车供人步行过桥（永久失去行驶能力）',en:'Anchor the train for a crossing on foot (Train permanently immobilized)'},
 {id:'bridge-refuel',zh:'抽取近岸最后一份检修柴油',en:'Pump the near bank’s last service diesel'},
 {id:'bridge-stabilize',zh:'请阿达用近岸固定件加固列车',en:'Ask Ada to brace the train with near-bank fittings'},
] as const
export type BridgeActionId=typeof bridgeActions[number]['id']
export const bridgeLabel=(id:BridgeActionId,l:Locale)=>bridgeActions.find(a=>a.id===id)![l]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
const keyResolution=(s:StorySave,c:StoryCartridge)=>resolveDomainAction(s,c,c.domainRules!.rules.find(r=>r.id==='use-master-switch-key')!.match[0])!
const hasLin=(s:StorySave)=>s.facts['pine-route-checked']===true&&s.partyMemberIds.includes('lin-scout')&&s.characters.some(c=>c.id==='lin-scout'&&c.status==='companion')
export const bridgeRailCost=(s:StorySave)=>({fuel:(s.facts['town-rested']?8:6)-(hasLin(s)?2:0),condition:(s.facts['town-rested']?12:8)-(s.facts['bridge-survey']==='kit'?4:0)})
export const bridgeBindingRules=bridgeActions.map(a=>({id:a.id,effects:[]}))
export const bridgeRejections=['ORIGINAL_BRIDGE_APPROACH_REQUIRED','ORIGINAL_BRIDGE_DONE','ORIGINAL_FINAL_BRIDGE_INSPECTED','ORIGINAL_FINAL_BRIDGE_UNINSPECTED','ORIGINAL_BRIDGE_SURVEYED','ORIGINAL_BRIDGE_UNSURVEYED','ORIGINAL_BRIDGE_KIT_REQUIRED','ORIGINAL_BRIDGE_ARRANGED','ORIGINAL_BRIDGE_UNARRANGED','ORIGINAL_BRIDGE_KEY_UNAVAILABLE','ORIGINAL_BRIDGE_ANCHOR_NOT_REQUIRED','ORIGINAL_BRIDGE_RESERVE_EMPTY','ORIGINAL_BRIDGE_BRACING_UNAVAILABLE','ORIGINAL_FUEL_REQUIRED','ORIGINAL_CONDITION_REQUIRED'] as const
export function bridgeRejection(s:StorySave,id:BridgeActionId,c:StoryCartridge){
 const f=s.facts
 if(s.map.find(n=>n.current)?.id!=='dawn-junction'||!f['bridge-approach-reached'])return 'ORIGINAL_BRIDGE_APPROACH_REQUIRED'
 if(f['chapter-bridge-complete'])return 'ORIGINAL_BRIDGE_DONE'
 if(id==='bridge-refuel')return f['bridge-reserve-used']?'ORIGINAL_BRIDGE_RESERVE_EMPTY':undefined
 if(id==='bridge-stabilize')return f['bridge-bracing-used']||s.stats.condition>=20?'ORIGINAL_BRIDGE_BRACING_UNAVAILABLE':undefined
 if(id==='bridge-inspect')return f['bridge-inspected']?'ORIGINAL_FINAL_BRIDGE_INSPECTED':undefined
 if(!f['bridge-inspected'])return 'ORIGINAL_FINAL_BRIDGE_UNINSPECTED'
 if(id==='bridge-kit-survey'||id==='bridge-manual-survey'){
  if(f['bridge-survey'])return 'ORIGINAL_BRIDGE_SURVEYED'
  if(id==='bridge-kit-survey'&&!s.inventory.some(i=>i.id==='bridge-kit'&&i.count>=1))return 'ORIGINAL_BRIDGE_KIT_REQUIRED'
  return
 }
 if(!f['bridge-survey'])return 'ORIGINAL_BRIDGE_UNSURVEYED'
 if(id==='bridge-arrange')return f['bridge-passengers-arranged']?'ORIGINAL_BRIDGE_ARRANGED':undefined
 if(!f['bridge-passengers-arranged'])return 'ORIGINAL_BRIDGE_UNARRANGED'
 if(id==='bridge-anchor-crossing')return s.stats.condition>65?'ORIGINAL_BRIDGE_ANCHOR_NOT_REQUIRED':undefined
 if(id==='bridge-key-crossing'){
  if(keyResolution(s,c).status!=='accepted')return 'ORIGINAL_BRIDGE_KEY_UNAVAILABLE'
  if(s.stats.fuel<8)return 'ORIGINAL_FUEL_REQUIRED'
  if(s.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
  return
 }
 const cost=bridgeRailCost(s)
 if(s.stats.fuel<cost.fuel)return 'ORIGINAL_FUEL_REQUIRED'
 if(s.stats.condition<cost.condition)return 'ORIGINAL_CONDITION_REQUIRED'
}
export function bridgeChoices(s:StorySave,c:StoryCartridge){return bridgeActions.filter(a=>!bridgeRejection(s,a.id,c)).map(a=>{const cost=bridgeRailCost(s);return {id:a.id,label:a[c.locale]+(a.id==='bridge-rail-crossing'?(c.locale==='zh'?`（燃料−${cost.fuel}，车况−${cost.condition}）`:` (Fuel −${cost.fuel}, Condition −${cost.condition})`):'')}})}
export function resolveBridgeAction(text:string,l:Locale,s?:StorySave,c?:StoryCartridge){
 const direct=bridgeActions.find(a=>[a[l],a[l].replace(/\s*[（(][^()（）]*[）)]\s*$/,''),...(s&&c?bridgeChoices(s,c).filter(choice=>choice.id===a.id).map(choice=>choice.label):[])].some(label=>normalize(label)===normalize(text)))?.id
 if(direct)return direct
 if(s&&c&&s.facts['bridge-approach-reached']&&!s.facts['chapter-bridge-complete']&&c.domainRules!.rules.find(r=>r.id==='use-master-switch-key')!.match.some(label=>normalize(label)===normalize(text)))return 'bridge-key-crossing'
}
/** Convert the frozen source key resolution, not player text, into one authored
 * reducer call. Unexpected new effect kinds fail closed instead of being dropped. */
function sourceKeyCommands(s:StorySave,c:StoryCartridge):ParsedCommand[]{
 const resolution=keyResolution(s,c);if(resolution.status!=='accepted')throw new LabError('ORIGINAL_BRIDGE_KEY_UNAVAILABLE',409)
 return resolution.effects.map(e=>{
  if(e.type==='stat')return {type:'widget',id:e.id,operation:e.delta<0?'remove':'add',value:Math.abs(e.delta)}
  if(e.type==='fact')return {type:'fact',id:e.id,value:e.value}
  if(e.type==='fact-add')return {type:'fact',id:e.id,value:Number(s.facts[e.id]??0)+e.delta}
  if(e.type==='danger')return {type:'encounter',phase:'resolution',outcome:e.outcome}
  throw new LabError('ORIGINAL_BRIDGE_KEY_UNAVAILABLE',409)
 })
}
export function executeBridgeTurn(save:StorySave,c:StoryCartridge,id:BridgeActionId){
 const error=bridgeRejection(save,id,c);if(error)throw new LabError(error,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,commands:ParsedCommand[]=[]
 const fact=(key:string,value:string|number|boolean)=>commands.push({type:'fact',id:key,value})
 const stat=(key:string,delta:number)=>commands.push({type:'widget',id:key,operation:delta<0?'remove':'add',value:Math.abs(delta)})
 let text='',objective=''
 if(id==='bridge-inspect'){
  text=s('你在近岸发现主桥护轨已经松动，但承重梁仍连续；维修侧线沿另一组桥台通向彼岸。阿达提出先勘测再安排人员。现有桥检箱能减轻列车受损，同行巡检员能少走耗油试探；水位越高，主桥代价越大。若车况已经很差，可永久固定列车为步行渡桥，保人却不再保留整列行驶能力。','The near-bank guard rails are loose, but the main load-bearing beams remain continuous. A maintenance line follows separate piers. Ada calls for a survey and passenger order. An owned bridge kit reduces train damage, a traveling inspector saves probing fuel, and higher water makes the main bridge costlier. If the train is already badly damaged, it can be permanently anchored as a foot crossing, saving people while ending its ability to travel.')
  fact('bridge-inspected',true);commands.push({type:'encounter',phase:'confrontation',kind:s('终点洪水桥','Final flood bridge'),severity:save.facts['town-rested']?3:2});objective=s('勘测可用桥面，安排人员后选择过桥方式','Survey the usable crossing and arrange people before choosing a method')
 }
 if(id==='bridge-kit-survey'||id==='bridge-manual-survey'){
  const kit=id==='bridge-kit-survey'
  text=kit?s('阿达用箱里的钢索夹固定护轨，探伤锤标出可承重的位置。工具箱的耗材全部投入这一次检查；主桥的车损代价因此降低。','Ada uses the kit’s clamps to secure the guard rail and the sounding hammer to mark load-bearing positions. Its consumables go into this inspection, reducing the main crossing’s train damage.'):s('你们沿检修道逐段敲击、对照水痕，找到还能使用的连续梁面。没有额外夹具，列车通过时必须承受完整的车损代价。','You tap along the service walk and compare water marks to find continuous beams. Without extra clamps, the train must bear the full crossing damage.')
  if(kit){const item=save.inventory.find(i=>i.id==='bridge-kit')!;commands.push({type:'inventory',action:'remove',itemId:item.id,item:item.label,count:1})}
  fact('bridge-survey',kit?'kit':'manual')
 }
 if(id==='bridge-arrange'){
  text=s('你按既有名单安排通行顺序，现有同伴各自守住已经承担的岗位。大家先在近岸准备，尚未跨到彼岸；行囊与急需物品随各自携带者登记，没有遗失的人被悄悄补回。','You arrange crossing order from the existing list, with current companions holding their established duties. Everyone prepares on the near bank; no one is on the far side yet. Bags and essentials stay registered with their carriers, and no missing person is silently restored.')
  fact('bridge-passengers-arranged',true)
 }
 if(id==='bridge-refuel'){text=s('你抽尽近岸检修台最后一份柴油，空罐留给后续登记。','You pump the near-bank service platform’s last diesel, leaving the empty tank recorded.');stat('fuel',12);fact('bridge-reserve-used',true)}
 if(id==='bridge-stabilize'){text=s('阿达用近岸最后一组固定件加固连接架，恢复低速牵引。','Ada braces the coupling with the near bank’s final fittings, restoring low-speed traction.');stat('condition',20);fact('bridge-bracing-used',true)}
 if(['bridge-rail-crossing','bridge-key-crossing','bridge-anchor-crossing'].includes(id)){
  const anchor=id==='bridge-anchor-crossing',key=id==='bridge-key-crossing'
  if(key){commands.push(...sourceKeyCommands(save,c));text=s('你按原钥匙的剩余次数开通维修侧线，一枚黄铜齿折断。列车用掉这次牵引燃料，沿独立桥台驶到枢纽内侧警冲标；人员、物资和列车都到了彼岸。','You use a remaining master-key override to open the maintenance line; one brass tooth shears. The train spends the required fuel and follows the separate piers beyond the junction clearance marker. People, supplies and train reach the far bank.')}
  else if(anchor){stat('condition',-20);text=s('阿达关闭牵引，用桥侧固定座锁住两节车厢，搭出步行通道。你们按名单转移人员与可携物资，到彼岸再次核对。列车永久留在缺口，不能靠补油重新开走；抵达枢纽的是这支队伍。','Ada shuts down traction and locks the two carriages to the bridge anchors as a foot crossing. You transfer people and portable supplies in the recorded order and count again on the far bank. The train remains permanently in the gap; refueling cannot make it leave. The crew are what reaches the junction.')}
  else{const cost=bridgeRailCost(save);stat('fuel',-cost.fuel);stat('condition',-cost.condition);text=s('列车按勘测标记低速走过主桥，护轨擦响，连接处承受了已说明的损伤。最后一节车厢越过彼岸警冲标，大家按名单再次应答；没有把旧有损失改写成完好无缺。','The train follows the surveyed marks slowly across the main bridge. Guard rails scrape and the coupling bears the stated damage. The final carriage clears the far-bank marker and everyone answers the roll again; earlier losses remain losses.')}
  fact('bridge-method',anchor?'anchor':key?'key':'rail');fact('bridge-train-fate',anchor?'anchored':'preserved');fact('chapter-bridge-complete',true);fact('junction-arrived',true)
  commands.push({type:'encounter',phase:'resolution',kind:s('终点洪水桥','Final flood bridge'),outcome:anchor?'costly-success':'success'})
  objective=s('在枢纽决定列车与队伍的最终归属','At the junction, decide the future of the train and crew')
 }
 if(objective)commands.push({type:'state',value:objective})
 const next=applyParsedScene(structuredClone(save),{blocks:[{id:`bridge-${save.scene+1}-${id}`,kind:'event',text}],commands,raw:text},c,bridgeLabel(id,c.locale));next.choices=bridgeChoices(next,c)
 return {save:next,source:'author' as const,acceptedActionId:id}
}
