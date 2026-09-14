import test from 'node:test'
import assert from 'node:assert/strict'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {recordOldStreetInteraction} from '../src/old-street-characters'
for(const locale of ['zh','en'] as const)test(`greeting reflects already changed world (${locale})`,()=>{
 const save=createInitialSave(oldStreetCartridge(locale));save.facts['crates-cleared']=true;save.facts['trolley-borrowed']=true
 const lines=recordOldStreetInteraction(save,'laundry-owner','oldstreet:greet-laundry','stale placeholder','synthetic-greeting')
 assert.equal(lines.length,2);assert.match(lines[1].text,locale==='zh'?/台阶已经通了/:/steps are clear/)
 assert.doesNotMatch(lines[1].text,locale==='zh'?/推车就在旁边|挡着台阶/:/beside you|block the courtyard/)
 const again=recordOldStreetInteraction(save,'laundry-owner','oldstreet:greet-laundry','stale placeholder','synthetic-greeting-again')
 assert.equal(again.length,1);assert.equal(save.characters.length,1)
 assert.equal(save.relationships.length,0)
})
