import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {OldStreetAuthority,type OldStreetHead} from '../server/old-street-runtime'
import {OriginalTrainAuthority} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'

function storage(raw:DatabaseSync):AuthorityStorage{return {all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const result=work();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}}
// Explicit synthetic admission for transaction tests, never used by production.
const admit=()=>true as const
function request(h:OldStreetHead,action:string){const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;assert.ok(e,action);return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,type:'action',action}}
for(const locale of ['zh','en'] as const)test(`old street ${locale}: door, tools and ending survive disk reopen and lost receipts`,async()=>{
 const temp=mkdtempSync(join(tmpdir(),'oldstreet-session-')),file=join(temp,'synthetic.sqlite')
 let raw=new DatabaseSync(file),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('synthetic-owner',randomUUID(),locale)
  const steps=['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter','street','oldstreet:leave']
  for(const step of steps){
   const id=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId
   const b=request(h,id),previous=h,result=await s.action('synthetic-owner',h.id,b);h=result.head
   assert.equal(h.version,previous.version+1)
   raw.close();raw=new DatabaseSync(file);s=new OldStreetAuthority(storage(raw),admit)
   assert.deepEqual(s.get('synthetic-owner',h.id),h)
   assert.deepEqual(await s.action('synthetic-owner',h.id,b),result)
   assert.throws(()=>s.checkpoint('synthetic-owner',h.id,{sceneId:previous.sceneId,expected_version:previous.version,position:previous.position}),/STALE_POSITION/)
   assert.throws(()=>s.get('different-owner',h.id),/SESSION_NOT_FOUND/)
  }
  assert.equal(h.save.facts.departed,true);assert.equal(h.save.facts['crates-cleared'],true)
  assert.equal(h.save.inventory.find(i=>i.id==='trolley')?.count,1)
  assert.equal(s.events('synthetic-owner',h.id,0).length,steps.length)
  await assert.rejects(s.action('synthetic-owner',h.id,request(h,'oldstreet:leave')),/JOURNEY_COMPLETE/)
 }finally{raw.close();rmSync(temp,{recursive:true,force:true})}
})
test('default admission and old train database cannot be reinterpreted as old street',()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw)
 try{
  assert.throws(()=>new OldStreetAuthority(db).create('owner',randomUUID(),'zh'),/PRESENTATION_NOT_READY/)
  const old=new OriginalTrainAuthority(db,admit).create('owner',randomUUID(),'zh')
  const s=new OldStreetAuthority(db,admit)
  assert.throws(()=>s.create('different-owner',randomUUID(),'zh'),/SAVE_UNSUPPORTED/)
  assert.throws(()=>s.get('owner',old.id),/SAVE_UNSUPPORTED/)
  assert.deepEqual(new OriginalTrainAuthority(db,admit).get('owner',old.id),old)
 }finally{raw.close()}
})
test('receipt failure rolls back room and story; retry commits once',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw);let fail=true
 const faulty:AuthorityStorage={...db,run:(sql,...b)=>{if(fail&&sql.startsWith('INSERT INTO receipts'))throw Error('TEST_WRITE_FAILURE');db.run(sql,...b)}}
 try{
  const s=new OldStreetAuthority(faulty,admit),h=s.create('owner',randomUUID(),'zh')
  const b=request(h,oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='yard')!.actionId)
  await assert.rejects(s.action('owner',h.id,b),/TEST_WRITE_FAILURE/)
  assert.deepEqual(s.get('owner',h.id),h);assert.equal(s.events('owner',h.id,0).length,0)
  fail=false;const result=await s.action('owner',h.id,b)
  assert.equal(result.head.sceneId,'yard');assert.deepEqual(await s.action('owner',h.id,b),result)
  assert.equal(s.events('owner',h.id,0).length,1)
 }finally{raw.close()}
})
test('off-scene and cross-target actions cannot mutate a journey',async()=>{
 const raw=new DatabaseSync(':memory:')
 try{
  const s=new OldStreetAuthority(storage(raw),admit),h=s.create('owner',randomUUID(),'zh')
  const b=request(h,oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='yard')!.actionId)
  for(const change of [{sceneId:'yard'},{target:'crates'},{position:{x:0,y:0}},{action:'oldstreet:take-letter'},{type:'free-input',text:'拿信'}])await assert.rejects(s.action('owner',h.id,{...b,...change,action_id:randomUUID()}))
  assert.deepEqual(s.get('owner',h.id),h);assert.equal(s.events('owner',h.id,0).length,0)
 }finally{raw.close()}
})
test('a prepared doorway is re-admitted at commit and cannot overwrite a newer action',async()=>{
 const raw=new DatabaseSync(':memory:');let allowed=true
 try{
  const s=new OldStreetAuthority(storage(raw),()=>{if(!allowed)throw Error('TEST_ART_REVOKED');return true})
  const h=s.create('owner',randomUUID(),'zh'),doors=oldStreetDoors().filter(d=>d.room==='street')
  const b=request(h,doors[0].actionId)
  assert.equal((await s.prepareAction('owner',h.id,b)).status,'prepared')
  allowed=false;await assert.rejects(s.commitPreparedAction('owner',h.id,b),/TEST_ART_REVOKED/)
  assert.deepEqual(s.get('owner',h.id),h)
  allowed=true;const newer=await s.action('owner',h.id,request(h,doors[1].actionId))
  await assert.rejects(s.commitPreparedAction('owner',h.id,b),/ACTION_NOT_PREPARED/)
  await assert.rejects(s.action('owner',h.id,b),/VERSION_CONFLICT/)
  assert.deepEqual(s.get('owner',h.id),newer.head)
 }finally{raw.close()}
})
for(const locale of ['zh','en'] as const)test(`character introduction is visible once and survives reloading (${locale})`,async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw)
 try{
  let s=new OldStreetAuthority(db,admit),h=s.create('owner',randomUUID(),locale)
  assert.equal(h.save.characters.length,0)
  const run=async(id:string)=>{h=(await s.action('owner',h.id,request(h,id))).head}
  for(const room of ['photo','roof','shed'])await run(oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId)
  assert.equal(h.save.characters.length,0)
  await run('oldstreet:greet-watchmaker')
  assert.deepEqual(h.save.characters.map(c=>c.id),['zhou-watchmaker'])
  const intro=h.save.blocks.filter(b=>b.id.endsWith(':introduction'))
  assert.equal(intro.length,1);assert.ok(intro[0].text.includes(h.save.characters[0].name))
  s=new OldStreetAuthority(db,admit);h=s.get('owner',h.id)
  await run('oldstreet:greet-watchmaker')
  assert.equal(h.save.blocks.filter(b=>b.id.endsWith(':introduction')).length,1)
  for(let i=0;i<2;i++){await run('oldstreet:borrow-key');await run('oldstreet:return-key')}
  assert.equal(h.save.relationships.filter(r=>r.characterId==='zhou-watchmaker').length,1)
  assert.deepEqual(h.save.characters.map(c=>c.id),['zhou-watchmaker'])
  assert.equal(h.save.partyMemberIds.length,0)
 }finally{raw.close()}
})
for(const locale of ['zh','en'] as const)test(`typed input uses the same target rules and receipt (${locale})`,async()=>{
 const raw=new DatabaseSync(':memory:')
 try{
  const s=new OldStreetAuthority(storage(raw),admit);let h=s.create('owner',randomUUID(),locale)
  for(const room of ['yard','laundry'])h=(await s.action('owner',h.id,request(h,oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId))).head
  const b={...request(h,'oldstreet:borrow-trolley'),type:'free-input',action:undefined,text:locale==='zh'?'借用推车':'borrow the trolley'}
  const result=await s.action('owner',h.id,b);assert.equal(result.actionId,'oldstreet:borrow-trolley');assert.deepEqual(await s.action('owner',h.id,b),result);h=result.head
  assert.equal(h.save.inventory.find(i=>i.id==='trolley')?.count,1)
  for(const text of ['不要还推车','能不能还推车？','还推车然后拿钥匙','oldstreet:return-trolley','do not return the trolley','return the trolley and take the key']){
   await assert.rejects(s.action('owner',h.id,{...request(h,'oldstreet:return-trolley'),type:'free-input',text}),/INPUT_UNSUPPORTED/)
   assert.deepEqual(s.get('owner',h.id),h)
  }
  const other={...request(h,'oldstreet:greet-laundry'),type:'free-input',text:locale==='zh'?'还推车':'return the trolley'}
  await assert.rejects(s.action('owner',h.id,other),/INPUT_UNSUPPORTED/)
 }finally{raw.close()}
})
