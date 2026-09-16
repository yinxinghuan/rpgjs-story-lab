import type {OldStreetHead} from './old-street-head'
import type {StoryBlock} from './vendor/original-train/types'
/** Present exactly the newly committed speech or free attempt; never reconstruct it from a
 * concatenated response or replay another tab's later turn. */
export function oldStreetTurn(before:OldStreetHead,after:OldStreetHead,accepted:boolean):StoryBlock[]{
 if(!accepted||before.id!==after.id||after.version!==before.version+1||before.sceneId!==after.sceneId)return []
 const previous=new Set(before.save.blocks.map(b=>b.id))
 const blocks=after.save.blocks.filter(b=>!previous.has(b.id)&&(b.kind==='narration'||b.kind==='dialogue')&&b.text.trim())
 return blocks.some(b=>b.kind==='dialogue'||typeof b.data?.oldStreetAttemptTarget==='string')?blocks:[]
}
