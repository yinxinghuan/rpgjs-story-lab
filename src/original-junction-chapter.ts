import type {Locale,ParsedCommand,StoryCartridge,StorySave} from './vendor/original-train/types'
import {applyParsedScene} from './vendor/original-train/engine/reducer'
import {canStartTrueEnding} from './vendor/original-train/engine/endingDirector'
import {originalEndingCartridge} from './original-ending-capabilities'
import {originalEndingOptionIds,availableOriginalEndingOptions,originalEndingSpec,originalEndingCosts} from './original-ending-options'
import {lastTrainToDawn,lastTrainToDawnEn} from './vendor/original-train/cartridges/lastTrainToDawn'
import {LabError} from './journey-runtime'
export const junctionActions=[{id:'junction-review',zh:'在枢纽摊开旅程记录与未来代价',en:'Lay out the journey record and future costs at the junction'},...originalEndingOptionIds.map(id=>({id:`junction-${id}`,zh:`选择「${originalEndingSpec(lastTrainToDawn,id)!.title}」`,en:`Choose “${originalEndingSpec(lastTrainToDawnEn,id)!.title}”`}))]
export const junctionLabel=(id:string,l:Locale)=>junctionActions.find(a=>a.id===id)![l]
const normalize=(s:string)=>s.trim().toLowerCase().replace(/[\s，。！？,.!?]/g,'')
export const junctionBindingRules=junctionActions.map(a=>({id:a.id,effects:[]}))
export const junctionRejections=['ORIGINAL_JUNCTION_REQUIRED','ORIGINAL_JUNCTION_REVIEWED','ORIGINAL_JUNCTION_UNREVIEWED','ORIGINAL_JUNCTION_DECIDED','ORIGINAL_JUNCTION_OPTION_UNAVAILABLE','ORIGINAL_JUNCTION_ENDING_NOT_READY'] as const
export function junctionRejection(save:StorySave,id:string,c:StoryCartridge){
 if(save.map.find(n=>n.current)?.id!=='dawn-junction'||!save.facts['chapter-bridge-complete']||!save.facts['junction-arrived'])return 'ORIGINAL_JUNCTION_REQUIRED'
 if(save.facts['junction-ending-choice']||save.finale.status!=='idle')return 'ORIGINAL_JUNCTION_DECIDED'
 if(id==='junction-review')return save.facts['junction-options-reviewed']?'ORIGINAL_JUNCTION_REVIEWED':undefined
 if(!save.facts['junction-options-reviewed'])return 'ORIGINAL_JUNCTION_UNREVIEWED'
 if(!canStartTrueEnding(save,originalEndingCartridge(save,c)))return 'ORIGINAL_JUNCTION_ENDING_NOT_READY'
 if(!availableOriginalEndingOptions(save,c).some(spec=>id==='junction-'+spec.id))return 'ORIGINAL_JUNCTION_OPTION_UNAVAILABLE'
}
export function junctionChoices(save:StorySave,c:StoryCartridge){return junctionActions.filter(a=>!junctionRejection(save,a.id,c)).map(a=>{
 const spec=a.id==='junction-review'?undefined:originalEndingSpec(c,a.id.slice('junction-'.length))
 return {id:a.id,label:a[c.locale]+(spec?(c.locale==='zh'?'；代价：':' — Cost: ')+originalEndingCosts(spec,originalEndingCartridge(save,c)).join(c.locale==='zh'?'；':'; '):'')}
})}
export const resolveJunctionAction=(text:string,l:Locale,save?:StorySave,c?:StoryCartridge)=>junctionActions.find(a=>[a[l],...(save&&c?junctionChoices(save,c).filter(choice=>choice.id===a.id).map(choice=>choice.label):[])].some(label=>normalize(label)===normalize(text)))?.id
export function executeJunctionTurn(save:StorySave,c:StoryCartridge,id:string){
 const error=junctionRejection(save,id,c);if(error)throw new LabError(error,409)
 const s=(zh:string,en:string)=>c.locale==='zh'?zh:en,commands:ParsedCommand[]=[];let text=''
 if(id==='junction-review'){
  text=(save.facts['bridge-train-fate']==='anchored'?s('你们已经步行抵达，列车永久固定在桥上。','You have arrived on foot, and the train is permanently anchored at the bridge.'):s('列车已经越过洪水桥，实际抵达枢纽。','The train has crossed the flood bridge and reached the junction.'))+' '+s('你摊开一路留下的岗位、物资与关系记录。有人想继续接走沿线的幸存者，有人想在这里安顿。你们逐项核对还能承担的承诺，也把必须放弃的东西写在旁边。','You lay out the duty, supply and relationship record. Some want to keep collecting survivors along the line; others want to settle here. Together you review the commitments you can still carry, writing what each would cost alongside it.')
  commands.push({type:'fact',id:'junction-options-reviewed',value:true},{type:'state',value:s('选择能够承担代价的最终归属','Choose a final arrangement whose costs you accept')})
 }else{
  const spec=availableOriginalEndingOptions(save,c).find(spec=>id==='junction-'+spec.id)!,costs=originalEndingCosts(spec,originalEndingCartridge(save,c))
  text=s(`你们选择「${spec.title}」。${spec.thesis} 承诺随之写下：${costs.join('；')}。你把这份决定留在路册最后一页，等着在场的人依次签名。`,`You choose “${spec.title}”. ${spec.thesis} The commitment includes: ${costs.join('; ')}. You leave the decision on the final page of the route book for those present to sign.`)
  commands.push({type:'fact',id:'junction-ending-choice',value:spec.id},{type:'fact',id:'junction-ending-capabilities',value:spec.capabilityIds.join('|')},{type:'fact',id:'true-ending-ready',value:true},{type:'true_ending',reason:s(`已决定最终归属：${spec.title}`,`Final arrangement chosen: ${spec.title}`)})
 }
 const next=applyParsedScene(structuredClone(save),{blocks:[{id:`junction-${save.scene+1}-${id}`,kind:'event',text}],commands,raw:text},c,junctionLabel(id,c.locale))
 next.choices=next.finale.status==='idle'?junctionChoices(next,c):[]
 return {save:next,source:'author' as const,acceptedActionId:id}
}
