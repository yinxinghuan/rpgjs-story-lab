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
 assert.deepEqual(context().knowledge.filter(k=>k.id.startsWith('visible:')).map(k=>k.id),['visible:trolley'])
 move('cellar');assert.doesNotMatch(oldStreetSceneKnowledge(save,'cellar')[0].text,/Empty|空/)
 act('take-photos');assert.match(oldStreetSceneKnowledge(JSON.parse(JSON.stringify(save)),'cellar')[0].text,/Empty|空/)
 const before=JSON.stringify(save)
 assert.deepEqual(oldStreetSceneKnowledge(save,'missing-room'),[])
 const shop=oldStreetSceneKnowledge(save,'shop')
 assert.ok(!shop.map(k=>k.text).join(' ').includes(locale==='zh'?'密封信':'letter'))
 assert.equal(JSON.stringify(save),before)
})
