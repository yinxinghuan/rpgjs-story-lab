import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {LabError} from './journey-runtime'
export const pineActions=[
 {id:'pine-inspect',zh:'检查林线信号与新鲜轮痕',en:'Inspect the forest signal and fresh wheel marks'},
 {id:'pine-reverse',zh:'紧急倒车避让货车（车况−12，人心−2）',en:'Reverse to avoid the freight cars (Condition −12, Morale −2)'},
 {id:'pine-confirm-siding',zh:'确认已解锁侧线的安全位置',en:'Confirm the safe position on the unlocked siding'},
 {id:'pine-meet',zh:'打开敲门声传来的救援车',en:'Open the rescue car where the knocking comes from'},
 {id:'pine-survey-route',zh:'与林澈核对木场线路簿',en:'Check the timber route book with Lin'},
 {id:'pine-invite',zh:'邀请林澈同行负责巡检',en:'Invite Lin aboard to inspect the route'},
 {id:'pine-stay',zh:'让林澈留守信号点',en:'Have Lin remain at the signal post'},
 {id:'pine-refuel',zh:'抽取林线检修点的最后一份柴油',en:'Pump the forest maintenance point’s last diesel reserve'},
 {id:'pine-stabilize',zh:'请阿达用林线检修件加固列车',en:'Ask Ada to brace the train with forest maintenance fittings'},
 {id:'pine-depart',zh:'沿核实的线路前往白石隧道（燃料−4）',en:'Follow the verified route to White Stone Tunnel (Fuel −4)'},
] as const
export type PineActionId=typeof pineActions[number]['id']
export const pineLabel=(id:PineActionId,l:Locale)=>pineActions.find(a=>a.id===id)![l]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
export const resolvePineAction=(text:string,l:Locale)=>pineActions.find(a=>[a[l],a[l].replace(/\s*[（(][^()（）]*[）)]\s*$/,'')].some(label=>normalize(label)===normalize(text)))?.id
export const pineBindingRules=pineActions.map(a=>({id:a.id,effects:a.id==='pine-depart'?[{type:'map',nodeId:'tunnel'}]:[]}))
// A global key fact from another location is not proof of this siding being opened.
export const pineSidingOpened=(s:StorySave)=>s.facts['pine-inspected']===true&&Number(s.facts['switch-key-uses']??0)>Number(s.facts['pine-key-uses-before']??0)&&s.facts['hidden-route-open']===true&&s.danger.phase==='calm'
export const pineRejections=['ORIGINAL_PINE_REQUIRED','ORIGINAL_PINE_DONE','ORIGINAL_PINE_INSPECTED','ORIGINAL_PINE_UNINSPECTED','ORIGINAL_PINE_DECIDED','ORIGINAL_PINE_UNDECIDED','ORIGINAL_PINE_SIDING_CLOSED','ORIGINAL_PINE_ALREADY_MET','ORIGINAL_PINE_NOT_MET','ORIGINAL_PINE_ROUTE_CHECKED','ORIGINAL_PINE_ROUTE_UNCHECKED','ORIGINAL_PINE_ESCORT_DECIDED','ORIGINAL_PINE_ESCORT_UNDECIDED','ORIGINAL_PINE_RESERVE_EMPTY','ORIGINAL_PINE_BRACING_UNAVAILABLE','ORIGINAL_FUEL_REQUIRED','ORIGINAL_CONDITION_REQUIRED'] as const
export function pineRejection(s:StorySave,id:PineActionId){
 const f=s.facts
 if(s.map.find(n=>n.current)?.id!=='pine-line')return 'ORIGINAL_PINE_REQUIRED'
 if(f['chapter-pine-complete'])return 'ORIGINAL_PINE_DONE'
 if(id==='pine-refuel')return f['pine-reserve-used']?'ORIGINAL_PINE_RESERVE_EMPTY':undefined
 if(id==='pine-stabilize')return f['pine-bracing-used']||s.stats.condition>=20?'ORIGINAL_PINE_BRACING_UNAVAILABLE':undefined
 if(id==='pine-inspect')return f['pine-inspected']?'ORIGINAL_PINE_INSPECTED':undefined
 if(!f['pine-inspected'])return 'ORIGINAL_PINE_UNINSPECTED'
 if(id==='pine-reverse'||id==='pine-confirm-siding'){
  if(f['pine-clear-method']||id==='pine-reverse'&&pineSidingOpened(s))return 'ORIGINAL_PINE_DECIDED'
  if(id==='pine-confirm-siding'&&!pineSidingOpened(s))return 'ORIGINAL_PINE_SIDING_CLOSED'
  if(id==='pine-reverse'&&s.stats.condition<12)return 'ORIGINAL_CONDITION_REQUIRED'
  return
 }
 if(!f['pine-clear-method'])return 'ORIGINAL_PINE_UNDECIDED'
 if(id==='pine-meet')return f['pine-met']?'ORIGINAL_PINE_ALREADY_MET':undefined
 if(!f['pine-met'])return 'ORIGINAL_PINE_NOT_MET'
 if(id==='pine-survey-route')return f['pine-route-checked']?'ORIGINAL_PINE_ROUTE_CHECKED':undefined
 if(!f['pine-route-checked'])return 'ORIGINAL_PINE_ROUTE_UNCHECKED'
 if(id==='pine-invite'||id==='pine-stay')return f['pine-escort-decision']?'ORIGINAL_PINE_ESCORT_DECIDED':undefined
 if(!f['pine-escort-decision'])return 'ORIGINAL_PINE_ESCORT_UNDECIDED'
 if(s.stats.fuel<4)return 'ORIGINAL_FUEL_REQUIRED'
 if(s.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
}
export const availablePineActions=(s:StorySave)=>pineActions.filter(a=>!pineRejection(s,a.id)).map(a=>a.id)
/** Additional physical cost check for an accepted source-v8 key rule only.
 * Rejected legacy source actions keep their original receipts and semantics. */
export function assertPineSourceAction(s:StorySave,action:string){
 if(action!=='use-master-switch-key'||s.map.find(n=>n.current)?.id!=='pine-line')return
 if(!s.facts['pine-inspected'])throw new LabError('ORIGINAL_PINE_UNINSPECTED',409)
 if(s.facts['pine-clear-method']||pineSidingOpened(s))throw new LabError('ORIGINAL_PINE_DECIDED',409)
 if(s.stats.fuel<8)throw new LabError('ORIGINAL_FUEL_REQUIRED',409)
 if(s.stats.condition<=0)throw new LabError('ORIGINAL_CONDITION_REQUIRED',409)
}
export function pineChoices(s:StorySave,c:StoryCartridge){
 const choices:StorySave['choices']=availablePineActions(s).map(id=>({id,label:pineLabel(id,c.locale)}))
 if(s.facts['pine-inspected']&&!s.facts['pine-clear-method']&&!pineSidingOpened(s)&&s.stats.fuel>=8&&s.stats.condition>0&&Number(s.facts['switch-key-uses']??0)<3&&s.inventory.some(i=>i.id==='master-switch-key'&&i.count>0)&&['warning','confrontation'].includes(s.danger.phase)){
  const rule=c.domainRules!.rules.find(r=>r.id==='use-master-switch-key')!
  choices.splice(0,0,{id:rule.id,label:rule.match[0]+(c.locale==='zh'?'（燃料−8，覆盖次数−1）':' (Fuel −8, Overrides −1)')})
 }
 return choices
}
export function executePineTurn(save:StorySave,c:StoryCartridge,id:PineActionId){
 const error=pineRejection(save,id);if(error)throw new LabError(error,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,commands:ParsedCommand[]=[],lin=c.characters.find(p=>p.id==='lin-scout')!
 const fact=(key:string,value:string|number|boolean)=>commands.push({type:'fact',id:key,value})
 const stat=(key:string,delta:number)=>commands.push({type:'widget',id:key,operation:delta<0?'remove':'add',value:Math.abs(delta)})
 let text='',objective=''
 if(id==='pine-inspect'){
  text=s('信号杆被扳成安全，线路却没有回电；湿枕木的新鲜轮痕指向弯道，一组货车正缓慢倒退。阿达指出两条退路：紧急倒车会损伤连接架并惊动乘客；用总调度钥匙切入侧线要烧掉一份燃料、折断一枚黄铜齿，但能保住车况。旁边救援车里传来敲门声，必须先让列车避开货车才能过去。','The signal reads safe but its circuit is dead. Fresh wheel marks lead toward cars rolling backward around the bend. Ada identifies two escapes: reversing strains the coupling and frightens passengers; keying the siding burns fuel and one brass tooth but preserves the train. Knocking comes from a rescue car nearby. The train must clear the freight cars before anyone can reach it.')
  fact('pine-inspected',true);fact('pine-key-uses-before',Number(save.facts['switch-key-uses']??0));commands.push({type:'encounter',phase:'warning',kind:s('林线倒退货车','Reversing freight on the forest line'),severity:3})
  objective=s('在车况与燃料、钥匙次数之间选择避让方式','Choose whether to spend train condition or fuel and a key override')
 }
 if(id==='pine-reverse'){
  text=s('你让列车退到止轮标后。连接架在急收力时发出裂响，乘客扶住行李；倒退的货车擦过前方道口，在缓冲土堆前停下。去救援车的检修小径现在可以通行。','You reverse behind the stop marker. The coupling cracks under the sudden load and passengers brace their bags. The freight cars roll past the crossing and stop at an earth buffer. The service path to the rescue car is clear.')
  stat('condition',-12);stat('morale',-2);fact('pine-clear-method','reverse');commands.push({type:'encounter',phase:'resolution',kind:s('林线倒退货车','Reversing freight on the forest line'),outcome:'costly-success'})
 }
 if(id==='pine-confirm-siding'){
  text=s('阿达确认车轮完全越过侧线警冲标，货车从主轨经过，在土堆前停下。折断的钥匙齿和已经烧掉的燃料不会恢复；你锁定停车位置，沿检修小径走向仍有人敲门的救援车。','Ada confirms every wheel is beyond the siding clearance marker. The freight cars pass on the main track and stop at the earth buffer. The spent key tooth and fuel stay spent. You secure the train and take the service path toward the knocking.')
  fact('pine-clear-method','siding')
 }
 if(id==='pine-meet'){
  text=s('车门里侧的卡扣被震弯了。你从外侧松开固定销，一个穿着湿透巡检服、护着线路簿的人侧身出来：“林澈，线路巡检员。倒车时门扣卡死，电台也只剩断续呼号。”他想把木场侧线的实际路况交给这列车，免得下一班再相信假信号。','The inner door catch is bent. You release its outer pin and a person in a soaked inspection uniform steps out, shielding a route book. “Lin, track inspector. The catch jammed when the car rolled back; my radio could only send fragments.” He wants this train to carry the verified timber-line conditions so the next crew will not trust the false signal.')
  commands.push({type:'character_update',characterId:lin.id,character:lin.name});fact('pine-met',true)
  objective=s('和林澈核对实际线路，再决定同行安排','Verify the route with Lin, then decide whether he joins the train')
 }
 if(id==='pine-survey-route'){
  text=s('林澈把线路簿压在检修箱上，逐个对照道岔和坡度标。他指出木场侧线曾因无人值守而封闭，并标出接回白石隧道的安全联络线；你让他把实测记录签在车上路册里，不用猜测替代巡检。','Lin lays the book on a service box and checks each switch and grade marker. The timber siding was closed because no one staffed it. He marks the safe connection to White Stone Tunnel and signs the train’s route ledger with observations rather than guesses.')
  fact('pine-route-checked',true);fact('timber-route-known',true);commands.push({type:'reputation',npc:lin.name,action:'trusted-route-survey'})
 }
 if(id==='pine-invite'){
  text=s('林澈锁住信号杆、挂好失效标，带着线路簿登车：“接下来的巡检我来做。”阿达把前端观察位置交给他，原有伙伴仍留在各自岗位。','Lin locks the signal lever, tags it out and boards with the route book. “I’ll inspect the route ahead.” Ada makes room at the forward observation post; the existing crew retain their duties.')
  commands.push({type:'party_change',characterId:lin.id,character:lin.name,change:'add'});fact('pine-escort-decision','joined')
 }
 if(id==='pine-stay'){
  text=s('林澈把核实过的记录留给列车，自己回到信号杆旁，准备向后续来车示警。你们约定列车由现有成员带队；他继续守在黑松，没有悄悄登车。','Lin gives the verified record to the train and returns to the signal to warn later arrivals. Your existing crew will lead onward; he remains at Black Pine.')
  fact('pine-escort-decision','stayed')
 }
 if(id==='pine-refuel'){
  text=s('你把检修点最后一份柴油泵入列车，储罐见底。','You pump the maintenance point’s last diesel into the train. The tank runs dry.');stat('fuel',12);fact('pine-reserve-used',true)
 }
 if(id==='pine-stabilize'){
  text=s('阿达用检修箱里最后一组固定件加固连接架，列车恢复低速牵引。','Ada braces the coupling with the service box’s final fittings, restoring low-speed traction.');stat('condition',20);fact('pine-bracing-used',true)
 }
 if(id==='pine-depart'){
  text=s('列车沿路册核实过的联络线离开黑松。白石隧道的入口出现在灯光里，停转的通风机后有烟涌出；你带来的人员、物资和此前的代价都跟着列车进入下一段。','The train follows the verified connection out of Black Pine. White Stone Tunnel appears in the headlamp, smoke emerging behind its stopped fan. Your crew, supplies and the costs already paid carry into the next stage.')
  stat('fuel',-4);fact('chapter-pine-complete',true);fact('chapter-dead-station-complete',true)
  commands.push({type:'map_update',location:c.initialMap.find(n=>n.id==='tunnel')!.label},{type:'encounter',phase:'warning',kind:s('白石隧道烟雾','Smoke in White Stone Tunnel'),severity:2})
  objective=s('查明隧道烟源，决定怎样带队通过','Identify the tunnel smoke and decide how to bring the crew through')
 }
 if(objective)commands.push({type:'state',value:objective})
 const next=applyParsedScene(structuredClone(save),{blocks:[{id:`pine-${save.scene+1}-${id}`,kind:'event',text}],commands,raw:text},c,pineLabel(id,c.locale))
 next.choices=pineChoices(next,c)
 return {save:next,source:'author' as const,acceptedActionId:id}
}
