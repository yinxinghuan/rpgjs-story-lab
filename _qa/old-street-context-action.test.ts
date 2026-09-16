import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetContextAction} from '../src/old-street-context-action'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {oldStreetSpatialPlan} from '../src/old-street-space'
import {recordOldStreetInteraction} from '../src/old-street-characters'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
for(const locale of ['zh','en'] as const)test(`nearby actions ${locale}: introduce, return, then converse without repeat greeting`,()=>{
 const save=createInitialSave(oldStreetCartridge(locale));save.map.forEach(m=>m.current=m.id==='laundry')
 const entity=oldStreetSpatialPlan(save).entities.find(e=>e.id==='laundry-owner')!
 assert.deepEqual(oldStreetContextAction(save,entity).primary,{kind:'action',id:'oldstreet:greet-laundry'})
 save.blocks.push(...recordOldStreetInteraction(save,entity.id,'oldstreet:greet-laundry','hello','intro'))
 assert.deepEqual(oldStreetContextAction(save,entity).primary,{kind:'talk'})
 save.inventory.push({id:'clock',label:'Clock',count:1,rarity:'common'})
 assert.deepEqual(oldStreetContextAction(save,entity).primary,{kind:'action',id:'oldstreet:return-clock'})
 assert.ok(!oldStreetContextAction(save,entity).actions.includes('oldstreet:greet-laundry'))
 save.inventory=[];save.facts['clock-returned']=true;save.facts['clock-consent']=true
 assert.deepEqual(oldStreetContextAction(save,entity).primary,{kind:'talk'})
})
test('blocked exit has an inspect explanation without mutation',()=>{
 const save=createInitialSave(oldStreetCartridge('zh'));save.map.forEach(m=>m.current=m.id==='yard')
 const entity=oldStreetSpatialPlan(save).entities.find(e=>e.id==='door:cellar-steps:yard')!
 const before=JSON.stringify(save),context=oldStreetContextAction(save,entity)
 assert.equal(context.primary.kind,'inspect');assert.match(context.reason,/旧箱/);assert.equal(JSON.stringify(save),before)
})
for(const locale of ['zh','en'] as const)test(`exhausted drawer ${locale} remains observable without hiding available clock inspection`,()=>{
 const save=createInitialSave(oldStreetCartridge(locale));save.map.forEach(m=>m.current=m.id==='shop')
 save.facts['drawer-open']=true;save.facts['lens-taken']=true
 save.inventory.push({id:'lens',label:'Lens',count:1,rarity:'common'})
 const entity=oldStreetSpatialPlan(save).entities.find(e=>e.id==='drawer')!
 const before=JSON.stringify(save),context=oldStreetContextAction(save,entity)
 assert.equal(context.primary.kind,'inspect');assert.match(context.reason,locale==='zh'?/收据/:/receipt/)
 assert.equal(JSON.stringify(save),before)
 save.inventory.push({id:'clock',label:'Clock',count:1,rarity:'common'})
 assert.deepEqual(oldStreetContextAction(save,entity).primary,{kind:'action',id:'oldstreet:inspect-clock'})
})

test('an emptied letter compartment describes the actual result instead of a generic rule rejection',()=>{
 const save=createInitialSave(oldStreetCartridge('en'))
 save.facts['letter-unlocked']=true;save.facts['letter-taken']=true
 save.location='Watch shop';save.map.forEach(node=>node.current=node.id==='shop')
 const action=oldStreetContextAction(save,{id:'letter-compartment',actions:['oldstreet:unlock-letter','oldstreet:take-letter']})
 assert.equal(action.primary.kind,'inspect');assert.match(action.reason,/sealed letter.*bag/)
})
