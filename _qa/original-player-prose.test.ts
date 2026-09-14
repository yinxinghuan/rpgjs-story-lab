import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {originalPlayerProse,originalProseCorrections} from '../src/original-player-prose'
import {originalReadingBlocks} from '../src/original-game-projection'
import {originalTrainRuntime} from '../server/original-train-runtime'
test('retained authored bridge prose is corrected without rewriting the save or a player quotation',()=>{
 const h=originalTrainRuntime(()=>true).initial('zh',randomUUID()),old=originalProseCorrections[0][0]
 h.save.blocks=[{id:'bridge-12-bridge-arrange',kind:'event',text:old},{id:'player-13',kind:'dialogue',text:old}]
 const before=structuredClone(h.save),shown=originalReadingBlocks(h.save)
 assert.equal(shown[0].text,originalProseCorrections[0][1]);assert.equal(shown[1].text,old);assert.deepEqual(h.save,before)
})
test('copy corrections are idempotent and do not remove stated losses from ordinary story prose',()=>{
 for(const [old,clean] of originalProseCorrections){assert.equal(originalPlayerProse(old),clean);assert.equal(originalPlayerProse(clean),clean)}
 const loss='列车永久留在桥上。我们失去了备用软管。';assert.equal(originalPlayerProse(loss),loss)
})
