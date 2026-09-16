import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetTurn} from '../src/old-street-turn'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {recordOldStreetInteraction} from '../src/old-street-characters'
import type {OldStreetHead} from '../src/old-street-head'
test('turn preserves introduction and named speech without repeating history or later recovery',()=>{
 const before:OldStreetHead={id:'synthetic',version:2,mapVersion:'oldstreet-blockout-2',sceneId:'photo',position:{x:100,y:100},save:createInitialSave(oldStreetCartridge('zh'))}
 const after=structuredClone(before);after.version++
 recordOldStreetInteraction(after.save,'photographer','oldstreet:greet-photographer','楼梯通向屋顶。','turn-3')
 const result=oldStreetTurn(before,after,true)
 assert.equal(result.length,2);assert.equal(result[0].kind,'narration');assert.equal(result[1].speaker,'许青');assert.equal(result[1].text,'楼梯通向屋顶。')
 assert.deepEqual(oldStreetTurn(before,after,false),[])
 assert.deepEqual(oldStreetTurn(before,{...after,version:4},true),[])
 assert.deepEqual(oldStreetTurn(before,{...after,sceneId:'roof'},true),[])
 assert.deepEqual(oldStreetTurn(after,after,true),[])
})

test('a committed free attempt enters the short response area, while unrelated notices stay out',()=>{
 const before:OldStreetHead={id:'attempt-turn',version:2,mapVersion:'oldstreet-furniture-3',sceneId:'shop',position:{x:100,y:100},save:createInitialSave(oldStreetCartridge('zh'))}
 const after=structuredClone(before);after.version++
 after.save.blocks.push({id:'attempt-3',kind:'narration',text:'你俯身查看抽屉。',data:{oldStreetAttemptTarget:'drawer',input:'俯身看看',outcome:'observed'}})
 assert.equal(oldStreetTurn(before,after,true)[0]?.text,'你俯身查看抽屉。')
 assert.deepEqual(oldStreetTurn(before,after,false),[])
 assert.deepEqual(oldStreetTurn(after,after,true),[])
 const ordinary=structuredClone(after);ordinary.save.blocks.at(-1)!.data=undefined
 assert.deepEqual(oldStreetTurn(before,ordinary,true),[])
})

test('authored handover keeps stage directions outside NPC speech in both languages',()=>{
 for(const locale of ['zh','en'] as const){
  const save=createInitialSave(oldStreetCartridge(locale))
  const text=locale==='zh'?'修表师把旧钟递来：“洗衣店的，替我带过去吧。”':'The watchmaker hands you the clock. “It belongs to the laundry. Could you take it back?”'
  const result=recordOldStreetInteraction(save,'watchmaker','oldstreet:take-clock',text,'handover')
  assert.equal(result[0].kind,'narration')
  assert.equal(result[1].kind,'narration');assert.equal(result[1].speaker,undefined)
  assert.equal(result[2].kind,'dialogue');assert.equal(result[2].speaker,locale==='zh'?'老周':'Zhou')
  assert.ok(!/修表师|watchmaker/.test(result[2].text))
  assert.equal(new Set(result.map(b=>b.id)).size,result.length)
  const consent=recordOldStreetInteraction(save,'laundry-owner','oldstreet:consent-clock',locale==='zh'?'店主同意留下旧钟的照片和来历。':'The owner agrees to a photo of the clock and its history.','consent')
  assert.ok(consent.every(b=>b.kind==='narration'&&!b.speaker))
 }
})
