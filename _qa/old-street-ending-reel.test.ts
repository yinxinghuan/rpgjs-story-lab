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

for(const locale of ['zh','en'] as const)test(`epilogue distinguishes this journey's photograph from the fixed photo folder (${locale})`,()=>{
 const cartridge=oldStreetCartridge(locale),save=createInitialSave(cartridge)
 save.facts.departed=true
 save.facts['photos-returned']=true
 save.facts['darkroom-photo-matched']='committed-photo-hash'
 save.facts['darkroom-photo-choice']='leave'
 save.facts['darkroom-photo-discovery']=locale==='zh'?'花园围栏上留有修补痕迹。':'The garden fence shows repaired sections.'
 completeOldStreetEnding(save,cartridge)
 const before=structuredClone(save),beats=oldStreetEndingReel(save)
 assert.equal(beats.find(b=>b.text===save.facts['darkroom-photo-discovery'])?.art,'journey-photo')
 assert.equal(beats.filter(b=>b.art==='journey-photo').length,2)
 assert.equal(beats.filter(b=>b.art==='photo').length,1)
 assert.deepEqual(save,before)
})
