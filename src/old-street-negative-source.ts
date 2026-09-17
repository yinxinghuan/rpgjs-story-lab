import type {OldStreetCampaign} from './old-street-campaign'
import type {StorySave} from './vendor/original-train/types'

/** New enrollment only. A saved v3 commission without this field keeps its
 * original print-first route; no migration silently adds an errand. */
export function needsRecoveredNegative(campaign?:OldStreetCampaign){return campaign?.photoSource==='roof-negative-v1'}
export function negativeSourceReady(save:Pick<StorySave,'facts'>,campaign?:OldStreetCampaign){
 return !needsRecoveredNegative(campaign)||save.facts['roof-negative-taken']===true
}
export function archiveNegativeLead(locale:'zh'|'en'){
 return locale==='zh'
  ?'整理好的记录附有底片归档单：对应底片在屋顶北侧柜子的双缺口纸套里。从照相馆的楼梯上去，取回后带到放大台冲印。'
  :'The reconstructed file includes a negative index: the matching film is in a double-notched sleeve in the north roof cabinet. Take the studio stairs up, then bring the film to the viewing table for printing.'
}
