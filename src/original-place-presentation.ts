import type {Locale,StoryBlock,StorySave} from './vendor/original-train/types'

export const originalBridgePlace=(locale:Locale)=>locale==='zh'?'洪水桥 · 近岸检修台':'Flood bridge · Near-bank platform'
export const originalPlaceLabel=(sceneId:string,save:Pick<StorySave,'location'|'locale'>)=>sceneId==='train-at-flood-bridge'?originalBridgePlace(save.locale):save.location

/** A source map region contains both the near bank and junction interior.
 * Correct only automatic receipts belonging to the authored town departure;
 * retain the eight original region identities and all other historical prose. */
export function originalPlaceBlocks(blocks:StoryBlock[],locale:Locale):StoryBlock[]{
 const turns=new Set(blocks.flatMap(b=>{const m=/^town-(\d+)-town-depart$/.exec(b.id);return m?[m[1]]:[]}))
 const destination=locale==='zh'?'黎明枢纽':'Dawn Junction'
 return blocks.flatMap(b=>{
  const transition=/^transition-(\d+)$/.exec(b.id)
  if(transition&&turns.has(transition[1])&&b.kind==='narration'&&b.data?.destination===destination)return []
  const effect=/^effect-(\d+)-\d+$/.exec(b.id)
  if(effect&&turns.has(effect[1])&&b.kind==='event'&&b.text===(locale==='zh'?'抵达：':'Arrived: ')+destination)
   return [{...b,text:(locale==='zh'?'抵达：':'Arrived: ')+originalBridgePlace(locale)}]
  return [b]
 })
}
