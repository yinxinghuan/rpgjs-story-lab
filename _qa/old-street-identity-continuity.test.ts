import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {recordOldStreetInteraction} from '../src/old-street-characters'
import {oldStreetTalkBlocks} from '../src/old-street-conversation'
import {completeOldStreetEnding} from '../src/old-street-ending'
import type {StorySave} from '../src/vendor/original-train/types'

for(const locale of ['zh','en'] as const)test(`restored journey names agree across actions, chat, relationships and ending (${locale})`,()=>{
 const cartridge=oldStreetCartridge(locale),save=createInitialSave(cartridge)
 // A past authored cast has already introduced these names. Current cartridge
 // labels intentionally differ, reproducing a content-update continuity bug.
 const residents=[
  {entity:'watchmaker',id:'zhou-watchmaker',name:locale==='zh'?'弗兰克':'Frank',action:'return-key'},
  {entity:'laundry-owner',id:'lan-laundry',name:locale==='zh'?'伊芙琳':'Evelyn',action:'return-clock'},
 ]
 for(const p of residents){
  save.characters.push({id:p.id,name:p.name,role:'resident',vitality:100,stress:0,skills:[],status:'known',origin:'cartridge',updatedAtScene:save.scene})
  save.blocks.push({id:p.id+':old-intro',kind:'narration',text:locale==='zh'?`“我叫${p.name}。”`:`“My name is ${p.name}.”`,data:{characterId:p.id}})
 }
 const restored=JSON.parse(JSON.stringify(save)) as StorySave
 const history=structuredClone(restored.blocks),characters=structuredClone(restored.characters)
 for(const p of residents){
  const blocks=recordOldStreetInteraction(restored,p.entity,'oldstreet:'+p.action,locale==='zh'?'她说：“谢谢。”':'They say, “Thank you.”',p.id+':return')
  assert.equal(blocks.filter(b=>b.kind==='dialogue')[0].speaker,p.name)
  assert.ok(!blocks.some(b=>b.id.endsWith(':introduction')))
  assert.equal(oldStreetTalkBlocks(restored,p.entity,p.id+':chat','Hello','Hello again')[1].speaker,p.name)
  assert.equal(restored.relationships.find(r=>r.characterId===p.id)?.actor,p.name)
 }
 assert.deepEqual(restored.characters,characters)
 assert.deepEqual(restored.blocks.slice(0,history.length),history)
 restored.facts.departed=true;restored.facts['clock-returned']=true
 completeOldStreetEnding(restored,cartridge)
 const epilogues=restored.finale.ending!.characterEpilogues
 assert.equal(epilogues.length,2)
 for(const p of residents)assert.ok(epilogues.find(e=>e.characterId===p.id)?.text.includes(p.name))
 assert.ok(!epilogues.some(e=>e.characterId==='xu-photographer'))
 assert.deepEqual(restored.characters,characters)
 const completed=JSON.stringify(restored.finale)
 completeOldStreetEnding(restored,cartridge)
 assert.equal(JSON.stringify(restored.finale),completed)
})
