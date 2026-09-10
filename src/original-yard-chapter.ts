import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {LabError} from './journey-runtime'
export const yardActions=[
 {id:'yard-meet',zh:'在栅门前说明列车来意',en:'Explain the train’s purpose at the gate'},
 {id:'yard-medical-pact',zh:'请任医生提出诊疗合作',en:'Ask Doctor Ren to offer medical cooperation'},
 {id:'yard-work-pact',zh:'与阿达修泵换取燃料（车况−6）',en:'Repair the pump with Ada for fuel (Condition −6)'},
 {id:'yard-force-pump',zh:'强开泵台取得燃料（车况−12，人心−8）',en:'Force the pump open for fuel (Condition −12, Morale −8)'},
 {id:'yard-stabilize',zh:'请阿达用泵台固定件加固列车',en:'Ask Ada to brace the train with pump fittings'},
 {id:'yard-starting-reserve',zh:'登记领取货场起步储备',en:'Register for the yard starting reserve'},
 {id:'yard-first-exit',zh:'沿采石场联络线前往白石隧道（燃料−4）',en:'Take the quarry connecting line to White Stone Tunnel (Fuel −4)'},
 {id:'yard-route-brief',zh:'与玛柯核对上山线路',en:'Review the mountain route with Mako'},
 {id:'yard-invite',zh:'邀请玛柯同行交接山口岗位',en:'Invite Mako to accompany the train to the pass'},
 {id:'yard-stay',zh:'让玛柯留守货场',en:'Have Mako remain at the yard'},
 {id:'yard-depart',zh:'驶向山口线（燃料−6）',en:'Depart for Mountain Pass (Fuel −6)'},
] as const
export type YardActionId=typeof yardActions[number]['id']
export const yardLabel=(id:YardActionId,l:Locale)=>yardActions.find(a=>a.id===id)![l]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
export const resolveYardAction=(text:string,l:Locale)=>yardActions.find(d=>[d[l],d[l].replace(/\s*[（(][^()（）]*[）)]\s*$/,'')].some(label=>normalize(label)===normalize(text)))?.id
export const yardBindingRules=yardActions.map(a=>({id:a.id,effects:a.id==='yard-first-exit'?[{type:'map',nodeId:'tunnel'}]:a.id==='yard-depart'?[{type:'map',nodeId:'mountain-pass'}]:[]}))
export const yardRejections=['ORIGINAL_YARD_REQUIRED','ORIGINAL_YARD_DONE','ORIGINAL_YARD_ALREADY_MET','ORIGINAL_YARD_NOT_MET','ORIGINAL_YARD_SETTLED','ORIGINAL_YARD_UNSETTLED','ORIGINAL_DOCTOR_REQUIRED','ORIGINAL_FUEL_REQUIRED','ORIGINAL_CONDITION_REQUIRED','ORIGINAL_YARD_BRACING_UNAVAILABLE','ORIGINAL_YARD_RESERVE_UNAVAILABLE','ORIGINAL_TUNNEL_REQUIRED_FIRST','ORIGINAL_YARD_FIRST_EXIT_DONE','ORIGINAL_YARD_BRIEFED','ORIGINAL_YARD_UNBRIEFED','ORIGINAL_YARD_ESCORT_DECIDED','ORIGINAL_YARD_ESCORT_UNDECIDED','ORIGINAL_YARD_HOSTILE'] as const
export function yardRejection(save:StorySave,id:YardActionId){
 const f=save.facts
 if(save.map.find(n=>n.current)?.id!=='graystone-yard')return 'ORIGINAL_YARD_REQUIRED'
 if(f['chapter-yard-complete'])return 'ORIGINAL_YARD_DONE'
 if(id==='yard-meet')return f['yard-met']?'ORIGINAL_YARD_ALREADY_MET':undefined
 if(id==='yard-stabilize')return f['yard-bracing-used']||save.stats.condition>=20?'ORIGINAL_YARD_BRACING_UNAVAILABLE':undefined
 if(!f['yard-met'])return 'ORIGINAL_YARD_NOT_MET'
 if(['yard-medical-pact','yard-work-pact','yard-force-pump'].includes(id)){
  if(f['yard-agreement'])return 'ORIGINAL_YARD_SETTLED'
  if(id==='yard-medical-pact'&&(!save.partyMemberIds.includes('ren-medic')||!save.characters.some(c=>c.id==='ren-medic'&&c.status==='companion')))return 'ORIGINAL_DOCTOR_REQUIRED'
  if(id==='yard-work-pact'&&save.stats.condition<6||id==='yard-force-pump'&&save.stats.condition<12)return 'ORIGINAL_CONDITION_REQUIRED'
  return
 }
 if(!f['yard-agreement'])return 'ORIGINAL_YARD_UNSETTLED'
 if(id==='yard-starting-reserve')return f['yard-starting-reserve-used']||save.stats.fuel>=6?'ORIGINAL_YARD_RESERVE_UNAVAILABLE':undefined
 if(id==='yard-first-exit'){
  if(f['chapter-tunnel-complete']||f['yard-first-exit'])return 'ORIGINAL_YARD_FIRST_EXIT_DONE'
  if(save.stats.fuel<4)return 'ORIGINAL_FUEL_REQUIRED'
  if(save.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
  return
 }
 if(!f['chapter-tunnel-complete'])return 'ORIGINAL_TUNNEL_REQUIRED_FIRST'
 if(id==='yard-route-brief')return f['yard-route-briefed']?'ORIGINAL_YARD_BRIEFED':undefined
 if(!f['yard-route-briefed'])return 'ORIGINAL_YARD_UNBRIEFED'
 if(id==='yard-invite'||id==='yard-stay'){
  if(f['yard-escort-decision'])return 'ORIGINAL_YARD_ESCORT_DECIDED'
  if(id==='yard-invite'&&f['yard-agreement']==='forced')return 'ORIGINAL_YARD_HOSTILE'
  return
 }
 if(!f['yard-escort-decision'])return 'ORIGINAL_YARD_ESCORT_UNDECIDED'
 if(save.stats.fuel<6)return 'ORIGINAL_FUEL_REQUIRED'
 if(save.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
}
export const availableYardActions=(s:StorySave)=>yardActions.filter(a=>!yardRejection(s,a.id)).map(a=>a.id)
export function executeYardTurn(save:StorySave,c:StoryCartridge,id:YardActionId){
 const error=yardRejection(save,id);if(error)throw new LabError(error,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,commands:ParsedCommand[]=[],mako=c.characters.find(p=>p.id==='mara-raider')!
 const fact=(key:string,value:string|number|boolean)=>commands.push({type:'fact',id:key,value})
 const stat=(key:string,delta:number)=>commands.push({type:'widget',id:key,operation:delta<0?'remove':'add',value:Math.abs(delta)})
 let text='',objective=''
 if(id==='yard-meet'){
  text=s('一个穿着雨水浸透的守卫外套、腰挂泵房钥匙的人放低手电。“玛柯，货场守卫队长。”他摊开三处避难点的油账：守卫里有人受伤，油泵也停了；列车若能提供诊疗或修好泵台，就能交换一份燃料。他要的是能兑现的合作，不是列车的头衔。','A person in a rain-soaked guard coat lowers a flashlight, pump-room keys hanging at the waist. “Mako, freight-yard guard captain.” Mako opens fuel accounts for three shelters: guards are injured and the pump is broken. Medical help or pump repairs can earn one fuel allocation. Mako wants practical cooperation, not a conductor’s title.')
  commands.push({type:'character_update',characterId:mako.id,character:mako.name},{type:'encounter',phase:'warning',kind:s('货场燃料封锁','Yard fuel blockade'),severity:2});fact('yard-met',true)
  text+=' '+s('阿达估计，修泵会磨损连接架，但能换来一份燃料和守卫的信任；强行夺油能拿得更多，却会撞伤车体、惊动乘客，玛柯也不会再答应同行。','Ada estimates that repairing the pump will wear the coupling but earn fuel and the guards’ trust. Forcing it yields more fuel, but damages the train, frightens passengers and rules out Mako joining the crew.')
  objective=s('决定如何取得货场燃料，同时承担相应代价','Choose how to obtain yard fuel and accept the consequences')
 }
 if(['yard-medical-pact','yard-work-pact','yard-force-pump'].includes(id)){
  const medical=id==='yard-medical-pact',forced=id==='yard-force-pump'
  text=medical?s('任医生带着自己的急救箱处理守卫的伤口，明确哪些后续治疗必须留给避难点。玛柯按约接上油管，并把沿线救援呼号交给你；这批燃料在油账上标记为已结清。','Doctor Ren treats the guards with his own medical case and explains which follow-up care belongs at the shelters. Mako connects the fuel hose as agreed and shares relief call signs. This allocation is marked settled in the ledger.'):forced?s('列车顶开泵台护栏，冲击损伤了连接架；你们接管油管，抽走约定外的一份燃料。乘客听见守卫抗议，玛柯把这次强取写进油账：“别指望我把后背交给你。”','The train forces the pump barrier, damaging its coupling frame. You take control of the hose and draw an allocation without agreement. Passengers hear the guards protest. Mako records the seizure: “Do not expect me to trust you at my back.”'):s('你和阿达拆用列车固定件修好油泵，连接架因此留下额外磨损。玛柯试过泵压，按约把燃料送进列车；维修换油的条目在双方见证下结清。','You and Ada repair the pump using train fittings, leaving additional wear on the coupling frame. Mako checks the pressure and transfers the agreed fuel. Both sides witness the repair-for-fuel entry being settled.')
  stat('fuel',medical?16:forced?20:12);stat('morale',medical?6:forced?-8:2);if(!medical)stat('condition',forced?-12:-6)
  fact('yard-agreement',medical?'medical':forced?'forced':'work');if(!forced)fact('aid-network-known',true)
  commands.push({type:'reputation',npc:mako.name,action:forced?'hostile-fuel-seizure':'yard-cooperation-kept'},{type:'encounter',phase:'resolution',kind:s('货场燃料封锁','Yard fuel blockade'),outcome:forced?'costly-success':'success'})
  if(medical)commands.push({type:'reputation',npc:c.characters.find(p=>p.id==='ren-medic')!.name,action:'respected-medical-limits'})
  objective=save.facts['chapter-tunnel-complete']?s('核对上山线路并决定护送岗位','Review the mountain route and decide on an escort'):s('沿联络线驶向白石隧道','Take the connecting line toward White Stone Tunnel')
 }
 if(id==='yard-stabilize'){
  text=s('阿达找到泵台旁最后一组未锈穿的固定件，锁住列车松脱的连接架。低速牵引恢复，旧料架上没有第二组能用的部件。','Ada finds the final usable fittings beside the pump and braces the loose train coupling. Low-speed traction returns; no second usable set remains on the rack.')
  stat('condition',20);fact('yard-bracing-used',true)
 }
 if(id==='yard-starting-reserve'){
  text=s('你在独立的起步油册上登记，领取泵台另行封存的最后一份小额储备。封签留在册页里；它不是之前协议的第二次兑付。','You sign the separate starting-fuel register and draw the pump’s last sealed emergency allocation. Its seal stays in the ledger; the earlier agreement is not paid twice.')
  stat('fuel',12);fact('yard-starting-reserve-used',true)
 }
 if(id==='yard-first-exit'){
  text=s('列车沿采石场联络线离开灰石，油账和刚才的选择都留在玛柯手里。白石隧道口的通风机停着，一缕烟正飘向车灯。','The train leaves Graystone along the quarry connecting line. Mako retains the fuel ledger and the record of your choice. At White Stone Tunnel the fan is stopped and smoke drifts toward the headlamp.')
  stat('fuel',-4);fact('yard-first-exit',true);fact('chapter-dead-station-complete',true)
  commands.push({type:'map_update',location:c.initialMap.find(n=>n.id==='tunnel')!.label},{type:'encounter',phase:'warning',kind:s('白石隧道烟雾','Smoke in White Stone Tunnel'),severity:2})
  objective=s('查明隧道烟源，决定怎样带队通过','Identify the tunnel smoke and decide how to bring the crew through')
 }
 if(id==='yard-route-brief'){
  text=save.facts['yard-first-exit']?s('玛柯认出穿过隧道回来的列车，指了指先前已经结清的油账，没有再开油管。','Mako recognizes the train returning through the tunnel and points to the settled ledger without reopening the fuel hose.'):s('玛柯把隧道来车的记录翻到下一页，展开上山线路图。','Mako turns the tunnel arrival entry over and unfolds the mountain route plan.')
  text+=' '+(save.facts['yard-agreement']==='forced'?s('“上山道岔不再拦你，但我的人不会替你带路。”他在图上指出一组失控货车最后被看见的位置。','“The mountain switch is open to you, but my people will not guide you.” Mako marks where runaway freight cars were last seen.'):s('他指出失控货车最后被看见的位置，愿意亲自去山口交接防卫岗位，也允许你选择自行带队。','Mako marks where runaway freight cars were last seen and offers to hand over the defense post in person, while leaving you free to lead without an escort.'))
  fact('yard-route-briefed',true);objective=s('决定玛柯同行还是留守，然后驶向山口','Decide whether Mako travels or remains, then leave for the pass')
 }
 if(id==='yard-invite'){
  text=s('玛柯把泵房钥匙交给副手，带着岗位图登上列车：“我同行到山口，防卫岗位交给我。”阿达为他腾出值守位置，原来的伙伴继续留在各自岗位上。','Mako hands the pump keys to a deputy and boards with the duty plan. “I’ll travel to the pass and take the defense post.” Ada makes room; the existing companions keep their posts.')
  commands.push({type:'party_change',characterId:mako.id,character:mako.name,change:'add'});fact('yard-escort-decision','joined')
 }
 if(id==='yard-stay'){
  text=s('玛柯收起岗位图，留在货场栅门旁继续值守。你们确认由列车现有成员负责山口行动；他向列车抬起手，转身带守卫回到泵台。','Mako puts away the duty plan and remains beside the yard gate. Your existing crew will handle the pass. Mako raises a hand toward the train, then leads the guards back to the pump.')
  fact('yard-escort-decision','stayed')
 }
 if(id==='yard-depart'){
  text=s('灰石的灯退到雨后，列车沿山口线爬升。阿达听见轨道传来不属于本列车的轮声：坡上有货车正在倒退。','Graystone’s lights recede through the rain as the train climbs the pass line. Ada hears wheels that do not belong to your train: freight cars are rolling backward above you.')
  stat('fuel',-6);fact('chapter-yard-complete',true)
  commands.push({type:'map_update',location:c.initialMap.find(n=>n.id==='mountain-pass')!.label},{type:'encounter',phase:'warning',kind:s('山口失控货车','Runaway freight at the pass'),severity:3})
  objective=s('判断失控货车距离，安排山口岗位','Judge the runaway cars’ distance and assign the pass duties')
 }
 if(objective)commands.push({type:'state',value:objective})
 const next=applyParsedScene(structuredClone(save),{blocks:[{id:`yard-${save.scene+1}-${id}`,kind:'event',text}],commands,raw:text},c,yardLabel(id,c.locale))
 next.choices=availableYardActions(next).map(a=>({id:a,label:yardLabel(a,c.locale)}))
 return {save:next,source:'author' as const,acceptedActionId:id}
}
