import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetEntry,OLD_STREET_RELEASED,OLD_STREET_PREVIEW_RELEASED} from '../src/old-street-runtime-contract'
test('new preview is primary while reference, creator and mirror routes remain separate',()=>{
 assert.equal(OLD_STREET_RELEASED,false);assert.equal(OLD_STREET_PREVIEW_RELEASED,true)
 assert.equal(oldStreetEntry('cloud','game.aiwaves.tech',''),true)
 for(const search of ['?story=original','?story=carriage','?story_runtime=legacy','?create_art=sprite','?scene_preview=north-cape'])assert.equal(oldStreetEntry('cloud','game.aiwaves.tech',search),false,search)
 assert.equal(oldStreetEntry('cloud','yinxinghuan.github.io',''),false)
 assert.equal(oldStreetEntry('oldstreet-dev','127.0.0.1',''),true)
})
