import type {OldStreetHead} from './old-street-head'
import type {StoryBlock} from './vendor/original-train/types'
import type {Pending} from './recoverable-session-client'
/** A receipt recovered after reload may already be in the enrollment head.
 * Select only that pending action, never the latest unrelated history entry. */
export function oldStreetRecoveredTurn(pending:Pending|undefined,after:OldStreetHead,accepted:boolean):StoryBlock[]{
 if(!pending||!accepted||pending.id!==after.id||pending.body.sceneId!==after.sceneId||after.version!==pending.body.expected_version+1)return []
 const prefix=pending.body.action_id+':'
 const blocks=after.save.blocks.filter(b=>b.id.startsWith(prefix)&&(b.kind==='narration'||b.kind==='dialogue')&&b.text.trim())
 return blocks.some(b=>b.kind==='dialogue'||typeof b.data?.oldStreetAttemptTarget==='string'||typeof b.data?.oldStreetCampaignStage==='string')?blocks:[]
}
/** Present exactly the newly committed speech or free attempt; never reconstruct it from a
 * concatenated response or replay another tab's later turn. */
export function oldStreetTurn(before:OldStreetHead,after:OldStreetHead,accepted:boolean):StoryBlock[]{
 if(!accepted||before.id!==after.id||after.version!==before.version+1||before.sceneId!==after.sceneId)return []
 const previous=new Set(before.save.blocks.map(b=>b.id))
 const blocks=after.save.blocks.filter(b=>!previous.has(b.id)&&(b.kind==='narration'||b.kind==='dialogue')&&b.text.trim())
 return blocks.some(b=>b.kind==='dialogue'||typeof b.data?.oldStreetAttemptTarget==='string'||typeof b.data?.oldStreetCampaignStage==='string')?blocks:[]
}
