import type {Locale,StoryCartridge,StorySave} from './vendor/original-train/types'
import {riverActions,riverBindingRules,resolveRiverAction,executeRiverTurn,availableRiverActions,riverRejections} from './original-river-chapter'
import {tunnelActions,tunnelBindingRules,resolveTunnelAction,executeTunnelTurn,availableTunnelActions,tunnelRejections} from './original-tunnel-chapter'
import {yardActions,yardBindingRules,resolveYardAction,executeYardTurn,availableYardActions,yardRejections} from './original-yard-chapter'
import {pineActions,pineBindingRules,resolvePineAction,executePineTurn,pineChoices,pineRejections} from './original-pine-chapter'
import {passActions,passBindingRules,resolvePassAction,executePassTurn,passChoices,passRejections} from './original-pass-chapter'
import {lastTrainToDawn,lastTrainToDawnEn} from './vendor/original-train/cartridges/lastTrainToDawn'
export const originalChapterActions=[...riverActions,...tunnelActions,...yardActions,...pineActions,...passActions]
export const originalChapterBindingRules=[...riverBindingRules,...tunnelBindingRules,...yardBindingRules,...pineBindingRules,...passBindingRules]
export const originalChapterRejections=[...new Set([...riverRejections,...tunnelRejections,...yardRejections,...pineRejections,...passRejections])]
type ActionId=typeof originalChapterActions[number]['id']
export const originalChapterLabel=(id:ActionId,locale:Locale)=>originalChapterActions.find(a=>a.id===id)![locale]
export const resolveOriginalChapter=(text:string,locale:Locale,save?:StorySave)=>resolveRiverAction(text,locale)??resolveTunnelAction(text,locale)??resolveYardAction(text,locale)??resolvePineAction(text,locale)??resolvePassAction(text,locale,save,locale==='en'?lastTrainToDawnEn:lastTrainToDawn)
/** Choices follow the actual destination after a chapter portal, without rewriting
 * any historical blocks, effects or original opening choices. */
export function projectOriginalChapterChoices(save:StorySave):StorySave{
 const location=save.map.find(n=>n.current)?.id
 if(location==='mountain-pass')return {...save,choices:passChoices(save,save.locale==='en'?lastTrainToDawnEn:lastTrainToDawn)}
 if(location==='pine-line')return {...save,choices:pineChoices(save,save.locale==='en'?lastTrainToDawnEn:lastTrainToDawn)}
 const ids=location==='river-valley'?availableRiverActions(save):location==='tunnel'?availableTunnelActions(save):location==='graystone-yard'?availableYardActions(save):undefined
 return ids?{...save,choices:ids.map(id=>({id,label:originalChapterLabel(id,save.locale)}))}:save
}
export function executeOriginalChapter(save:StorySave,c:StoryCartridge,id:ActionId){
 const river=riverActions.find(a=>a.id===id),tunnel=tunnelActions.find(a=>a.id===id),yard=yardActions.find(a=>a.id===id),pine=pineActions.find(a=>a.id===id),pass=passActions.find(a=>a.id===id)
 const result=river?executeRiverTurn(save,c,river.id):tunnel?executeTunnelTurn(save,c,tunnel.id):yard?executeYardTurn(save,c,yard.id):pine?executePineTurn(save,c,pine.id):executePassTurn(save,c,pass!.id)
 return {...result,save:projectOriginalChapterChoices(result.save)}
}
