import type {DomainActionRule,DomainRequirement,DomainEffect,Locale,StorySave} from './vendor/original-train/types'

/** Candidate content for the next story version. Not installed in existing saves.
 * Uses the existing Story Core commands; contains no second reducer or storage. */
export const explorationCircuitFacts={ 'explore-fuse-slot':'bag','explore-door-braced':false,'explore-release-used':false,'explore-stop-observed':false } as const
export function explorationCircuitRules(locale:Locale):DomainActionRule[]{
 const t=(zh:string,en:string)=>locale==='zh'?zh:en
 const fact=(id:string,equals:string|boolean,reason:string):DomainRequirement=>({type:'fact',id,equals,reason})
 const slot=(value:string)=>fact('explore-fuse-slot',value,t('先检查保险丝现在装在哪里。','Check where the fuse is installed first.'))
 const mark=(id:string,value:string|boolean):DomainEffect=>({type:'fact',id,value})
 const fuse={id:'explore-fuse',label:t('可回收保险丝','Reusable fuse'),count:1,rarity:'common' as const,detail:t('可在断电后取回，换到另一条支路。','Can be removed with power off and moved to the other circuit.'),effect:''}
 const rule=(id:string,requirements:DomainRequirement[],effects:DomainEffect[],zh:string,en:string):DomainActionRule=>({id,intent:id,match:[id],requirements:[{type:'map',nodeId:id==='explore-inside-release'?'explore-signal-inside':'explore-power',reason:t('先走到对应的装置旁。','Approach the relevant device first.')},...requirements],effects,successText:t(zh,en),successChoices:['','','']})
 const rules:DomainActionRule[]=[]
 for(const circuit of ['light','lock']){
  const place=t(circuit==='light'?'照明槽':'门锁槽',circuit==='light'?'lighting socket':'door-lock socket')
  rules.push(rule('explore-insert-'+circuit,[slot('bag'),{type:'item',id:fuse.id,minCount:1,reason:t('需要背包中的保险丝。','The fuse must be in your inventory.')}],[{type:'inventory',action:'remove',itemId:fuse.id,count:1},mark('explore-fuse-slot',circuit)],`你将保险丝装进${place}，合上开关。${circuit==='light'?'灯亮了。':'锁舌缩回，门可以打开了。'}`,`You fit the fuse into the ${place} and switch on. ${circuit==='light'?'The lights come on.':'The latch retracts; the door can open.'}`))
  rules.push(rule('explore-remove-'+circuit,[slot(circuit)],[mark('explore-fuse-slot','bag'),{type:'inventory',action:'add',itemId:fuse.id,count:1,item:fuse}],`你先断电，再从${place}取回保险丝。`,`You switch off, then remove the fuse from the ${place}.`))
 }
 rules.push(rule('explore-observe-stop',[slot('light'),fact('explore-stop-observed',false,t('你已看清门框上的止挡。','You have already inspected the door stop.'))],[mark('explore-stop-observed',true)],'灯光照亮门框内侧的凹槽。门撑可以卡在这里，让门在断电后保持打开。','The light reveals a groove inside the frame. A door wedge could hold the door open after power is removed.'))
 rules.push(rule('explore-brace-door',[slot('lock'),fact('explore-stop-observed',true,t('先看清门框的止挡位置。','Inspect the stop in the door frame first.')),fact('explore-door-braced',false,t('门已经撑住了。','The door is already braced.')),{type:'item',id:'explore-wedge',minCount:1,reason:t('需要找到门撑。','Find a door wedge first.')}],[{type:'inventory',action:'remove',itemId:'explore-wedge',count:1},mark('explore-door-braced',true)],'你把门撑卡进止挡。现在取回保险丝，门也不会关上。','You secure the wedge in the stop. The door will stay open when the fuse is removed.'))
 rules.push(rule('explore-inside-release',[{type:'map',nodeId:'explore-signal-inside',reason:t('释放杆只能从门内操作。','The release is accessible only from inside.')}],[mark('explore-release-used',true)],'你压下门内侧的机械释放杆，门锁脱开。','You press the mechanical release inside the doorway; the latch disengages.'))
 return rules
}
/** World projection derives light/door state from the same facts as the rules.
 * Scene/entity admission must restrict the release to the inside of the door. */
export function explorationCircuitState(save:Pick<StorySave,'facts'>){
 const f=save.facts,slot=f['explore-fuse-slot']
 return {lightOn:slot==='light',lockPowered:slot==='lock',doorOpen:slot==='lock'||f['explore-door-braced']===true||f['explore-release-used']===true,fuseInBag:slot==='bag'}
}
