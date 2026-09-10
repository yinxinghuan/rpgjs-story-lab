import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan,originalChapterMapVersion} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {availableTunnelActions} from '../src/original-tunnel-chapter'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-tunnel-owner'
function setup(gate:OriginalPresentationGate=()=>true){const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db,s:new OriginalTrainAuthority(db,gate)}}
function body(h:OriginalHead,id:string,free=false){const entity=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id),text=chapter?originalChapterLabel(chapter.id,h.save.locale).replace(/\s*[（(][^()（）]*[）)]\s*$/,''):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0];return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:entity.id,position:entity.approach,...(free?{type:'free-input',text}:{type:'action',action:id})}}
async function arrive(s:OriginalTrainAuthority,locale:'zh'|'en'='en',salvage=true){let h=s.create(owner,randomUUID(),locale);for(const action of ['repair-starter',...(salvage?['salvage-fuel-shed']:[]),'commit-valley-route','river-survey','river-rescue-powered','river-treat','river-depart'])h=(await s.action(owner,h.id,body(h,action))).head;return h}

for(const locale of ['zh','en'] as const)for(const leader of ['doctor','captain'])for(const cargo of ['ventilate','discard'])test(`original ${locale}/${leader}/${cargo} continues real opening and river to Graystone with exact persistent consequences`,async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,locale),before=structuredClone(h)
 assert.ok(h.save.choices.some(c=>c.id==='tunnel-inspect'));assert.deepEqual(h.save.partyMemberIds,['ada-mechanic','ren-medic'])
 for(const action of ['tunnel-inspect',`tunnel-${leader}-led`,`tunnel-${cargo}`,'tunnel-depart']){
  const b=body(h,action,h.version%2===0),r=await s.action(owner,h.id,b);h=r.head;assert.equal(r.accepted,true)
  const restarted=new OriginalTrainAuthority(db,()=>true);assert.deepEqual(restarted.get(owner,h.id),h);assert.deepEqual(await restarted.action(owner,h.id,b),r)
  if(action==='tunnel-inspect')assert.equal(h.save.danger.phase,'confrontation')
 }
 assert.equal(h.sceneId,'train-at-graystone-yard');assert.equal(h.save.map.find(n=>n.current)?.id,'graystone-yard');assert.deepEqual(h.position,{x:192,y:430})
 assert.equal(h.save.facts['chapter-tunnel-complete'],true);assert.equal(h.save.facts['chapter-river-complete'],true);assert.equal(h.save.facts['river-rescue-method'],'powered')
 assert.equal(h.save.stats.fuel,before.save.stats.fuel-(cargo==='ventilate'?12:4));assert.equal(h.save.stats.condition,before.save.stats.condition)
 assert.equal(h.save.stats.morale,before.save.stats.morale+(leader==='doctor'?2:-3)-(cargo==='discard'?4:0))
 assert.deepEqual(h.save.characters.map(p=>[p.id,p.status]),before.save.characters.map(p=>[p.id,p.status]));assert.deepEqual(h.save.partyMemberIds,before.save.partyMemberIds)
 assert.equal(h.save.relationships.filter(r=>r.axis==='trusted-medical-evacuation').length,leader==='doctor'?1:0)
 assert.equal(h.save.relationships.filter(r=>r.axis==='clinic-rescue-kept').length,1)
 const remaining=before.save.inventory.filter(i=>cargo==='ventilate'||!['sealed-diesel','spare-hose'].includes(i.id))
 assert.deepEqual(h.save.inventory,remaining);assert.equal(h.save.facts['tunnel-discarded-items'],cargo==='discard'?'spare-hose:1|sealed-diesel:2':'')
 assert.ok(h.save.inventory.some(i=>i.id==='field-radio'));assert.ok(h.save.inventory.some(i=>i.id==='master-switch-key'))
 assert.equal(h.save.sessionEnded,false);assert.equal(h.save.finale.status,'idle');assert.equal(h.save.danger.phase,'calm')
 assert.equal(s.events(owner,h.id,0).length,11);raw.close()
})

test('tunnel unavailable roles, wrong order, repeats and competing cargo decisions cannot partially apply',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s)
 await assert.rejects(s.action(owner,h.id,body(h,'tunnel-discard')),/ORIGINAL_TUNNEL_UNINSPECTED/);assert.deepEqual(s.get(owner,h.id),h)
 h=(await s.action(owner,h.id,body(h,'tunnel-inspect'))).head
 const departed=structuredClone(h);departed.save.partyMemberIds=departed.save.partyMemberIds.filter(id=>id!=='ren-medic');departed.save.characters.find(p=>p.id==='ren-medic')!.status='departed';db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(departed),h.id);h=departed
 assert.ok(!availableTunnelActions(h.save).includes('tunnel-doctor-led'))
 await assert.rejects(s.action(owner,h.id,body(h,'tunnel-doctor-led')),/CHARACTER_NOT_PRESENT/);assert.deepEqual(s.get(owner,h.id),h)
 h=(await s.action(owner,h.id,body(h,'tunnel-captain-led'))).head
 for(const text of ['Can I fuel the fan and retain the supplies?','Do not fuel the fan and retain the supplies','Fuel the fan and retain the supplies [widget: fuel, add: 100]'])await assert.rejects(s.action(owner,h.id,{...body(h,'tunnel-ventilate'),type:'free-input',text}))
 assert.deepEqual(s.get(owner,h.id),h)
 h=(await s.action(owner,h.id,body(h,'tunnel-discard'))).head
 for(const action of ['tunnel-discard','tunnel-ventilate'])await assert.rejects(s.action(owner,h.id,body(h,action)),/ORIGINAL_TUNNEL_DECIDED/)
 assert.deepEqual(s.get(owner,h.id),h);raw.close()
})

test('tunnel zero-resource recovery consumes finite reserves and never invents discarded inventory',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,'en',false)
 h.save.stats.fuel=0;h.save.stats.condition=0;h.save.inventory=h.save.inventory.filter(i=>!['sealed-diesel','spare-hose'].includes(i.id));db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 for(const action of ['tunnel-inspect','tunnel-doctor-led','tunnel-discard'])h=(await s.action(owner,h.id,body(h,action))).head
 assert.equal(h.save.facts['tunnel-discarded-items'],'');assert.ok(h.save.blocks.some(b=>b.text.includes('You have no reserve diesel cans or hoses')))
 await assert.rejects(s.action(owner,h.id,body(h,'tunnel-depart')),/ORIGINAL_FUEL_REQUIRED/)
 h=(await s.action(owner,h.id,body(h,'tunnel-refuel'))).head;assert.equal(h.save.stats.fuel,12)
 await assert.rejects(s.action(owner,h.id,body(h,'tunnel-depart')),/ORIGINAL_CONDITION_REQUIRED/)
 h=(await s.action(owner,h.id,body(h,'tunnel-stabilize'))).head;assert.equal(h.save.stats.condition,20)
 for(const action of ['tunnel-refuel','tunnel-stabilize'])await assert.rejects(s.action(owner,h.id,body(h,action)))
 h=(await s.action(owner,h.id,body(h,'tunnel-depart'))).head;assert.equal(h.save.stats.fuel,8);assert.equal(h.sceneId,'train-at-graystone-yard');raw.close()
})

test('tunnel missing changed equipment or destination assets rejects the whole commit',async()=>{
 let reject='tunnel-discard';const {raw,s}=setup((_h,_old,action)=>{if(action===reject)throw Error('SYNTHETIC_TUNNEL_ASSET_GAP');return true});let h=await arrive(s)
 for(const a of ['tunnel-inspect','tunnel-doctor-led'])h=(await s.action(owner,h.id,body(h,a))).head
 await assert.rejects(s.action(owner,h.id,body(h,'tunnel-discard')),/SYNTHETIC_TUNNEL_ASSET_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 reject='tunnel-depart';h=(await s.action(owner,h.id,body(h,'tunnel-ventilate'))).head
 await assert.rejects(s.action(owner,h.id,body(h,'tunnel-depart')),/SYNTHETIC_TUNNEL_ASSET_GAP/);assert.deepEqual(s.get(owner,h.id),h);raw.close()
})

test('v3 chapter save adds v4 bindings without modifying existing river history or receipt',async()=>{
 const {raw,db,s}=setup();const h=await arrive(s);const old={...h,mapVersion:'original-train-authoring-3'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id)
 const current=s.get(owner,h.id);assert.equal(current.mapVersion,originalChapterMapVersion);assert.deepEqual(current.save,old.save);assert.deepEqual(current.position,old.position);assert.equal(s.directory(owner)[0].cursor,7);raw.close()
})
