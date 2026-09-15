import test from 'node:test'
import assert from 'node:assert/strict'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {recordOldStreetInteraction} from '../src/old-street-characters'
import {oldStreetAuthoredTalkReply,oldStreetTalkBlocks} from '../src/old-street-conversation'
test('English concern and recall work without a model and do not match partial words',()=>{
 const save=createInitialSave(oldStreetCartridge('en'))
 recordOldStreetInteraction(save,'photographer','oldstreet:greet-photographer','The stairs lead to the roof.','synthetic-intro')
 const concern='I am worried about the photographs.'
 const reply=oldStreetAuthoredTalkReply(save,'photographer',concern)
 assert.equal(reply,'I hear your concern. There is no need to rush here.')
 save.blocks.push(...oldStreetTalkBlocks(save,'photographer','synthetic-concern',concern,reply!))
 assert.equal(oldStreetAuthoredTalkReply(save,'photographer','Do you remember what I said?'),`Earlier you told me: “${concern}”`)
 assert.equal(oldStreetAuthoredTalkReply(save,'photographer','The remembered box is here.'),null)
 assert.equal(oldStreetAuthoredTalkReply(save,'photographer','unworried'),null)
 assert.equal(save.inventory.length,0)
})
