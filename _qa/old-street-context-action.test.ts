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
