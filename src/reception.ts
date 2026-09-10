import type {DomainActionRule, DomainRequirement, Locale, StorySave} from './vendor/story/types'
const t=(l:Locale,zh:string,en:string)=>l==='zh'?zh:en
export const receptionLabels:Record<string,[string,string]>={
 'begin-reception':['安排接应','Arrange reception'],
 'check-circuit':['与林核实照明','Check lighting with Lin'],
 'check-aisle':['与周雨确认通道','Check the aisle with Zhou Yu'],
 'read-arrival-code':['查看接应识别信号','Read the arrival signal'],
 'confirm-arrival':['复述：两短一长','Repeat: two short, one long'],
 'retry-arrival':['复述：一短两长','Repeat: one short, two long'],
 'complete-handover':['确认交接准备完成','Confirm handover preparation'],
}
export function receptionRules(locale:Locale,save?:StorySave):DomainActionRule[]{
 const f=save?.facts??{},copy=(zh:string,en:string)=>t(locale,zh,en)
 const required=(id:string,reason:string):DomainRequirement=>({type:'fact',id,equals:true,reason})
 const fresh=(id:string):DomainRequirement=>({type:'fact',id,notEquals:true,reason:copy('这件事已经确认，不需要重复。','This has been confirmed; it does not need repeating.')})
 const started=required('reception_started',copy('先到电台安排接应。','Arrange reception at the radio first.'))
 const active=[started,fresh('handover_complete')]
 const known=(id:string,fact:string):DomainRequirement[]=>[required(fact,copy('先与对方认识，再安排协作。','Meet this person before arranging cooperation.')),{type:'character',id,status:'known',reason:copy('需要已认识的联络人。','You need an introduced contact.')}]
 // Lin is already a companion, so his fact + known roster are checked separately.
 const rule=(id:string,map:string,requirements:DomainRequirement[],effects:DomainActionRule['effects'],zh:string,en:string):DomainActionRule=>({id,intent:id,match:[id],matchMode:'exact',requirements:[{type:'map',nodeId:map,reason:copy('走到对应的车厢亲自确认。','Go to the appropriate car to confirm this in person.')},...requirements],effects,successText:copy(zh,en),successChoices:[],dangerPolicy:'suppress',successContinuation:'resume'})
 const mark=(id:string)=>({type:'fact' as const,id,value:true})
 const relation=(characterId:string,axis:string)=>({type:'relationship' as const,characterId,axis,delta:1})
 const ready=[...active,required('circuit_checked',copy('先与林核实照明。','Check the lighting with Lin first.')),required('aisle_confirmed',copy('先与乘务员确认通道。','Check the aisle with the attendant first.')),required('arrival_code_read',copy('先查看记录板上的接应识别信号。','Read the arrival signal on the clipboard first.')),...known('xu-lan','dispatcher_introduced'),fresh('handover_ready')]
 return [
 rule('begin-reception','cab',[required('rescue_sent',copy('先完成求援引导。','Establish rescue guidance first.')),...known('xu-lan','dispatcher_introduced'),fresh('reception_started')],[mark('reception_started')],
 '许岚说：“接下来核实车内条件。请修理工确认照明，和行李车乘务员确认通道，再看记录板上的接应识别信号。准备好后回来复述，我们再安排交接。确认之前，留在车内。”',
 'Xu Lan says, “Now verify conditions inside. Check the lighting with the mechanic, confirm the aisle with the baggage attendant, and read the arrival signal on the clipboard. Return to repeat it when ready. Stay inside until we confirm the handover.”'),
 rule('check-circuit','carriage',[...active,required('introduced',copy('先认识修理工。','Meet the mechanic first.')),{type:'character',id:'lin',status:'companion',reason:copy('先与修理工建立协作。','Establish cooperation with the mechanic first.')},fresh('circuit_checked')],[mark('circuit_checked'),relation('lin','lighting-cooperation')],
 f.power_radio?'你和林逐一核对过道的应急灯。林指着仍亮着的灯：“电台用着大部分功率，沿这条光走，别切回顶灯。我继续看线路，你把情况带回去。”他记住了你们的分工。':f.beacon_set?'你与林核对照明和连接门的引导灯。林说：“让这盏灯继续闪，别断掉接应的方向。我守着线路，你去确认其他条件。”他记住了你们的分工。':'你与林核对原有照明。林说：“电路稳定，先保持现在的状态。我守着线路，你去确认其他条件。”他记住了你们的分工。',
 f.power_radio?'You and Lin check the emergency lights along the aisle. “The radio uses most of the power. Follow these lights; leave the ceiling circuit alone. I will watch the wiring while you report back.” He remembers your agreement.':f.beacon_set?'You and Lin check the lights and the door beacon. “Keep that guide light flashing. I will watch the circuit while you check the rest.” He remembers your agreement.':'You and Lin check the existing lighting. “The circuit is steady. Keep it as it is. I will watch it while you check the rest.” He remembers your agreement.'),
 rule('check-aisle','baggage',[...active,...known('zhou-yu','attendant_introduced'),fresh('aisle_confirmed')],[mark('aisle_confirmed'),relation('zhou-yu','aisle-cooperation')],
 '你顺着过道检查货箱绑带，周雨指给你看两侧固定的位置。箱子没有松动，也没有挡住通道。“我继续守在这里。谢谢你先确认，没有急着叫大家走。”她与你约定，收到交接确认前保持原位。',
 'You check the cargo straps along the aisle while Zhou Yu points out the fastenings. The crates are secure and the passage is clear. “I will stay here. Thank you for checking before telling anyone to move.” You agree to hold position until the handover is confirmed.'),
 rule('read-arrival-code','baggage',active,[mark('arrival_code_read')],
 '你翻看调度记录的接应栏：“识别信号：两短一长。由值班调度复核。未确认前，留在车内。”频道和识别信号是两件事：3 频道用于联络，两短一长用于这次接应确认。',
 'The arrival section of the clipboard reads: “Identification: two short, one long. Verify with the duty dispatcher. Stay inside until confirmed.” Channel 3 establishes contact; two short, one long identifies this reception.'),
 rule('retry-arrival','cab',ready,[{type:'fact',id:'arrival_uncertain',value:true}],
 '你复述“一短两长”。许岚马上纠正：“这和记录不符，还不能确认交接。核对的是接应栏，不是频道号。准备工作保留，你可以再试一次，或回去重读记录。”',
 'You repeat “one short, two long.” Xu Lan corrects you: “That does not match the record. We cannot confirm the handover. Check the arrival entry, not the channel number. Your preparations still stand. Try again or reread the clipboard.”'),
 rule('confirm-arrival','cab',ready,[mark('handover_ready'),{type:'fact',id:'arrival_uncertain',value:false},relation('xu-lan','verified-handover')],
 '你复述“两短一长”，并报上照明与通道都已确认。许岚逐项复核：“一致。车内准备可以交接了。回客厢告诉修理工，保持你们刚才约定的照明。”电台的联络仍然保持。',
 'You repeat “two short, one long” and report that the lights and aisle are checked. Xu Lan verifies each point. “It matches. You can hand over the preparations inside. Tell the mechanic and keep the lighting as agreed.” Radio contact remains established.'),
 rule('complete-handover','carriage',[...active,required('introduced',copy('先认识修理工。','Meet the mechanic first.')),required('handover_ready',copy('先到电台核对接应识别信号。','Verify the arrival signal at the radio first.'))],[mark('handover_complete')],
 '你把调度的确认带回客厢。林复述你们核实过的照明安排：“我接着看线路，乘务员守住通道。现在每个人都知道该做什么了。”雨声仍在车外，车内的准备已经交接清楚；你可以在这里停下，或继续查看记录。',
 'You bring the confirmation back to the carriage. Lin repeats your lighting arrangement. “I will keep watch over the circuit; the attendant is watching the aisle. Everyone knows their part now.” Rain continues outside. The preparations inside have been handed over; you can stop here or review your journal.'),
 ]
}
export function receptionActions(save:StorySave,target:string):string[]{
 const f=save.facts
 if(!f.rescue_sent||f.handover_complete)return []
 if(!f.reception_started)return target==='radio'&&f.dispatcher_introduced?['begin-reception']:[]
 if(target==='lin'&&f.introduced)return f.handover_ready?['complete-handover']:!f.circuit_checked?['check-circuit']:[]
 if(target==='zhou-yu'&&f.attendant_introduced&&!f.aisle_confirmed)return ['check-aisle']
 if(target==='record')return ['read-arrival-code']
 if(target==='radio'&&!f.handover_ready&&f.circuit_checked&&f.aisle_confirmed&&f.arrival_code_read)return ['confirm-arrival','retry-arrival']
 return []
}
export function receptionObjective(save:StorySave,locale:Locale):[string,string]|null{
 const f=save.facts,copy=(zh:string,en:string)=>t(locale,zh,en)
 if(!f.rescue_sent)return null
 if(f.handover_complete)return [copy('接应准备已交接','Reception preparations handed over'),copy('照明、通道和接应识别已核实。可以在此停下，或回顾旅途。','Lighting, aisle and identification are verified. You can stop here or revisit the journey.')]
 if(!f.reception_started)return [copy('到电台安排接应','Arrange reception at the radio'),copy('求援引导已成立。到驾驶室与值班调度核实下一步。','Rescue guidance is established. Speak to the duty dispatcher in the cab about the next step.')]
 if(f.handover_ready)return [copy('返回客厢完成交接','Return to hand over preparations'),copy('接应识别已核对。回客厢与林确认照明分工。','Identification is verified. Return to Lin and confirm your lighting agreement.')]
 if(!f.circuit_checked)return [copy('与林核实照明','Check lighting with Lin'),copy('回客厢确认当前供电安排。通道与接应记录也可先核实。','Verify the current power arrangement in the carriage. You can check the aisle and arrival record first if you prefer.')]
 if(!f.aisle_confirmed)return [copy('与乘务员确认通道','Confirm the aisle with the attendant'),copy('走到行李车，与乘务员确认货箱固定和通道状况。','Meet the attendant in the baggage car to check cargo fastenings and the aisle.')]
 if(!f.arrival_code_read)return [copy('查看接应识别信号','Read the arrival signal'),copy('查看行李车调度记录的接应栏，再回到电台核对。','Read the arrival entry on the baggage car clipboard, then return to the radio.')]
 return [copy(f.arrival_uncertain?'重新核对接应信号':'到电台核对接应信号',f.arrival_uncertain?'Retry arrival verification':'Verify the arrival signal'),copy('在驾驶室向值班调度复述记录中的识别信号。记不清时可重读记录，不会丢失准备进度。','Repeat the recorded identification signal to the dispatcher in the cab. You can reread the clipboard without losing preparations.')]
}
export function receptionAdvice(s:Pick<StorySave,'facts'|'locale'>,target:string,locale=s.locale):string|null{
 const f=s.facts,copy=(zh:string,en:string)=>t(locale,zh,en)
 if(!f.reception_started)return null
 if(target==='lin'&&f.introduced)return f.handover_complete?copy('林守着配电箱：“交接已经说清楚了，我继续看着线路。你想回顾什么，我们可以再聊。”','Lin stays by the panel. “The handover is clear. I will keep watching the circuit. We can talk through anything you want to revisit.”'):f.handover_ready?copy('林抬起头：“电台确认了吗？把结果告诉我，我们就按核实的照明安排交接。”','Lin looks up. “Has dispatch confirmed? Tell me, and we can hand over using the lighting arrangement we checked.”'):f.circuit_checked?copy('林说：“照明已经核实，我记得我们的分工。其他条件确认后，再到电台核对信号。”','Lin says, “The lighting is checked; I remember our agreement. Verify the other conditions, then check the signal at the radio.”'):copy('林指着配电箱：“接应前，我们一起把现在的照明核实一遍。”','Lin points to the panel. “Before the handover, let us check the current lighting together.”')
 if(target==='zhou-yu'&&f.attendant_introduced)return f.aisle_confirmed?copy('周雨仍在货箱旁：“通道已经确认，我记得我们的约定。交接确认前，保持原位。”','Zhou Yu remains by the cargo. “The aisle is checked, and I remember our agreement. We will hold position until confirmation.”'):copy('周雨说：“接应前，我们一起看一下货箱绑带和通道。确认好了，我继续在这里看着。”','Zhou Yu says, “Let us check the cargo straps and aisle before the handover. After that I will keep watch here.”')
 if(target==='radio'&&f.dispatcher_introduced)return f.handover_complete?copy('许岚说：“交接准备已经确认。保持现在的安排，我继续协调接应。”','Xu Lan says, “Handover preparations are confirmed. Keep the current arrangement; I will continue coordinating reception.”'):f.handover_ready?copy('许岚说：“识别信号已经核对，回客厢与修理工确认交接就好。”','Xu Lan says, “Identification is verified. Return to the mechanic to confirm the handover.”'):copy('许岚说：“照明、通道、接应识别信号。三项亲自核实后，到这里复述，我们再确认交接。”','Xu Lan says, “Lighting, aisle, identification signal. Verify those three in person, then repeat the signal here so we can confirm the handover.”')
 return null
}
