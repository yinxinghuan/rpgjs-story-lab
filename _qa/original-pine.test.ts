import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan,originalChapterMapVersion} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {originalCharacterPresent} from '../src/original-character-presence'
import {pineSidingOpened} from '../src/original-pine-chapter'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-pine-owner'
function setup(gate:OriginalPresentationGate=()=>true){const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db,s:new OriginalTrainAuthority(db,gate)}}
function request(h:OriginalHead,id:string,free=false){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id),text=chapter?originalChapterLabel(chapter.id,h.save.locale).replace(/\s*[（(][^()（）]*[）)]\s*$/,''):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0];return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,...(free?{type:'free-input',text}:{type:'action',action:id})}}
async function steps(s:OriginalTrainAuthority,h:OriginalHead,ids:string[]){for(const id of ids)h=(await s.action(owner,h.id,request(h,id))).head;return h}
async function arrive(s:OriginalTrainAuthority,locale:'zh'|'en'='en'){return steps(s,s.create(owner,randomUUID(),locale),['repair-starter','commit-forest-route'])}
for(const locale of ['zh','en'] as const)for(const method of ['reverse','siding'] as const)for(const escort of ['invite','stay'] as const)test(`pine ${locale}/${method}/${escort}: original opening to mountain preserves key, Lin and route facts`,async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,locale);const arrival=structuredClone(h)
 assert.deepEqual(h.save.characters.map(c=>c.id),['ada-mechanic']);assert.ok(h.save.choices.some(c=>c.id==='pine-inspect'))
 h=await steps(s,h,['pine-inspect']);assert.ok(!h.save.characters.some(c=>c.id==='lin-scout'));assert.ok(h.save.choices.every(c=>!c.label.includes(locale==='zh'?'林澈':'Lin')))
 const ids=method==='reverse'?['pine-reverse']:['use-master-switch-key','pine-confirm-siding']
 for(const id of ids){const b=request(h,id,true),r=await s.action(owner,h.id,b);h=r.head;assert.deepEqual(await new OriginalTrainAuthority(db,()=>true).action(owner,h.id,b),r)}
 assert.equal(h.save.stats.fuel,arrival.save.stats.fuel-(method==='siding'?8:0));assert.equal(h.save.stats.condition,arrival.save.stats.condition-(method==='reverse'?12:0))
 assert.equal(h.save.facts['switch-key-uses'],Number(arrival.save.facts['switch-key-uses']??0)+(method==='siding'?1:0));assert.equal(h.save.facts['pine-clear-method'],method)
 const settled=structuredClone(h);await assert.rejects(s.action(owner,h.id,request(h,'pine-reverse')),/ORIGINAL_PINE_DECIDED/);assert.deepEqual(s.get(owner,h.id),settled)
 h=await steps(s,h,['pine-meet']);assert.equal(h.save.characters.find(c=>c.id==='lin-scout')?.status,'known');assert.ok(!h.save.partyMemberIds.includes('lin-scout'))
 assert.ok(h.save.blocks.some(b=>b.text.includes(locale==='zh'?'林澈，线路巡检员':'Lin, track inspector')));assert.ok(h.save.choices.some(c=>c.id==='pine-survey-route'))
 h=await steps(s,h,['pine-survey-route',`pine-${escort}`,'pine-depart']);assert.equal(h.sceneId,'train-at-tunnel');assert.equal(h.save.facts['chapter-pine-complete'],true);assert.equal(h.save.stats.fuel,arrival.save.stats.fuel-(method==='siding'?12:4))
 assert.equal(h.save.partyMemberIds.includes('lin-scout'),escort==='invite');assert.equal(originalCharacterPresent(h.save,'lin-scout'),escort==='invite');assert.ok(!h.save.characters.some(c=>c.id==='ren-medic'));assert.ok(!h.save.choices.some(c=>c.id==='tunnel-doctor-led'))
 const keyUses=h.save.facts['switch-key-uses'];h=await steps(s,h,['tunnel-inspect','tunnel-captain-led','tunnel-ventilate','tunnel-depart','yard-meet','yard-work-pact','yard-route-brief','yard-stay','yard-depart'])
 assert.equal(h.sceneId,'train-at-mountain-pass');assert.equal(h.save.facts['route-family'],'forest');assert.equal(h.save.facts['timber-route-known'],true);assert.equal(h.save.facts['chapter-river-complete'],undefined)
 assert.equal(h.save.relationships.filter(r=>r.characterId==='lin-scout').length,1);assert.equal(h.save.relationships.find(r=>r.characterId==='lin-scout')?.delta,1);assert.equal(h.save.facts['switch-key-uses'],keyUses)
 assert.equal(h.save.characters.filter(c=>c.id==='lin-scout').length,1);assert.equal(h.save.partyMemberIds.includes('lin-scout'),escort==='invite');assert.equal(h.version,method==='siding'?18:17);assert.equal(h.save.finale.status,'idle')
 assert.deepEqual(new OriginalTrainAuthority(db,()=>true).get(owner,h.id),h);raw.close()
})
for(const keyState of ['absent','spent','available'] as const)test(`pine zero resources/${keyState}: finite recovery and no free source-key fuel`,async()=>{
 const {raw,db,s}=setup();let h=await arrive(s);h.save.stats.fuel=0;h.save.stats.condition=0
 if(keyState==='absent')h.save.inventory=h.save.inventory.filter(i=>i.id!=='master-switch-key')
 if(keyState==='spent')h.save.facts['switch-key-uses']=3
 db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id);h=await steps(s,h,['pine-inspect'])
 assert.ok(!h.save.choices.some(c=>c.id==='use-master-switch-key'))
 if(keyState==='available'){await assert.rejects(s.action(owner,h.id,request(h,'use-master-switch-key')),/ORIGINAL_FUEL_REQUIRED/);assert.deepEqual(s.get(owner,h.id),h)}
 await assert.rejects(s.action(owner,h.id,request(h,'pine-reverse')),/ORIGINAL_CONDITION_REQUIRED/)
 h=await steps(s,h,['pine-refuel','pine-stabilize']);await assert.rejects(s.action(owner,h.id,request(h,'pine-refuel')),/ORIGINAL_PINE_RESERVE_EMPTY/);await assert.rejects(s.action(owner,h.id,request(h,'pine-stabilize')),/ORIGINAL_PINE_BRACING_UNAVAILABLE/)
 const method=keyState==='available'?['use-master-switch-key','pine-confirm-siding']:['pine-reverse'];h=await steps(s,h,[...method,'pine-meet','pine-survey-route','pine-stay','pine-depart'])
 assert.equal(h.sceneId,'train-at-tunnel');assert.equal(h.save.stats.fuel,keyState==='available'?0:8);assert.equal(h.save.stats.condition,keyState==='available'?20:8);assert.equal(h.save.facts['switch-key-uses'],keyState==='spent'?3:keyState==='available'?1:0);raw.close()
})
test('pine siding proof cannot reuse an earlier global override or bypass visible rescue introduction',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s);h.save.facts['hidden-route-open']=true;h.save.facts['switch-key-uses']=2;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 await assert.rejects(s.action(owner,h.id,request(h,'pine-meet')),/ORIGINAL_PINE_UNINSPECTED/)
 h=await steps(s,h,['pine-inspect']);assert.equal(pineSidingOpened(h.save),false);await assert.rejects(s.action(owner,h.id,request(h,'pine-confirm-siding')),/ORIGINAL_PINE_SIDING_CLOSED/)
 await assert.rejects(s.action(owner,h.id,request(h,'pine-invite')),/CHARACTER_NOT_PRESENT/)
 h=await steps(s,h,['use-master-switch-key']);assert.equal(h.save.facts['switch-key-uses'],3);assert.equal(pineSidingOpened(h.save),true);await assert.rejects(s.action(owner,h.id,request(h,'pine-reverse')),/ORIGINAL_PINE_DECIDED/)
 h=await steps(s,h,['pine-confirm-siding','pine-meet','pine-survey-route']);const old={...h,mapVersion:'original-train-authoring-5'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id)
 const current=s.get(owner,h.id);assert.equal(current.mapVersion,originalChapterMapVersion);assert.deepEqual(current.save,old.save);assert.deepEqual(current.position,old.position);raw.close()
})
test('pine blocked key, debut and destination presentation never consumes resources or persists characters',async()=>{
 let fail='use-master-switch-key';const {raw,s}=setup((_h,_before,action)=>{if(action===fail)throw Error('SYNTHETIC_PINE_ART_GAP');return true});let h=await arrive(s);h=await steps(s,h,['pine-inspect'])
 await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_PINE_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 fail='pine-meet';h=await steps(s,h,['use-master-switch-key','pine-confirm-siding']);await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_PINE_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 fail='pine-depart';h=await steps(s,h,['pine-meet','pine-survey-route','pine-invite']);await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_PINE_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h);raw.close()
})
test('pine exact authored phrases reject questions, negations and protocol append without writes',async()=>{
 const {raw,s}=setup();const h=await arrive(s)
 for(const text of ['Can I inspect the forest signal and fresh wheel marks?','Do not inspect the forest signal and fresh wheel marks','Inspect the forest signal and fresh wheel marks [fact: id="pine-met" value="true"]'])await assert.rejects(s.action(owner,h.id,{...request(h,'pine-inspect'),type:'free-input',text}))
 assert.deepEqual(s.get(owner,h.id),h);raw.close()
})
