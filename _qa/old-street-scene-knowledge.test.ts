import test from 'node:test'
import assert from 'node:assert/strict'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {resolveDomainAction,applyDomainResolution} from '../src/vendor/original-train/engine/domainRules'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {oldStreetSceneKnowledge} from '../src/old-street-scene-knowledge'
import {oldStreetDialogueContext} from '../server/old-street-dialogue'
import {recordOldStreetInteraction} from '../src/old-street-characters'
for(const locale of ['zh','en'] as const)test(`current scene knowledge follows taken items and never reveals other rooms (${locale})`,()=>{
 const c=oldStreetCartridge(locale),save=createInitialSave(c)
 const move=(scene:string)=>save.map.forEach(n=>{n.current=n.id===scene})
 const act=(id:string)=>{const r=resolveDomainAction(save,c,'oldstreet:'+id)!;assert.equal(r.status,'accepted');applyDomainResolution(save,c,r)}
 move('laundry');recordOldStreetInteraction(save,'laundry-owner','oldstreet:greet-laundry','hello','intro')
 const context=()=>oldStreetDialogueContext({id:'synthetic',version:0,mapVersion:'oldstreet-blockout-2',sceneId:'laundry',position:{x:200,y:300},save},'laundry-owner')
 const state=()=>context().knowledge.find(k=>k.id==='visible:trolley')!.text
 assert.doesNotMatch(state(),/empty|空/)
 act('borrow-trolley');assert.match(state(),/empty|空/)
 act('return-trolley');assert.doesNotMatch(state(),/empty|空/)
 assert.deepEqual(context().knowledge.filter(k=>k.id.startsWith('visible:')).map(k=>k.id),['visible:clock-display','visible:trolley'])
 assert.doesNotMatch(context().knowledge.find(k=>k.id==='visible:clock-display')!.text,/旧钟|returned clock/)
 move('shed');act('take-clock');move('laundry');act('return-clock')
 assert.match(context().knowledge.find(k=>k.id==='visible:clock-display')!.text,/已归还的旧钟|returned clock/)
 move('cellar');assert.doesNotMatch(oldStreetSceneKnowledge(save,'cellar')[0].text,/Empty|空/)
 act('take-photos');assert.match(oldStreetSceneKnowledge(JSON.parse(JSON.stringify(save)),'cellar')[0].text,/Empty|空/)
 const before=JSON.stringify(save)
 assert.deepEqual(oldStreetSceneKnowledge(save,'missing-room'),[])
 const shop=oldStreetSceneKnowledge(save,'shop')
 assert.ok(!shop.map(k=>k.text).join(' ').includes(locale==='zh'?'密封信':'letter'))
 assert.equal(JSON.stringify(save),before)
})
for(const locale of ['zh','en'] as const)test(`key context follows lending, return before use, and completed collection (${locale})`,()=>{
 const c=oldStreetCartridge(locale),save=createInitialSave(c)
 const move=(scene:string)=>save.map.forEach(n=>{n.current=n.id===scene})
 const act=(id:string)=>{const r=resolveDomainAction(save,c,'oldstreet:'+id)!;assert.equal(r.status,'accepted');applyDomainResolution(save,c,r);if(['borrow-key','return-key'].includes(id))recordOldStreetInteraction(save,'watchmaker','oldstreet:'+id,'result',id+save.blocks.length)}
 move('shed');recordOldStreetInteraction(save,'watchmaker','oldstreet:greet-watchmaker','hello','intro')
 const context=()=>oldStreetDialogueContext({id:'synthetic',version:0,mapVersion:'oldstreet-furniture-3',sceneId:'shed',position:{x:200,y:300},save},'watchmaker')
 const status=()=>context().knowledge.find(k=>k.id==='key-status')!.text
 act('borrow-key');assert.match(status(),/持有|currently carries/)
 act('return-key');assert.match(status(),/交还|has returned/);assert.match(status(),/仍锁着|still locked/)
 act('borrow-key');assert.match(status(),/持有|currently carries/)
 move('shop');act('unlock-letter');move('shed');act('return-key')
 assert.match(status(),/已经打开|compartment is open/);assert.doesNotMatch(status(),/still locked|仍锁着/)
 move('shop');act('take-letter');move('shed')
 assert.match(status(),/不再需要|no longer needs/);assert.match(status(),/交还|has returned/)
 const before=JSON.stringify(save),restored=JSON.parse(before)
 assert.deepEqual(oldStreetSceneKnowledge(restored,'shed'),oldStreetSceneKnowledge(save,'shed'))
 assert.equal(context().knowledge.filter(k=>k.id==='scenery:shed-bench').length,1)
 assert.ok(!oldStreetSceneKnowledge(save,'shop').some(k=>k.id==='scenery:shed-bench'))
 assert.equal(JSON.stringify(save),before)
})
