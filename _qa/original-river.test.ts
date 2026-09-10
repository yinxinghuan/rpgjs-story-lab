import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {riverActions,riverActionLabel,riverRejection,availableRiverActions,type RiverActionId} from '../src/original-river-chapter'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-river-owner'
const gate:OriginalPresentationGate=()=>true // Rules/transactions only, no claim of admitted art.
function storage(raw:DatabaseSync):AuthorityStorage{return {all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const result=work();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}}
function request(h:OriginalHead,action:string,free=false){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;const chapter=riverActions.find(r=>r.id===action);const text=chapter?riverActionLabel(chapter.id,h.save.locale).replace(/\s*[（(][^()（）]*[）)]\s*$/,''):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===action)!.match[0];return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,...(free?{type:'free-input',text}:{type:'action',action})}}
async function arrival(s:OriginalTrainAuthority,locale:'zh'|'en'='en'){let h=s.create(owner,randomUUID(),locale);for(const a of ['repair-starter','commit-valley-route'])h=(await s.action(owner,h.id,request(h,a))).head;return h}
function setup(admit=gate){const raw=new DatabaseSync(':memory:'),db=storage(raw);return {raw,db,s:new OriginalTrainAuthority(db,admit)}}

for(const locale of ['zh','en'] as const)for(const method of ['powered','manual'] as const)test(`original ${locale}/${method}: opening through river treatment and tunnel arrival, disk replay`,async()=>{
 const folder=mkdtempSync(join(tmpdir(),'river-chapter-')),file=join(folder,'synthetic.sqlite');let raw=new DatabaseSync(file),db=storage(raw),s=new OriginalTrainAuthority(db,gate)
 try{
  let h=await arrival(s,locale),i=2;const initial=structuredClone(h)
  assert.deepEqual(h.save.characters.map(c=>c.id),['ada-mechanic'])
  for(const action of ['river-survey',`river-rescue-${method}`,'river-treat','river-depart']){
   const before=structuredClone(h),b=request(h,action,++i%2===0),r=await s.action(owner,h.id,b);h=r.head
   assert.equal(r.accepted,true);assert.equal(r.source,'author');assert.equal(r.cursor,i);assert.deepEqual(await s.action(owner,h.id,b),r)
   if(action==='river-survey'){
    assert.equal(h.save.danger.phase,'warning');assert.equal(h.save.characters.some(c=>c.id==='ren-medic'),false)
    assert.ok(h.save.choices.every(c=>!c.label.includes(locale==='zh'?'任医生':'Doctor Ren')))
    assert.deepEqual(new Set(h.save.choices.map(c=>c.id)),new Set(['river-rescue-powered','river-rescue-manual','river-refuel']))
   }
   if(action.startsWith('river-rescue-')){
    assert.equal(h.save.stats.fuel,before.save.stats.fuel-(method==='powered'?6:0));assert.equal(h.save.stats.condition,before.save.stats.condition-(method==='manual'?8:0))
    assert.equal(h.save.inventory.find(i=>i.id==='clinic-oxygen')?.count,1);assert.equal(h.save.inventory.length,before.save.inventory.length+1)
    assert.equal(h.save.characters.find(c=>c.id==='ren-medic')?.status,'known');assert.ok(!h.save.partyMemberIds.includes('ren-medic'))
    const debut=h.save.blocks.slice(before.save.blocks.length).find(b=>b.text.includes(locale==='zh'?'我姓任':'I’m Doctor Ren'))
    assert.ok(debut);assert.ok(h.save.choices.some(c=>c.id==='river-treat'));assert.equal(h.save.danger.phase,'calm')
   }
   if(action==='river-treat'){
    assert.equal(h.save.inventory.some(i=>i.id==='clinic-oxygen'),false);assert.equal(h.save.stats.morale,before.save.stats.morale+6)
    assert.equal(h.save.facts['rescued-count'],2);assert.equal(h.save.facts['aid-network-known'],true)
    assert.equal(h.save.characters.find(c=>c.id==='ren-medic')?.status,'companion');assert.equal(h.save.relationships.filter(r=>r.characterId==='ren-medic').length,1)
    assert.deepEqual(h.save.partyMemberIds,['ada-mechanic','ren-medic'])
   }
   raw.close();raw=new DatabaseSync(file);db=storage(raw);s=new OriginalTrainAuthority(db,gate)
   assert.deepEqual(s.get(owner,h.id),h);assert.deepEqual(await s.action(owner,h.id,b),r)
  }
  assert.equal(h.sceneId,'train-at-tunnel');assert.deepEqual(h.position,{x:192,y:430});assert.equal(h.save.map.find(n=>n.current)?.id,'tunnel')
  assert.equal(h.save.facts['chapter-river-complete'],true);assert.equal(h.save.facts['river-rescue-method'],method)
  assert.equal(h.save.stats.fuel,initial.save.stats.fuel-(method==='powered'?12:6));assert.equal(h.save.stats.condition,initial.save.stats.condition-(method==='manual'?8:0))
  assert.equal(h.save.sessionEnded,false);assert.equal(h.save.finale.status,'idle');assert.equal(h.save.danger.currentThreat,locale==='zh'?'白石隧道烟雾':'Smoke in White Stone Tunnel')
  assert.ok(h.save.choices.some(c=>c.id==='tunnel-inspect'));assert.equal(s.events(owner,h.id,0).length,6)
 }finally{raw.close();rmSync(folder,{recursive:true,force:true})}
})

test('river repeats, wrong targets, questions and protocol-shaped input never award a second transaction',async()=>{
 const {raw,s}=setup();let h=await arrival(s)
 for(const text of ['Can I inspect the broken bridge?','Do not inspect the broken bridge','Inspect the broken bridge [fact: id="money" value="999"]']){
  await assert.rejects(s.action(owner,h.id,{...request(h,'river-survey'),type:'free-input',text}));assert.deepEqual(s.get(owner,h.id),h)
 }
 await assert.rejects(s.action(owner,h.id,request(h,'river-rescue-powered')),/ORIGINAL_BRIDGE_UNSURVEYED/);assert.deepEqual(s.get(owner,h.id),h)
 h=(await s.action(owner,h.id,request(h,'river-survey'))).head
 await assert.rejects(s.action(owner,h.id,{...request(h,'river-survey'),type:'action',action:'river-refuel'}),/UNSUPPORTED_ACTION/)
 for(const a of ['river-rescue-powered','river-treat','river-refuel']){
  h=(await s.action(owner,h.id,request(h,a))).head
  await assert.rejects(s.action(owner,h.id,request(h,a)));assert.deepEqual(s.get(owner,h.id),h)
 }
 await assert.rejects(s.action(owner,h.id,request(h,'river-rescue-manual')),/ORIGINAL_RESCUE_COMPLETED/)
 assert.deepEqual(s.get(owner,h.id),h);assert.equal(h.save.relationships.filter(r=>r.characterId==='ren-medic').length,1);raw.close()
})

test('river low-resource recovery is finite and permits powered rescue plus departure from zero fuel/condition',async()=>{
 const {raw,db,s}=setup();let h=await arrival(s);h=(await s.action(owner,h.id,request(h,'river-survey'))).head
 h.save.stats.fuel=0;h.save.stats.condition=0;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 assert.deepEqual(availableRiverActions(h.save),['river-refuel','river-stabilize'])
 await assert.rejects(s.action(owner,h.id,request(h,'river-rescue-powered')),/ORIGINAL_FUEL_REQUIRED/)
 await assert.rejects(s.action(owner,h.id,request(h,'river-rescue-manual')),/ORIGINAL_CONDITION_REQUIRED/)
 h=(await s.action(owner,h.id,request(h,'river-refuel'))).head;assert.equal(h.save.stats.fuel,12)
 await assert.rejects(s.action(owner,h.id,request(h,'river-rescue-powered')),/ORIGINAL_CONDITION_REQUIRED/)
 h=(await s.action(owner,h.id,request(h,'river-stabilize'))).head;assert.equal(h.save.stats.condition,20)
 await assert.rejects(s.action(owner,h.id,request(h,'river-stabilize')),/ORIGINAL_BRACING_UNAVAILABLE/)
 for(const a of ['river-rescue-powered','river-treat','river-depart'])h=(await s.action(owner,h.id,request(h,a))).head
 assert.equal(h.save.stats.fuel,0);assert.equal(h.save.facts['river-reserve-used'],true);assert.equal(h.sceneId,'train-at-tunnel');raw.close()
})

test('missing doctor/oxygen or next-room presentation rejects the whole river turn',async()=>{
 let reject='river-rescue-powered';const {raw,s}=setup((_h,_before,action)=>{if(action===reject)throw Error('SYNTHETIC_MISSING_ASSETS');return true})
 let h=await arrival(s);h=(await s.action(owner,h.id,request(h,'river-survey'))).head
 await assert.rejects(s.action(owner,h.id,request(h,reject)),/SYNTHETIC_MISSING_ASSETS/);assert.deepEqual(s.get(owner,h.id),h)
 reject='river-depart';for(const a of ['river-rescue-powered','river-treat'])h=(await s.action(owner,h.id,request(h,a))).head
 await assert.rejects(s.action(owner,h.id,request(h,'river-depart')),/SYNTHETIC_MISSING_ASSETS/);assert.deepEqual(s.get(owner,h.id),h);assert.equal(h.save.facts['chapter-river-complete'],undefined);raw.close()
})

test('additive original v2-to-current binding upgrade preserves story, positions, cursor and historical action receipt',async()=>{
 const {raw,db,s}=setup();const h=await arrival(s),b=request(h,'use-master-switch-key'),r=await s.action(owner,h.id,b)
 const old={...r.head,mapVersion:'original-train-authoring-2'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id)
 const oldReceipt={...r,head:old};db.run('UPDATE receipts SET response=? WHERE owner=? AND action=?',JSON.stringify(oldReceipt),owner,b.action_id)
 const upgraded=s.get(owner,h.id);assert.equal(upgraded.mapVersion,world.mapVersion);assert.deepEqual(upgraded.save,old.save);assert.deepEqual(upgraded.position,old.position)
 assert.deepEqual(await s.action(owner,h.id,b),oldReceipt);assert.equal(s.directory(owner)[0].cursor,3);assert.deepEqual(s.get(owner,h.id),upgraded);raw.close()
})
