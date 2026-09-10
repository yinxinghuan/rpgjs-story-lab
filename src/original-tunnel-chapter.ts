import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {LabError} from './journey-runtime'

export const tunnelActions=[
 {id:'tunnel-inspect',zh:'检查隧道通风机与烟流',en:'Inspect the tunnel fan and smoke'},
 {id:'tunnel-doctor-led',zh:'请任医生组织乘客转移',en:'Ask Doctor Ren to organize the passengers'},
 {id:'tunnel-captain-led',zh:'亲自组织乘客转移（人心−3）',en:'Organize the passengers yourself (Morale −3)'},
 {id:'tunnel-ventilate',zh:'供油排烟并保留物资（燃料−8）',en:'Fuel the fan and retain the supplies (Fuel −8)'},
 {id:'tunnel-discard',zh:'清空后车厢并放弃备用油罐和软管（人心−4）',en:'Clear the rear carriage and abandon diesel cans and spare hoses (Morale −4)'},
 {id:'tunnel-refuel',zh:'抽取隧道维修点的应急柴油',en:'Pump the tunnel maintenance reserve diesel'},
 {id:'tunnel-stabilize',zh:'请阿达用隧道固定件加固列车',en:'Ask Ada to brace the train with tunnel fittings'},
 {id:'tunnel-depart',zh:'驶过烟段前往灰石货场（燃料−4）',en:'Pass the smoke and travel to Graystone Yard (Fuel −4)'},
] as const
export type TunnelActionId=typeof tunnelActions[number]['id']
export const tunnelLabel=(id:TunnelActionId,locale:Locale)=>tunnelActions.find(a=>a.id===id)![locale]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
export function resolveTunnelAction(text:string,locale:Locale){const input=normalize(text);return tunnelActions.find(d=>[d[locale],d[locale].replace(/\s*[（(][^()（）]*[）)]\s*$/,'')].some(label=>normalize(label)===input))?.id}
export const tunnelBindingRules=tunnelActions.map(d=>({id:d.id,effects:d.id==='tunnel-depart'?[{type:'map',nodeId:'graystone-yard'}]:[]}))
export const tunnelRejections=['ORIGINAL_TUNNEL_REQUIRED','ORIGINAL_TUNNEL_DONE','ORIGINAL_TUNNEL_INSPECTED','ORIGINAL_TUNNEL_UNINSPECTED','ORIGINAL_TUNNEL_NOT_GROUPED','ORIGINAL_TUNNEL_GROUPED','ORIGINAL_TUNNEL_DECIDED','ORIGINAL_TUNNEL_UNDECIDED','ORIGINAL_DOCTOR_REQUIRED','ORIGINAL_TUNNEL_RESERVE_EMPTY','ORIGINAL_TUNNEL_BRACING_UNAVAILABLE','ORIGINAL_FUEL_REQUIRED','ORIGINAL_CONDITION_REQUIRED'] as const
export function tunnelRejection(save:StorySave,id:TunnelActionId){
 const f=save.facts
 if(save.map.find(n=>n.current)?.id!=='tunnel')return 'ORIGINAL_TUNNEL_REQUIRED'
 if(f['chapter-tunnel-complete'])return 'ORIGINAL_TUNNEL_DONE'
 if(id==='tunnel-refuel')return f['tunnel-reserve-used']?'ORIGINAL_TUNNEL_RESERVE_EMPTY':undefined
 if(id==='tunnel-stabilize')return f['tunnel-bracing-used']||save.stats.condition>=20?'ORIGINAL_TUNNEL_BRACING_UNAVAILABLE':undefined
 if(id==='tunnel-inspect')return f['tunnel-inspected']?'ORIGINAL_TUNNEL_INSPECTED':undefined
 if(!f['tunnel-inspected'])return 'ORIGINAL_TUNNEL_UNINSPECTED'
 if(id==='tunnel-doctor-led'||id==='tunnel-captain-led'){
  if(f['tunnel-group-leader'])return 'ORIGINAL_TUNNEL_GROUPED'
  if(id==='tunnel-doctor-led'&&(!save.partyMemberIds.includes('ren-medic')||!save.characters.some(c=>c.id==='ren-medic'&&c.status==='companion')))return 'ORIGINAL_DOCTOR_REQUIRED'
  return
 }
 if(!f['tunnel-group-leader'])return 'ORIGINAL_TUNNEL_NOT_GROUPED'
 if(id==='tunnel-ventilate'||id==='tunnel-discard'){
  if(f['tunnel-cargo-policy'])return 'ORIGINAL_TUNNEL_DECIDED'
  if(id==='tunnel-ventilate'&&save.stats.fuel<8)return 'ORIGINAL_FUEL_REQUIRED'
  return
 }
 if(!f['tunnel-cargo-policy'])return 'ORIGINAL_TUNNEL_UNDECIDED'
 if(save.stats.fuel<4)return 'ORIGINAL_FUEL_REQUIRED'
 if(save.stats.condition<=0)return 'ORIGINAL_CONDITION_REQUIRED'
}
export const availableTunnelActions=(save:StorySave)=>tunnelActions.filter(a=>!tunnelRejection(save,a.id)).map(a=>a.id)
export function executeTunnelTurn(save:StorySave,c:StoryCartridge,id:TunnelActionId){
 const rejection=tunnelRejection(save,id);if(rejection)throw new LabError(rejection,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,commands:ParsedCommand[]=[]
 const fact=(key:string,value:string|number|boolean)=>commands.push({type:'fact',id:key,value})
 const stat=(key:string,delta:number)=>commands.push({type:'widget',id:key,operation:delta<0?'remove':'add',value:Math.abs(delta)})
 let text='',objective=''
 if(id==='tunnel-inspect'){
  text=s('阿达从洞口检修窗看见前方货堆正在燃烧，停转的通风机让烟向列车涌来。她关上后车厢的进气口：乘客必须先转移到前车厢，再决定烧油排烟，还是清空后车厢隔开烟流。','From the entrance service window, Ada spots burning freight ahead. The stopped fan lets smoke drift toward the train. She closes the rear air intake: passengers must move forward before you decide between fueling the fan and clearing the rear carriage to isolate the smoke.')
  fact('tunnel-inspected',true);commands.push({type:'encounter',phase:'confrontation',kind:s('白石隧道烟雾','Smoke in White Stone Tunnel'),severity:2})
  objective=s('先将乘客点齐并转移到前车厢','Account for everyone and move the passengers into the front carriage')
 }
 if(id==='tunnel-doctor-led'||id==='tunnel-captain-led'){
  const doctor=id==='tunnel-doctor-led'
  text=doctor?s('任医生按伤情分组，先把已有伤情记录的病人安置在前车厢通风处，再逐一核对同行者。阿达照着他的手势让出通道；人数点齐，没人被留在后面。','Doctor Ren groups people by medical need, seating the patients from his existing medical register where air enters the front carriage before checking everyone else. Ada clears the aisle at his signal. Everyone is accounted for; no one remains behind.'):s('你沿过道重新点名，让乘客一组组挤进前车厢。有人不满行李挡路，一次漏报让全体又核对了一遍；最终人数点齐，没人留在后面，但抱怨声没有停。','You call the roll and move passengers forward in groups. Luggage blocks the aisle; a missed response forces a second count. Everyone is finally accounted for, but the complaints continue.')
  fact('tunnel-group-leader',doctor?'ren-medic':'player');stat('morale',doctor?2:-3)
  if(doctor)commands.push({type:'reputation',npc:c.characters.find(p=>p.id==='ren-medic')!.name,action:'trusted-medical-evacuation'})
  objective=s('在燃料和后车厢物资之间作出取舍','Choose between fuel and the supplies in the rear carriage')
 }
 if(id==='tunnel-ventilate'){
  text=s('阿达把燃料接到洞口通风机的应急动力机，扇叶重新转动。烟被推出通路，后车厢的物资得以保留；油箱里的这份余量无法收回。','Ada feeds fuel to the tunnel fan’s emergency drive. The blades turn and push smoke away from the route. Supplies in the rear carriage can stay, but the burned fuel is gone.')
  stat('fuel',-8);fact('tunnel-cargo-policy','retained');fact('tunnel-discarded-items','')
  objective=s('确认车况后通过烟段，前往货场','Check the train’s condition, then pass the smoke toward the yard')
 }
 if(id==='tunnel-discard'){
  const lost=save.inventory.filter(i=>['sealed-diesel','spare-hose'].includes(i.id))
  const listing=lost.map(i=>`${i.label} ×${i.count}`).join('、')
  text=s('大家把后车厢的散装行李卸在洞口，留出隔烟空带；阿达封住后侧通风口。', 'Passengers unload loose baggage at the entrance, leaving a clear isolation space while Ada seals the rear vents.')
  text+=' '+(lost.length?s(`留下的铁路备用物资包括${listing}。`,`The abandoned railway reserves include ${listing}.`):s('这里没有你的备用油罐或软管，损失的是乘客无法随身携带的行李。','You have no reserve diesel cans or hoses here; the loss is the luggage passengers cannot carry forward.'))
  text+=' '+s('黄铜钥匙、电台和医务角的必需品留在前车厢，人们仍不舍地望着洞口。','The brass key, radio and medical essentials stay in front; passengers keep looking back at the entrance.')
  for(const item of lost)commands.push({type:'inventory',action:'remove',itemId:item.id,item:item.label,count:item.count})
  stat('morale',-4);fact('tunnel-cargo-policy','abandoned');fact('tunnel-discarded-items',lost.map(i=>`${i.id}:${i.count}`).join('|'))
  objective=s('以隔烟编组低速通过，前往货场','Pass slowly with the smoke-isolation arrangement and continue to the yard')
 }
 if(id==='tunnel-refuel'){
  text=s('你和阿达将洞口维修点最后一份应急柴油泵入列车。储罐见底，手泵再也抽不出油。','You and Ada pump the entrance maintenance point’s last emergency diesel into the train. The reservoir runs dry.')
  stat('fuel',12);fact('tunnel-reserve-used',true)
 }
 if(id==='tunnel-stabilize'){
  text=s('阿达取下检修架最后一组固定件，把松动的连接锁紧。列车能重新低速牵引，检修架上已经没有第二组可拆的零件。','Ada removes the maintenance stand’s final set of fittings and braces the loose connection. Low-speed traction returns; no second set of parts remains.')
  stat('condition',20);fact('tunnel-bracing-used',true)
 }
 if(id==='tunnel-depart'){
  text=s(save.facts['tunnel-cargo-policy']==='retained'?'通风机送出的气流护住前路，阿达让列车低速穿过白石隧道，乘客与物资都跟了上来。':'前车厢的乘客隔着关闭的内门等待，阿达让列车低速穿过烟段；被卸下的行李和备用物资留在洞口。',save.facts['tunnel-cargo-policy']==='retained'?'The fan keeps air moving while Ada takes the train slowly through White Stone Tunnel. Passengers and supplies emerge together.':'Passengers wait behind the closed internal doors as Ada takes the train slowly through the smoke. Unloaded luggage and reserves remain at the entrance.')
  text+=' '+s('灰石货场的油罐出现在车灯里，临时栅门后有人举起手电，要求先说明来意。','Graystone’s fuel tanks appear in the headlamp. Someone behind a temporary gate raises a flashlight and asks you to state your purpose.')
  stat('fuel',-4);fact('chapter-tunnel-complete',true)
  commands.push({type:'map_update',location:c.initialMap.find(n=>n.id==='graystone-yard')!.label},{type:'encounter',phase:'resolution',kind:s('白石隧道烟雾','Smoke in White Stone Tunnel'),outcome:save.facts['tunnel-cargo-policy']==='abandoned'?'costly-success':'success'})
  objective=s('与货场守卫说明来意，争取后续线路的补给','Explain your purpose to the yard guards and secure supplies for the next line')
 }
 if(objective)commands.push({type:'state',value:objective})
 const next=applyParsedScene(structuredClone(save),{blocks:[{id:`tunnel-${save.scene+1}-${id}`,kind:'event',text}],commands,raw:text},c,tunnelLabel(id,c.locale))
 next.choices=availableTunnelActions(next).map(action=>({id:action,label:tunnelLabel(action,c.locale)}))
 return {save:next,source:'author' as const,acceptedActionId:id}
}
