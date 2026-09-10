import type {Locale,StoryCartridge,StorySave} from './vendor/original-train/types'
import {riverActions,riverBindingRules,riverActionLabel,resolveRiverAction,executeRiverTurn,availableRiverActions,riverRejections} from './original-river-chapter'
import {tunnelActions,tunnelBindingRules,tunnelLabel,resolveTunnelAction,executeTunnelTurn,availableTunnelActions,tunnelRejections} from './original-tunnel-chapter'
export const originalChapterActions=[...riverActions,...tunnelActions]
export const originalChapterBindingRules=[...riverBindingRules,...tunnelBindingRules]
export const originalChapterRejections=[...new Set([...riverRejections,...tunnelRejections])]
type ActionId=typeof originalChapterActions[number]['id']
export const originalChapterLabel=(id:ActionId,locale:Locale)=>originalChapterActions.find(a=>a.id===id)![locale]
export const resolveOriginalChapter=(text:string,locale:Locale)=>resolveRiverAction(text,locale)??resolveTunnelAction(text,locale)
/** Choices follow the actual destination after a chapter portal, without rewriting
 * any historical blocks, effects or original opening choices. */
export function projectOriginalChapterChoices(save:StorySave):StorySave{
 const location=save.map.find(n=>n.current)?.id
 const ids=location==='river-valley'?availableRiverActions(save):location==='tunnel'?availableTunnelActions(save):undefined
 return ids?{...save,choices:ids.map(id=>({id,label:originalChapterLabel(id,save.locale)}))}:save
}
export function executeOriginalChapter(save:StorySave,c:StoryCartridge,id:ActionId){
 const river=riverActions.find(a=>a.id===id),tunnel=tunnelActions.find(a=>a.id===id)
 const result=river?executeRiverTurn(save,c,river.id):executeTunnelTurn(save,c,tunnel!.id)
 return {...result,save:projectOriginalChapterChoices(result.save)}
}
