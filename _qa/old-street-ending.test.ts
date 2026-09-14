import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {completeOldStreetEnding} from '../src/old-street-ending'
for(const locale of ['zh','en'] as const)test(`quiet ending only reports actual consequences (${locale})`,()=>{
 const c=oldStreetCartridge(locale),s=createInitialSave(c)
 assert.throws(()=>completeOldStreetEnding(s,c),/NOT_READY/)
 s.facts.departed=true;s.facts['clock-returned']=true;s.facts['photo-recorded']=true
 completeOldStreetEnding(s,c)
 const ending=s.finale.ending!
 assert.equal(s.finale.status,'complete');assert.equal(s.sessionEnded,true)
 assert.equal(ending.generated,false);assert.equal(ending.snapshotId,s.finale.snapshot!.id)
 assert.equal(ending.preserved.length,2);assert.deepEqual(ending.characterEpilogues,[])
 assert.deepEqual(ending.lost,[]);assert.deepEqual(ending.unresolved,[])
 assert.equal(ending.finalImagePrompt,'');assert.equal(s.blocks.filter(b=>b.kind==='image').length,0)
 const before=structuredClone(s);completeOldStreetEnding(s,c);assert.deepEqual(s,before)
})
test('legacy departed draft receives a stable ending without rewriting its story',()=>{
 const c=oldStreetCartridge('zh'),s=createInitialSave(c)
 s.facts.departed=true;s.inventory.push({id:'trolley',label:'推车',count:1})
 const before=structuredClone(s)
 completeOldStreetEnding(s,c)
 assert.deepEqual(s.inventory,before.inventory);assert.deepEqual(s.facts,before.facts)
 assert.deepEqual(s.blocks,before.blocks);assert.deepEqual(s.characters,before.characters)
 assert.deepEqual(s.relationships,before.relationships)
 assert.match(s.finale.ending!.unresolved[0],/推车/)
})
