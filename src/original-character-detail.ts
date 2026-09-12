import type {Locale,StorySave} from './vendor/original-train/types'

export const introducedLinDetail=(locale:Locale)=>locale==='zh'
 ?'在黑松林线获救的线路巡检员，熟悉木场侧线的实际路况。'
 :'Track inspector rescued at Black Pine, with first-hand knowledge of the timber siding.'

// These two frozen cartridge descriptions precede Lin's visible introduction.
// Project legacy snapshots and replayed receipts without rewriting their history.
const beforeRescue=new Set([
 '在更北边失联，只有一段断续电台呼号证明他还活着。',
 'Missing farther north, with only a broken radio call proving he may be alive.',
])
export function originalCharacterDetail(save:StorySave,person:StorySave['characters'][number]){
 return person.id==='lin-scout'&&save.facts['pine-met']===true&&beforeRescue.has(person.detail??'')
  ?introducedLinDetail(save.locale):person.detail
}
