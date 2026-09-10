import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {LabError} from './journey-runtime'
export const passActions=[
 {id:'pass-inspect',zh:'检查山口货车距离与制动压力',en:'Inspect the pass freight distance and brake pressure'},
 {id:'pass-lin-watch',zh:'请林澈负责山口测距',en:'Ask Lin to judge the pass distances'},
 {id:'pass-player-watch',zh:'亲自对照坡度标测距',en:'Judge the distance from the grade markers yourself'},
 {id:'pass-mako-duty',zh:'请玛柯组织车厢岗位',en:'Ask Mako to organize the carriage duties'},
 {id:'pass-crew-duty',zh:'按现有人员分配车厢岗位',en:'Assign carriage duties to the existing crew'},
 {id:'pass-air-brake',zh:'接入现存软管实施气路制动',en:'Connect the owned spare hose for air braking'},
 {id:'pass-dynamic-brake',zh:'持续供油实施动力制动',en:'Sustain fuel flow for dynamic braking'},
 {id:'pass-gravel-siding',zh:'驶入砂石避让道',en:'Take the gravel escape siding'},
 {id:'pass-confirm-key',zh:'确认山口维修岔线已经脱险',en:'Confirm clearance on the pass maintenance siding'},
 {id:'pass-refuel',zh:'抽取山口最后一份应急柴油',en:'Pump the pass’s last emergency diesel reserve'},
 {id:'pass-stabilize',zh:'请阿达用山口检修件加固列车',en:'Ask Ada to brace the train with pass fittings'},
 {id:'pass-debrief',zh:'险情后核对乘客和岗位',en:'Account for passengers and duties after the danger'},
 {id:'pass-depart',zh:'驶向沉睡小城（燃料−6）',en:'Depart for Sleeping Town (Fuel −6)'},
] as const
export type PassActionId=typeof passActions[number]['id']
export const passLabel=(id:PassActionId,l:Locale)=>passActions.find(a=>a.id===id)![l]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
export const resolvePassAction=(text:string,l:Locale,save?:StorySave,c?:StoryCartridge)=>passActions.find(a=>[a[l],a[l].replace(/\s*[（(][^()（）]*[）)]\s*$/,''),...(save&&c?passChoices(save,c).filter(choice=>choice.id===a.id).map(choice=>choice.label):[])].some(label=>normalize(label)===normalize(text)))?.id
export const passBindingRules=passActions.map(a=>({id:a.id,effects:a.id==='pass-depart'?[{type:'map',nodeId:'sleeping-town'}]:[]}))
const companion=(s:StorySave,id:string)=>s.partyMemberIds.includes(id)&&s.characters.some(c=>c.id===id&&c.status==='companion')
export const passKeyOpened=(s:StorySave)=>s.facts['pass-inspected']===true&&Number(s.facts['switch-key-uses']??0)>Number(s.facts['pass-key-uses-before']??0)&&s.facts['hidden-route-open']===true&&s.danger.phase==='calm'
export function passCost(s:StorySave,id:PassActionId){
 const lin=s.facts['pass-lookout']==='lin-scout',mako=s.facts['pass-duty']==='mara-raider'
 return id==='pass-air-brake'?{fuel:lin?2:4,condition:mako?2:4,morale:0}:id==='pass-dynamic-brake'?{fuel:lin?10:12,condition:mako?4:6,morale:0}:id==='pass-gravel-siding'?{fuel:0,condition:mako?12:16,morale:6}:{fuel:0,condition:0,morale:0}
}
export const passRejections=['ORIGINAL_PASS_REQUIRED','ORIGINAL_PASS_DONE','ORIGINAL_PASS_UNINSPECTED','ORIGINAL_PASS_INSPECTED','ORIGINAL_PASS_LOOKOUT_SET','ORIGINAL_PASS_LOOKOUT_REQUIRED','ORIGINAL_PASS_DUTY_SET','ORIGINAL_PASS_DUTY_REQUIRED','ORIGINAL_PASS_LIN_REQUIRED','ORIGINAL_PASS_MAKO_REQUIRED','ORIGINAL_PASS_RESOLVED','ORIGINAL_PASS_UNRESOLVED','ORIGINAL_PASS_HOSE_REQUIRED','ORIGINAL_PASS_KEY_CLOSED','ORIGINAL_PASS_RESERVE_EMPTY','ORIGINAL_PASS_BRACING_UNAVAILABLE','ORIGINAL_PASS_DEBRIEFED','ORIGINAL_PASS_DEBRIEF_REQUIRED','ORIGINAL_PASS_DEPARTURE_RESERVE_REQUIRED','ORIGINAL_FUEL_REQUIRED','ORIGINAL_CONDITION_REQUIRED'] as const
export function passRejection(s:StorySave,id:PassActionId){
 const f=s.facts
 if(s.map.find(n=>n.current)?.id!=='mountain-pass')return 'ORIGINAL_PASS_REQUIRED'
 if(f['chapter-pass-complete'])return 'ORIGINAL_PASS_DONE'
 if(id==='pass-refuel')return f['pass-reserve-used']?'ORIGINAL_PASS_RESERVE_EMPTY':undefined
 if(id==='pass-stabilize')return f['pass-bracing-used']||s.stats.condition>=20?'ORIGINAL_PASS_BRACING_UNAVAILABLE':undefined
 if(id==='pass-inspect')return f['pass-inspected']?'ORIGINAL_PASS_INSPECTED':undefined
 if(!f['pass-inspected'])return 'ORIGINAL_PASS_UNINSPECTED'
 if(id==='pass-lin-watch'||id==='pass-player-watch'){
  if(f['pass-lookout'])return 'ORIGINAL_PASS_LOOKOUT_SET'
  if(id==='pass-lin-watch'&&(!companion(s,'lin-scout')||!f['pine-route-checked']))return 'ORIGINAL_PASS_LIN_REQUIRED'
  return
 }
 if(!f['pass-lookout'])return 'ORIGINAL_PASS_LOOKOUT_REQUIRED'
 if(id==='pass-mako-duty'||id==='pass-crew-duty'){
  if(f['pass-duty'])return 'ORIGINAL_PASS_DUTY_SET'
  if(id==='pass-mako-duty'&&!companion(s,'mara-raider'))return 'ORIGINAL_PASS_MAKO_REQUIRED'
  return
 }
 if(!f['pass-duty'])return 'ORIGINAL_PASS_DUTY_REQUIRED'
 if(['pass-air-brake','pass-dynamic-brake','pass-gravel-siding','pass-confirm-key'].includes(id)){
  if(f['pass-method']||id!=='pass-confirm-key'&&passKeyOpened(s))return 'ORIGINAL_PASS_RESOLVED'
  if(id==='pass-confirm-key')return passKeyOpened(s)?undefined:'ORIGINAL_PASS_KEY_CLOSED'
  if(id==='pass-air-brake'&&!s.inventory.some(i=>i.id==='spare-hose'&&i.count>=1))return 'ORIGINAL_PASS_HOSE_REQUIRED'
  const cost=passCost(s,id)
  if(cost.fuel&&s.stats.fuel<cost.fuel+6)return 'ORIGINAL_PASS_DEPARTURE_RESERVE_REQUIRED'
  if(s.stats.condition<cost.condition)return 'ORIGINAL_CONDITION_REQUIRED'
  return
 }
 if(!f['pass-method'])return 'ORIGINAL_PASS_UNRESOLVED'
 if(id==='pass-debrief')return f['pass-debriefed']?'ORIGINAL_PASS_DEBRIEFED':undefined
 if(!f['pass-debriefed'])return 'ORIGINAL_PASS_DEBRIEF_REQUIRED'
 if(s.stats.fuel<6)return 'ORIGINAL_FUEL_REQUIRED'
 if(s.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
}
export function assertPassSourceAction(s:StorySave,id:string){
 if(id!=='use-master-switch-key'||s.map.find(n=>n.current)?.id!=='mountain-pass')return
 if(!s.facts['pass-inspected'])throw new LabError('ORIGINAL_PASS_UNINSPECTED',409)
 if(!s.facts['pass-lookout'])throw new LabError('ORIGINAL_PASS_LOOKOUT_REQUIRED',409)
 if(!s.facts['pass-duty'])throw new LabError('ORIGINAL_PASS_DUTY_REQUIRED',409)
 if(s.facts['pass-method']||passKeyOpened(s))throw new LabError('ORIGINAL_PASS_RESOLVED',409)
 if(s.stats.fuel<14)throw new LabError('ORIGINAL_PASS_DEPARTURE_RESERVE_REQUIRED',409)
 if(s.stats.condition<=0)throw new LabError('ORIGINAL_CONDITION_REQUIRED',409)
}
export function passChoices(s:StorySave,c:StoryCartridge){
 const choices:StorySave['choices']=passActions.filter(a=>!passRejection(s,a.id)).map(a=>{
  const cost=passCost(s,a.id),parts=[cost.fuel?`−${cost.fuel} ${c.locale==='zh'?'燃料':'Fuel'}`:'',cost.condition?`−${cost.condition} ${c.locale==='zh'?'车况':'Condition'}`:'',cost.morale?`−${cost.morale} ${c.locale==='zh'?'人心':'Morale'}`:'',a.id==='pass-air-brake'?(c.locale==='zh'?'软管×1':'Hose ×1'):''].filter(Boolean)
  return {id:a.id,label:a[c.locale]+(parts.length?` (${parts.join(', ')})`:'')}
 })
 if(s.facts['pass-duty']&&!s.facts['pass-method']&&!passKeyOpened(s)&&s.stats.fuel>=14&&s.stats.condition>0&&Number(s.facts['switch-key-uses']??0)<3&&s.inventory.some(i=>i.id==='master-switch-key'&&i.count>0)&&['warning','confrontation'].includes(s.danger.phase)){
  const rule=c.domainRules!.rules.find(r=>r.id==='use-master-switch-key')!;choices.unshift({id:rule.id,label:rule.match[0]+(c.locale==='zh'?'（燃料−8，覆盖次数−1）':' (Fuel −8, Overrides −1)')})
 }
 return choices
}
export function executePassTurn(save:StorySave,c:StoryCartridge,id:PassActionId){
 const error=passRejection(save,id);if(error)throw new LabError(error,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,commands:ParsedCommand[]=[]
 const fact=(key:string,value:string|number|boolean)=>commands.push({type:'fact',id:key,value})
 const stat=(key:string,delta:number)=>{if(delta)commands.push({type:'widget',id:key,operation:delta<0?'remove':'add',value:Math.abs(delta)})}
 const reputation=(id:string,action:string)=>commands.push({type:'reputation',npc:c.characters.find(p=>p.id===id)!.name,action})
 let text='',objective=''
 if(id==='pass-inspect'){
  text=s('阿达量过制动压力：坡上的货车正在倒退，岔口只剩一段处置距离。若物资舱还保留备用软管，就能接回气路；没有软管就得持续烧油制动，或进砂石道用车体承受冲击。总调度钥匙也能开维修线，但会折一枚齿。所有烧油方案必须留下离站的六份燃料。先安排测距与车厢岗位，可靠的观察能少耗试探燃料，稳住车厢能减轻连接架损伤。','Ada checks brake pressure. Freight cars are rolling back toward the junction. An owned spare hose can restore the air circuit; without it, sustained fuel braking or the gravel escape bed are alternatives. The master key can open the maintenance siding at the cost of a tooth. Every fueled method must leave six fuel for departure. Assign lookout and carriage duties first: reliable distance calls save fuel and steady carriage handling reduces coupling damage.')
  fact('pass-inspected',true);fact('pass-key-uses-before',Number(save.facts['switch-key-uses']??0));commands.push({type:'encounter',phase:'confrontation',kind:s('山口失控货车','Runaway freight at the pass'),severity:3})
  objective=s('分配测距与车厢岗位，再选择有代价的处置','Assign lookout and carriage duties, then choose a response and its cost')
 }
 if(id==='pass-lin-watch'||id==='pass-player-watch'){
  const lin=id==='pass-lin-watch';fact('pass-lookout',lin?'lin-scout':'player')
  text=lin?s('林澈把黑松核实过的坡度记录与眼前标柱对齐，连续报出货车距离。你采用他的实测节奏，不再反复点火试探。','Lin aligns the grade records verified at Black Pine with the markers ahead and calls the distances. You can follow those observations without repeated fuel-powered probing.'):s('你从驾驶位逐根对照坡度标柱，估计货车距离。没有现场巡检员校核，需要给制动试探保留完整燃料。','You compare the grade markers from the cab to estimate the distance. Without the inspector’s live checks, braking needs the full probing fuel allowance.')
 }
 if(id==='pass-mako-duty'||id==='pass-crew-duty'){
  const mako=id==='pass-mako-duty';fact('pass-duty',mako?'mara-raider':'crew')
  text=mako?s('玛柯按货场交接过的岗位图组织车厢，提前固定移动物资，让每人抓住支点。他确认指令只服务于通过山口，列车路线仍由你们共同决定。','Mako organizes the carriage using the yard duty plan, securing loose supplies and giving each person a handhold. These orders are for clearing the pass; they do not hand over control of the train’s route.'):s('你让现有成员按位置守住车厢支点，阿达继续留在机务位。大家能执行指令，但遇到冲击时连接架仍需承受完整负荷。','You assign the existing crew to carriage handholds while Ada stays at the mechanical controls. They can follow the plan, but the coupling must take the full impact load.')
 }
 if(['pass-air-brake','pass-dynamic-brake','pass-gravel-siding','pass-confirm-key'].includes(id)){
  const cost=passCost(save,id),method=id.replace('pass-','');stat('fuel',-cost.fuel);stat('condition',-cost.condition);stat('morale',-cost.morale)
  if(id==='pass-air-brake'){
   const hose=save.inventory.find(i=>i.id==='spare-hose')!;commands.push({type:'inventory',action:'remove',itemId:hose.id,item:hose.label,count:1})
   text=s('阿达接上物资舱实际剩下的备用软管，气路重新建立压力。列车按岗位口令减速，货车从隔离轨经过；软管已安装并承受压力，不再是可重复使用的库存。','Ada installs the spare hose actually held in the supply bay and restores air pressure. The train slows on the crew’s signals while freight passes on the separated track. The installed, stressed hose is no longer spare inventory.')
  }else if(id==='pass-dynamic-brake')text=s('阿达持续供油维持动力制动，轮缘热得发亮。列车停在警冲标内，货车从前方通过；烧掉的燃料和连接磨损都留在这一段记录里。','Ada sustains fuel flow for dynamic braking. The wheel flanges glow as the train stops inside the clearance marker and freight passes ahead. The fuel burned and coupling wear remain on the record.')
  else if(id==='pass-gravel-siding')text=s('列车驶进砂石避让道，碎石沿车底翻滚，连接架在阻力中受损。货车沿主轨掠过；乘客惊魂未定，但核对后无人被留在主轨上。','The train enters the gravel escape bed. Stone churns under the frame, damaging the coupling as it absorbs the load. Freight passes on the main track. Passengers are shaken, but no one remains exposed on that track.')
  else text=s('阿达确认列车已进入刚刚用钥匙打开的维修岔线，货车从主轨通过。此前消耗的燃料和钥匙齿照旧记账，没有第二次扣除。','Ada confirms the train is inside the maintenance siding just opened with the key. Freight passes on the main track. The fuel and key tooth already spent remain recorded, with no second charge.')
  fact('pass-method',method);commands.push({type:'encounter',phase:'resolution',kind:s('山口失控货车','Runaway freight at the pass'),outcome:id==='pass-gravel-siding'?'costly-success':'success'})
  if(save.facts['pass-lookout']==='lin-scout')reputation('lin-scout','trusted-pass-lookout')
  if(save.facts['pass-duty']==='mara-raider')reputation('mara-raider','trusted-pass-duty')
  objective=s('核对全车，再准备驶往小城','Account for everyone, then prepare to leave for the town')
 }
 if(id==='pass-refuel'){text=s('你抽尽山口检修点最后一份应急柴油，空罐留在原位。','You pump the pass maintenance point’s last emergency diesel; its empty tank stays behind.');stat('fuel',12);fact('pass-reserve-used',true)}
 if(id==='pass-stabilize'){text=s('阿达用山口剩下的最后一组检修件锁住松动连接，恢复低速牵引。','Ada locks the loose coupling with the pass’s final service fittings, restoring low-speed traction.');stat('condition',20);fact('pass-bracing-used',true)}
 if(id==='pass-debrief'){
  const doctor=companion(save,'ren-medic')
  text=doctor?s('任医生按先前的伤员记录检查全车，没有新增的失踪者；他要求之后停车再检查一次，大家终于松开紧抓的扶手。','Doctor Ren checks the train against the existing patient register. No one is missing; he asks for another check at the next stop. Passengers finally release their grip.'):s('你按既有乘客名单逐段核对车厢，人数与出山口前一致。大家重新坐稳，等待下一站停车。','You check each carriage against the existing passenger list. The count matches the approach to the pass. People settle again and wait for the next station.')
  if(companion(save,'mara-raider'))text+=' '+s('玛柯收起本段岗位图，明确表示愿意继续随车值守。','Mako folds this section’s duty plan and confirms willingness to continue serving aboard.')
  stat('morale',doctor?4:2);if(doctor)reputation('ren-medic','trusted-pass-triage');fact('pass-debriefed',true)
 }
 if(id==='pass-depart'){
  text=s('列车告别山口，进入亮着电灯却没有广播回应的小城站。大家仍带着刚才的岗位经验和付出的代价；站台上没有人替你决定该停多久。','The train leaves the pass for a town station with electric lights but no broadcast response. The crew retain their experience and the costs paid. No one on the platform decides how long you should stay.')
  stat('fuel',-6);fact('chapter-pass-complete',true);commands.push({type:'map_update',location:c.initialMap.find(n=>n.id==='sleeping-town')!.label},{type:'clock',value:s('第1夜 · 04:18','Night 1 · 04:18')});objective=s('查明小城为何沉默，决定如何准备最后一段','Learn why the town is silent and prepare for the final stretch')
 }
 if(objective)commands.push({type:'state',value:objective})
 const next=applyParsedScene(structuredClone(save),{blocks:[{id:`pass-${save.scene+1}-${id}`,kind:'event',text}],commands,raw:text},c,passLabel(id,c.locale));next.choices=passChoices(next,c)
 return {save:next,source:'author' as const,acceptedActionId:id}
}
