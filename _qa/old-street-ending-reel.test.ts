import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {completeOldStreetEnding} from '../src/old-street-ending'
import {oldStreetEndingReel} from '../src/old-street-ending-reel'
for(const locale of ['zh','en'] as const)test(`epilogue stages only committed consequences without changing the journey (${locale})`,()=>{
 const cartridge=oldStreetCartridge(locale),save=createInitialSave(cartridge)
 assert.deepEqual(oldStreetEndingReel(save),[])
 save.facts.departed=true;save.facts['clock-returned']=true
 completeOldStreetEnding(save,cartridge)
 save.finale.ending!.characterEpilogues.push({characterId:'unknown',text:'Never introduced'})
 const before=structuredClone(save),beats=oldStreetEndingReel(save)
 assert.equal(beats.filter(b=>b.art==='clock').length,1)
 assert.equal(beats.some(b=>b.art==='photo'),false)
 assert.equal(beats.some(b=>b.text==='Never introduced'),false)
 assert.equal(beats.map(b=>b.text).join(''),save.finale.ending!.preserved.join(''))
 assert.deepEqual(save,before)
 assert.deepEqual(oldStreetEndingReel(save),beats)
})
