import test from 'node:test'
import assert from 'node:assert/strict'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {recordOldStreetInteraction} from '../src/old-street-characters'
import {oldStreetTalkBlocks,oldStreetConversationHistory} from '../src/old-street-conversation'
test('history restores paired turns, excludes current exchange, deduplicates without deleting archived turns',()=>{
 const save=createInitialSave(oldStreetCartridge('en'))
 recordOldStreetInteraction(save,'watchmaker','oldstreet:greet-watchmaker','Hello','intro')
 assert.deepEqual(oldStreetConversationHistory(save,'zhou-watchmaker'),[])
 for(let i=0;i<6;i++)save.blocks.push(...oldStreetTalkBlocks(save,'watchmaker','turn-'+i,'Question '+i,'Reply '+i))
 const current=save.blocks.slice(-2)
 save.blocks.push(...current)
 const before=JSON.stringify(save),restored=JSON.parse(before)
 assert.deepEqual(oldStreetConversationHistory(restored,'zhou-watchmaker',current).map(r=>r.id),['turn-0','turn-1','turn-2','turn-3','turn-4'])
 assert.equal(oldStreetConversationHistory(restored,'zhou-watchmaker').at(-1)?.id,'turn-5')
 assert.deepEqual(oldStreetConversationHistory(restored,'lan-laundry'),[])
 save.blocks.push(oldStreetTalkBlocks(save,'watchmaker','pending','Incomplete','Not committed')[0])
 assert.equal(oldStreetConversationHistory(save,'zhou-watchmaker').at(-1)?.id,'turn-5')
 assert.equal(JSON.stringify(restored),before)
 assert.deepEqual(oldStreetConversationHistory(createInitialSave(oldStreetCartridge('en')),'zhou-watchmaker'),[])
})
