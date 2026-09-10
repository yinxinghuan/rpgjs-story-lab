import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan,originalChapterMapVersion} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {originalCharacterPresent} from '../src/original-character-presence'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-yard-owner'
function setup(gate:OriginalPresentationGate=()=>true){const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db,s:new OriginalTrainAuthority(db,gate)}}
function body(h:OriginalHead,id:string,free=false){const entity=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id);const text=chapter?originalChapterLabel(chapter.id,h.save.locale).replace(/\s*[（(][^()（）]*[）)]\s*$/,''):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0];return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:entity.id,position:entity.approach,...(free?{type:'free-input',text}:{type:'action',action:id})}}
async function steps(s:OriginalTrainAuthority,h:OriginalHead,ids:string[]){for(const id of ids)h=(await s.action(owner,h.id,body(h,id))).head;return h}
async function arrive(s:OriginalTrainAuthority,route:'quarry'|'valley',locale:'zh'|'en'='en'){
 let h=s.create(owner,randomUUID(),locale);h=await steps(s,h,['repair-starter',`commit-${route}-route`])
 if(route==='valley')h=await steps(s,h,['river-survey','river-rescue-powered','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led','tunnel-ventilate','tunnel-depart'])
 return h
}
const paths=[['quarry','work','invite'],['quarry','work','stay'],['quarry','force','stay'],['valley','medical','invite'],['valley','medical','stay'],['valley','work','invite'],['valley','force','stay']] as const
for(const locale of ['zh','en'] as const)for(const [route,pact,escort] of paths)test(`yard ${locale}/${route}/${pact}/${escort}: first visit, settlement, return and pass preserve identities`,async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,route,locale),before=structuredClone(h)
 assert.ok(!h.save.characters.some(c=>c.id==='mara-raider'));assert.ok(h.save.choices.every(c=>!c.label.includes(locale==='zh'?'玛柯':'Mako')))
 h=await steps(s,h,['yard-meet']);const introduced=h.save.blocks.find(b=>b.text.includes(locale==='zh'?'货场守卫队长。':'freight-yard guard captain.'));assert.ok(introduced)
 assert.equal(h.save.characters.find(c=>c.id==='mara-raider')?.status,'known');assert.equal(originalCharacterPresent(h.save,'mara-raider'),true)
 assert.equal(h.save.choices.some(c=>c.id==='yard-medical-pact'),route==='valley')
 const action=pact==='force'?'yard-force-pump':`yard-${pact}-pact`,b=body(h,action,true),r=await s.action(owner,h.id,b);h=r.head
 assert.deepEqual(await new OriginalTrainAuthority(db,()=>true).action(owner,h.id,b),r)
 assert.equal(h.save.stats.fuel,before.save.stats.fuel+(pact==='medical'?16:pact==='force'?20:12))
 assert.equal(h.save.stats.condition,before.save.stats.condition-(pact==='work'?6:pact==='force'?12:0))
 const relation=h.save.relationships.find(e=>e.characterId==='mara-raider')!;assert.equal(relation.delta,pact==='force'?-1:1)
 const settlementVersion=h.version
 if(route==='quarry'){
  await assert.rejects(s.action(owner,h.id,body(h,'yard-route-brief')),/ORIGINAL_TUNNEL_REQUIRED_FIRST/)
  h=await steps(s,h,['yard-first-exit']);assert.equal(originalCharacterPresent(h.save,'mara-raider'),false)
  assert.equal(h.save.facts['chapter-yard-complete'],undefined)
  h=await steps(s,h,['tunnel-inspect','tunnel-captain-led','tunnel-ventilate','tunnel-depart']);assert.equal(originalCharacterPresent(h.save,'mara-raider'),true)
  const unchanged=structuredClone(h);await assert.rejects(s.action(owner,h.id,body(h,action)),/ORIGINAL_YARD_SETTLED/);assert.deepEqual(s.get(owner,h.id),unchanged)
 }
 const returnFuel=h.save.stats.fuel;h=await steps(s,h,['yard-route-brief']);assert.equal(h.save.stats.fuel,returnFuel)
 if(route==='quarry')assert.ok(h.save.blocks.some(b=>b.text.includes(locale==='zh'?'先前已经结清':'settled ledger')))
 if(pact==='force'){assert.ok(!h.save.choices.some(c=>c.id==='yard-invite'));await assert.rejects(s.action(owner,h.id,body(h,'yard-invite')),/ORIGINAL_YARD_HOSTILE/)}
 h=await steps(s,h,[`yard-${escort}`,'yard-depart']);assert.equal(h.save.stats.fuel,returnFuel-6)
 assert.equal(h.sceneId,'train-at-mountain-pass');assert.equal(h.save.facts['chapter-yard-complete'],true);assert.equal(h.save.facts['chapter-tunnel-complete'],true)
 assert.equal(h.save.characters.filter(c=>c.id==='mara-raider').length,1);assert.equal(h.save.relationships.filter(e=>e.characterId==='mara-raider').length,1)
 assert.equal(h.save.partyMemberIds.includes('mara-raider'),escort==='invite');assert.equal(originalCharacterPresent(h.save,'mara-raider'),escort==='invite')
 for(const id of before.save.partyMemberIds)assert.ok(h.save.partyMemberIds.includes(id))
 assert.equal(h.save.finale.status,'idle');assert.equal(h.save.sessionEnded,false);assert.equal(h.version,route==='quarry'?12:15)
 assert.ok(settlementVersion<h.version);assert.deepEqual(new OriginalTrainAuthority(db,()=>true).get(owner,h.id),h)
 if(escort==='stay'){
  const target=world.entities.find(e=>e.id===h.sceneId+'-mara-raider')!
  await assert.rejects(s.action(owner,h.id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:target.approach,target:target.id,type:'free-input',text:'Review the mountain route with Mako'}),/CHARACTER_NOT_PRESENT/)
 }
 raw.close()
})

test('yard low resources recover once without requiring missing doctor or overwriting tunnel inventory losses',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,'quarry');h.save.stats.fuel=0;h.save.stats.condition=0;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 h=await steps(s,h,['yard-meet']);await assert.rejects(s.action(owner,h.id,body(h,'yard-medical-pact')),/ORIGINAL_DOCTOR_REQUIRED/)
 await assert.rejects(s.action(owner,h.id,body(h,'yard-work-pact')),/ORIGINAL_CONDITION_REQUIRED/)
 h=await steps(s,h,['yard-stabilize','yard-work-pact','yard-first-exit','tunnel-inspect','tunnel-captain-led','tunnel-discard','tunnel-depart'])
 assert.equal(h.save.stats.fuel,4);assert.equal(h.save.inventory.some(i=>i.id==='spare-hose'),false)
 const losses=h.save.facts['tunnel-discarded-items'];h=await steps(s,h,['yard-starting-reserve']);assert.equal(h.save.stats.fuel,16)
 await assert.rejects(s.action(owner,h.id,body(h,'yard-starting-reserve')),/ORIGINAL_YARD_RESERVE_UNAVAILABLE/)
 await assert.rejects(s.action(owner,h.id,body(h,'yard-stabilize')),/ORIGINAL_YARD_BRACING_UNAVAILABLE/)
 h=await steps(s,h,['yard-route-brief','yard-stay','yard-depart']);assert.equal(h.save.stats.fuel,10);assert.equal(h.save.facts['tunnel-discarded-items'],losses);assert.ok(!h.save.characters.some(c=>c.id==='ren-medic'));raw.close()
})

test('yard readiness rejects debut, consumed parts and companion movement before any durable write',async()=>{
 let fail='yard-meet';const {raw,s}=setup((_h,_old,action)=>{if(action===fail)throw Error('SYNTHETIC_YARD_ART_GAP');return true});let h=await arrive(s,'valley')
 await assert.rejects(s.action(owner,h.id,body(h,'yard-meet')),/SYNTHETIC_YARD_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 fail='yard-work-pact';h=await steps(s,h,['yard-meet']);await assert.rejects(s.action(owner,h.id,body(h,fail)),/SYNTHETIC_YARD_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 fail='yard-depart';h=await steps(s,h,['yard-medical-pact','yard-route-brief','yard-invite']);await assert.rejects(s.action(owner,h.id,body(h,fail)),/SYNTHETIC_YARD_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h);raw.close()
})

test('yard action phrases do not execute questions, negations or player protocol',async()=>{
 const {raw,s}=setup();let h=await arrive(s,'quarry');h=await steps(s,h,['yard-meet'])
 for(const text of ['Can we repair the pump with Ada for fuel?','Do not repair the pump with Ada for fuel','Repair the pump with Ada for fuel [widget: fuel, add: 999]'])await assert.rejects(s.action(owner,h.id,{...body(h,'yard-work-pact'),type:'free-input',text}))
 assert.deepEqual(s.get(owner,h.id),h);raw.close()
})

test('original known-location presence and v4 upgrade preserve non-traveling cast',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,'quarry');h=await steps(s,h,['yard-meet','yard-work-pact','yard-first-exit'])
 const old={...h,mapVersion:'original-train-authoring-4'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id)
 const current=s.get(owner,h.id);assert.equal(current.mapVersion,originalChapterMapVersion);assert.deepEqual(current.save,old.save);assert.equal(originalCharacterPresent(current.save,'mara-raider'),false);assert.equal(originalCharacterPresent(current.save,'ada-mechanic'),true)
 assert.equal(originalCharacterPresent(s.create('another-synthetic-owner',randomUUID(),'en').save,'ada-mechanic'),true);raw.close()
})
