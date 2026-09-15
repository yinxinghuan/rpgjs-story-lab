import {oldStreetPhotoShelfPose} from '../src/old-street-photo-shelf'
import {oldStreetSceneKnowledge} from '../src/old-street-scene-knowledge'
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
  assert.equal(h.save.finale.status,'complete');assert.equal(h.save.sessionEnded,true);assert.equal(h.save.finale.ending?.snapshotId,h.save.finale.snapshot?.id);assert.equal(h.save.facts.departed,true);assert.equal(h.save.facts['crates-cleared'],true)
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
test('bounded interpreter sees only eligible target actions and cannot grant a foreign action',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw),contexts:any[]=[];let answer='oldstreet:borrow-trolley'
 const s=new OldStreetAuthority(db,admit,async(_input,context)=>{contexts.push(structuredClone(context));return answer})
 try{
  let h=s.create('owner',randomUUID(),'en')
  for(const room of ['yard','laundry'])h=(await s.action('owner',h.id,request(h,oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId))).head
  const b={...request(h,'oldstreet:borrow-trolley'),type:'free-input',mode:'live',text:'I will use the cart now.'}
  const result=await s.action('owner',h.id,b);h=result.head
  assert.deepEqual(contexts[0].actions.map((a:any)=>a.id),['oldstreet:borrow-trolley'])
  assert.deepEqual(Object.keys(contexts[0]).sort(),['actions','locale','objective','sceneId','target'])
  assert.equal(h.save.inventory.find(i=>i.id==='trolley')?.count,1)
  assert.deepEqual(await s.action('owner',h.id,b),result);assert.equal(contexts.length,1)
  answer='oldstreet:take-letter'
  await assert.rejects(s.action('owner',h.id,{...request(h,'oldstreet:return-trolley'),type:'free-input',mode:'live',text:'I will put the cart away now.'}),/INPUT_UNSUPPORTED/)
  assert.deepEqual(s.get('owner',h.id),h)
 }finally{raw.close()}
})
test('a model result cannot overwrite a newer action and model failure never mutates the save',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw)
 let release!:(s:string)=>void,started!:()=>void
 const ready=new Promise<void>(r=>started=r)
 const slow=new OldStreetAuthority(db,admit,async()=>{started();return new Promise<string>(r=>release=r)}),fast=new OldStreetAuthority(db,admit)
 try{
  let h=fast.create('owner',randomUUID(),'en')
  for(const room of ['yard','laundry'])h=(await fast.action('owner',h.id,request(h,oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId))).head
  const b={...request(h,'oldstreet:borrow-trolley'),type:'free-input',mode:'live',text:'I take this cart for moving those boxes.'}
  const pending=slow.action('owner',h.id,b);await ready
  const newer=await fast.action('owner',h.id,request(h,'oldstreet:borrow-trolley'))
  release('oldstreet:borrow-trolley');await assert.rejects(pending,/VERSION_CONFLICT/)
  assert.deepEqual(fast.get('owner',h.id),newer.head)
  const failing=new OldStreetAuthority(db,admit,async()=>{throw Error('TEST_MODEL_OFFLINE')})
  await assert.rejects(failing.action('owner',h.id,{...request(newer.head,'oldstreet:return-trolley'),type:'free-input',mode:'live',text:'I put the cart back where it belongs.'}),/TEST_MODEL_OFFLINE/)
  assert.deepEqual(fast.get('owner',h.id),newer.head)
 }finally{raw.close()}
})
test('photo side quest survives disk recovery and lost receipts without restoring the taken folder',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'oldstreet-photo-recovery-')),file=join(temp,'synthetic.sqlite')
 let raw=new DatabaseSync(file),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('owner',randomUUID(),'zh')
  const run=async(id:string,extra={})=>{
   const body={...request(h,id),...extra},result=await s.action('owner',h.id,body);h=result.head
   raw.close();raw=new DatabaseSync(file);s=new OldStreetAuthority(storage(raw),admit)
   assert.deepEqual(s.get('owner',h.id),h)
   assert.deepEqual(await s.action('owner',h.id,body),result,'lost receipt replays the committed result')
   assert.deepEqual(s.get('owner',h.id),h,'replay must not change inventory or relationships')
   if(h.save.facts['photos-taken']){
    assert.equal(oldStreetPhotoShelfPose(h.save),'empty')
    assert.match(oldStreetSceneKnowledge(h.save,'cellar').find(k=>k.id==='visible:photo-folder')!.text,/空搁架/)
   }
  }
  const go=async(room:string)=>run(oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId)
  await go('yard');await go('laundry');await run('oldstreet:borrow-trolley');await go('yard');await run('oldstreet:clear-crates');await go('cellar');await run('oldstreet:take-photos');await go('yard');await go('street');await go('photo')
  for(const photoMatch of [undefined,{version:'laundry-print-1',piece:'piece-fern',rotation:0},{version:'laundry-print-1',piece:'piece-river',rotation:180}]){
   await assert.rejects(s.action('owner',h.id,{...request(h,'oldstreet:match-photos'),photoMatch}),/PHOTO_ALIGNMENT_REQUIRED/)
   assert.deepEqual(s.get('owner',h.id),h)
  }
  await run('oldstreet:match-photos',{photoMatch:{version:'laundry-print-1',piece:'piece-river',rotation:0}})
  assert.equal(h.save.facts['photos-matched'],true)
  assert.equal(h.save.inventory.find(i=>i.id==='photos')?.count,1)
  await run('oldstreet:return-photos');assert.equal(h.save.facts['photos-returned'],true)
  assert.ok(!h.save.inventory.some(i=>i.id==='photos'&&i.count>0))
  assert.equal(h.save.relationships.filter(r=>r.characterId==='xu-photographer'&&r.axis==='returned-photographs').length,1)
  await go('street');await go('yard');await go('cellar')
  const before=h
  await assert.rejects(s.action('owner',h.id,request(h,'oldstreet:take-photos')),/ACTION_UNAVAILABLE/)
  assert.deepEqual(s.get('owner',h.id),before)
  assert.equal(oldStreetPhotoShelfPose(h.save),'empty')
 }finally{raw.close();rmSync(temp,{recursive:true,force:true})}
})
test('legacy footprint upgrades in place without resetting story or journey identity',()=>{
 const raw=new DatabaseSync(':memory:'),s=new OldStreetAuthority(storage(raw),admit)
 try{
  const h=s.create('owner',randomUUID(),'zh');h.mapVersion='oldstreet-blockout-1';h.position={x:318,y:300}
  raw.prepare('UPDATE journeys SET data=? WHERE id=?').run(JSON.stringify(h),h.id)
  const updated=s.get('owner',h.id)
  assert.equal(updated.id,h.id);assert.equal(updated.version,h.version);assert.deepEqual(updated.save,h.save)
  assert.equal(updated.mapVersion,'oldstreet-blockout-2');assert.ok(updated.position.x<318)
  assert.deepEqual(s.get('owner',h.id),updated)
 }finally{raw.close()}
})


test('returning trolley while standing in its vacant bay restores collision safely and replays once',async()=>{
 const {oldStreetProps,oldStreetWalkable}=await import('../src/old-street-space')
 const raw=new DatabaseSync(':memory:'),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('owner',randomUUID(),'zh')
  for(const step of ['yard','laundry','oldstreet:borrow-trolley']){
   const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId
   h=(await s.action('owner',h.id,request(h,action))).head
  }
  const bay=oldStreetProps.find(p=>p.id==='trolley')!.position
  assert.equal(oldStreetWalkable('laundry',bay,h.save),true)
  const body={...request(h,'oldstreet:return-trolley'),position:bay}
  const result=await s.action('owner',h.id,body)
  assert.equal(result.head.save.facts['trolley-borrowed'],false)
  assert.equal(result.head.save.inventory.some((i:{id:string})=>i.id==='trolley'),false)
  assert.equal(oldStreetWalkable('laundry',bay,result.head.save),false)
  assert.equal(oldStreetWalkable('laundry',result.head.position,result.head.save),true)
  assert.ok(Math.hypot(result.head.position.x-bay.x,result.head.position.y-bay.y)<=64)
  assert.deepEqual(await s.action('owner',h.id,body),result)
  assert.deepEqual(s.get('owner',h.id),result.head)
 }finally{raw.close()}
})


test('short conversations require introductions, preserve facts, isolate memory and replay once',async()=>{
 const {oldStreetConversation}=await import('../src/old-street-conversation')
 const raw=new DatabaseSync(':memory:'),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('owner',randomUUID(),'zh')
  for(const room of ['photo','roof','shed'])h=(await s.action('owner',h.id,request(h,oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId))).head
  const talk=(text:string)=>({...request(h,'oldstreet:greet-watchmaker'),type:'dialogue',text})
  await assert.rejects(s.action('owner',h.id,talk('信在哪里？')),/INTRODUCTION_REQUIRED/)
  h=(await s.action('owner',h.id,request(h,'oldstreet:greet-watchmaker'))).head
  const unchanged=structuredClone(h.save),body=talk('我担心找不到这封信。'),result=await s.action('owner',h.id,body)
  h=result.head
  assert.deepEqual(h.save.facts,unchanged.facts);assert.deepEqual(h.save.inventory,unchanged.inventory);assert.deepEqual(h.save.relationships,unchanged.relationships);assert.deepEqual(h.save.map,unchanged.map)
  assert.deepEqual(await s.action('owner',h.id,body),result)
  assert.equal(oldStreetConversation(h.save,'zhou-watchmaker').length,1)
  assert.equal(oldStreetConversation(h.save,'lan-laundry').length,0)
  const reply=await s.action('owner',h.id,talk('你记得我刚才说什么吗？'));h=reply.head
  assert.match(String(reply.text),/我担心找不到这封信/)
  assert.deepEqual(s.get('owner',h.id),h)
  await assert.rejects(s.action('owner',h.id,{...talk('你好'),target:'drawer'}),/TARGET_REQUIRED/)
 }finally{raw.close()}
})


test('online dialogue commits only paired speech; rejected output leaves no partial turn',async()=>{
 const raw=new DatabaseSync(':memory:');let calls=0,reply='信在修表铺的小格里。'
 const s=new OldStreetAuthority(storage(raw),admit,undefined,async(_input,context)=>{calls++;assert.equal(context.speaker.id,'zhou-watchmaker');return reply})
 try{
  let h=s.create('owner',randomUUID(),'zh')
  for(const room of ['photo','roof','shed'])h=(await s.action('owner',h.id,request(h,oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId))).head
  h=(await s.action('owner',h.id,request(h,'oldstreet:greet-watchmaker'))).head
  const before=structuredClone(h.save),body={...request(h,'oldstreet:greet-watchmaker'),type:'dialogue',mode:'live',text:'我要去哪里找家里的信？'}
  const result=await s.action('owner',h.id,body);h=result.head
  assert.equal(result.source,'model');assert.equal(calls,1)
  const {blocks,...afterState}=h.save,{blocks:_,...beforeState}=before
  assert.deepEqual(afterState,beforeState);assert.equal(blocks.length,before.blocks.length+2)
  assert.deepEqual(await s.action('owner',h.id,body),result);assert.equal(calls,1)
  reply='x'.repeat(301)
  await assert.rejects(s.action('owner',h.id,{...request(h,'oldstreet:greet-watchmaker'),type:'dialogue',mode:'live',text:'请再解释一下。'}),/REJECTED/)
  assert.deepEqual(s.get('owner',h.id),h)
 }finally{raw.close()}
})

test('clock clue requires observed region and identification, including free input; replay grants it once',async()=>{
 const raw=new DatabaseSync(':memory:'),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('owner',randomUUID(),'zh')
  const run=async(action:string)=>{h=(await s.action('owner',h.id,request(h,action))).head}
  const go=async(room:string)=>run(oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===room)!.actionId)
  await go('shop')
  await assert.rejects(s.action('owner',h.id,{...request(h,'oldstreet:inspect-clock'),type:'free-input',text:'检查钟底',mode:'local'}),/ACTION_UNAVAILABLE/)
  assert.equal(s.get('owner',h.id).version,h.version)
  await run('oldstreet:move-box');await run('oldstreet:take-lens');await go('street');await go('photo');await go('roof');await go('shed');await run('oldstreet:take-clock');await go('roof');await go('photo');await go('street');await go('shop')
  const valid={version:'clock-underside-1',region:'south-east',zoom:2.8,mark:'swallows'}
  for(const proof of [undefined,{...valid,region:'center'},{...valid,mark:'leaf'},{...valid,zoom:1}]){
   await assert.rejects(s.action('owner',h.id,{...request(h,'oldstreet:inspect-clock'),clockInspection:proof}),/CLOCK_INSPECTION_REQUIRED/)
   assert.equal(s.get('owner',h.id).version,h.version);assert.equal(s.get('owner',h.id).save.facts['clock-mark-known'],false)
  }
  for(const text of ['检查钟底','查看钟底','检查钟底刻记']){
   await assert.rejects(s.action('owner',h.id,{...request(h,'oldstreet:inspect-clock'),type:'free-input',text,mode:'local'}),/CLOCK_INSPECTION_REQUIRED/)
   assert.equal(s.get('owner',h.id).version,h.version);assert.equal(s.get('owner',h.id).save.facts['clock-mark-known'],false)
  }
  const body={...request(h,'oldstreet:inspect-clock'),clockInspection:valid},result=await s.action('owner',h.id,body)
  assert.equal(result.head.version,h.version+1);assert.equal(result.head.save.facts['clock-mark-known'],true)
  assert.deepEqual(await s.action('owner',h.id,body),result)
  const reopened=new OldStreetAuthority(storage(raw),admit)
  assert.equal(reopened.get('owner',h.id).save.facts['clock-mark-known'],true)
 }finally{raw.close()}
})

test('arrival checkpoint survives refused inspection without a story turn and cannot overwrite a newer scene',async()=>{
 const raw=new DatabaseSync(':memory:'),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('arrival-owner',randomUUID(),'zh')
  const enter=oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='shop')!
  h=(await s.action('arrival-owner',h.id,request(h,enter.actionId))).head
  const body=request(h,'oldstreet:inspect-clock'),before=structuredClone(h.save)
  assert.notDeepEqual(body.position,h.position)
  s.checkpoint('arrival-owner',h.id,{sceneId:h.sceneId,expected_version:h.version,position:body.position})
  await assert.rejects(s.action('arrival-owner',h.id,body),/OLD_STREET_ACTION_UNAVAILABLE/)
  const restored=s.get('arrival-owner',h.id)
  assert.deepEqual(restored.position,body.position)
  assert.equal(restored.version,h.version)
  assert.deepEqual(restored.save,before)
  const leave=oldStreetDoors().find(d=>d.room==='shop'&&d.destination.room==='street')!
  const newer=(await s.action('arrival-owner',h.id,request(restored,leave.actionId))).head
  assert.throws(()=>s.checkpoint('arrival-owner',h.id,{sceneId:h.sceneId,expected_version:h.version,position:body.position}),/STALE_POSITION/)
  assert.deepEqual(s.get('arrival-owner',h.id),newer)
 }finally{raw.close()}
})

test('journey directory isolates owners and retains completed journeys when starting again',async()=>{
 const raw=new DatabaseSync(':memory:'),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('directory-owner',randomUUID(),'zh')
  s.create('other-owner',randomUUID(),'en')
  const original=h.id
  for(const step of ['photo','roof','shed','oldstreet:borrow-key','roof','photo','street','shop','oldstreet:unlock-letter','oldstreet:take-letter','street','oldstreet:leave']){
   const id=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId
   h=(await s.action('directory-owner',h.id,request(h,id))).head
  }
  const newJourney=s.create('directory-owner',randomUUID(),'zh'),rows=s.directory('directory-owner')
  assert.equal(rows.length,2);assert.equal(rows.find(r=>r.id===original)?.complete,true)
  assert.equal(rows.find(r=>r.id===newJourney.id)?.complete,false)
  assert.deepEqual(s.get('directory-owner',original),h)
  assert.equal(s.directory('other-owner').length,1)
  assert.throws(()=>s.get('other-owner',original))
 }finally{raw.close()}
})

test('expansion intention persists through reopen without admitting a room or blocking exploration',async()=>{
 const temp=mkdtempSync(join(tmpdir(),'oldstreet-expansion-')),file=join(temp,'journey.sqlite')
 let raw=new DatabaseSync(file),s=new OldStreetAuthority(storage(raw),admit)
 try{
  let h=s.create('synthetic-owner',randomUUID(),'zh')
  h=(await s.action('synthetic-owner',h.id,request(h,oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='photo')!.actionId))).head
  const before=structuredClone(h.save),b={action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position,type:'expansion-request',template:'photo-darkroom-v1',text:'我想看看照相馆后面封着的暗房。'}
  const result=await s.action('synthetic-owner',h.id,b);h=result.head
  assert.deepEqual(h.save,before);assert.equal(h.sceneId,'photo')
  assert.equal(h.expansions?.[0].status,'requested');assert.equal(h.expansions?.[0].input,b.text)
  raw.close();raw=new DatabaseSync(file);s=new OldStreetAuthority(storage(raw),admit)
  assert.deepEqual(s.get('synthetic-owner',h.id),h)
  assert.deepEqual(await s.action('synthetic-owner',h.id,b),result)
  const next=(await s.action('synthetic-owner',h.id,request(h,oldStreetDoors().find(d=>d.room==='photo'&&d.destination.room==='street')!.actionId))).head
  assert.equal(next.sceneId,'street');assert.deepEqual(next.expansions,h.expansions)
  assert.notEqual(next.save.facts['darkroom-ready'],true)
 }finally{raw.close();rmSync(temp,{recursive:true,force:true})}
})

test('expansion plan job survives archive reopen and does not replay generation',async()=>{
 const {OldStreetExpansionJobs}=await import('../server/old-street-expansion-jobs')
 const {compileExpansionPlan}=await import('../src/old-street-expansion-plan')
 const raw=new DatabaseSync(':memory:'),db=storage(raw),s=new OldStreetAuthority(db,admit)
 try{
  let h=s.create('synthetic-owner',randomUUID(),'zh')
  h=(await s.action('synthetic-owner',h.id,request(h,oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='photo')!.actionId))).head
  h=(await s.action('synthetic-owner',h.id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position,type:'expansion-request',template:'photo-darkroom-v1',text:'想看看暗房'})).head
  let calls=0
  const produce=async(intent:any)=>{calls++;return compileExpansionPlan(intent,{title:'暗房',discovery:'两边窗沿接上了。',photograph:'A continuous old storefront with windows.'})}
  let jobs=new OldStreetExpansionJobs(db,(o,id)=>s.get(o,id),produce)
  assert.equal(jobs.enqueue('synthetic-owner',h.id).state,'queued')
  const result=await jobs.run('synthetic-owner',h.id)
  assert.equal(result?.state,'candidate');assert.deepEqual(s.get('synthetic-owner',h.id),h)
  jobs=new OldStreetExpansionJobs(db,(o,id)=>s.get(o,id),produce)
  assert.deepEqual(jobs.enqueue('synthetic-owner',h.id),result)
  assert.deepEqual(await jobs.run('synthetic-owner',h.id),result);assert.equal(calls,1)
 }finally{raw.close()}
})

test('expansion HTTP starts background work and returns before model completion',async()=>{
 const {OldStreetExpansionJobs}=await import('../server/old-street-expansion-jobs')
 const {oldStreetExpansionOperation}=await import('../server/old-street-http')
 const {compileExpansionPlan}=await import('../src/old-street-expansion-plan')
 const raw=new DatabaseSync(':memory:'),db=storage(raw),s=new OldStreetAuthority(db,admit)
 try{
  let h=s.create('synthetic-owner',randomUUID(),'zh')
  h=(await s.action('synthetic-owner',h.id,request(h,oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='photo')!.actionId))).head
  h=(await s.action('synthetic-owner',h.id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position,type:'expansion-request',template:'photo-darkroom-v1',text:'想看看暗房'})).head
  let release!:()=>void;const gate=new Promise<void>(r=>release=r),tasks:Promise<unknown>[]=[]
  const jobs=new OldStreetExpansionJobs(db,(o,id)=>s.get(o,id),async intent=>{await gate;return compileExpansionPlan(intent,{title:'暗房',discovery:'窗沿接上了。',photograph:'Old storefront, continuous sill.'})})
  const response=oldStreetExpansionOperation('POST','synthetic-owner',h.id,jobs,{},p=>tasks.push(p))
  assert.equal(response.job?.state,'queued');assert.equal(tasks.length,1)
  assert.equal(oldStreetExpansionOperation('GET','synthetic-owner',h.id,jobs,undefined,()=>{}).job?.state,'planning')
  const moved=await s.action('synthetic-owner',h.id,request(h,oldStreetDoors().find(d=>d.room==='photo'&&d.destination.room==='street')!.actionId))
  assert.equal(moved.head.sceneId,'street')
  release();await Promise.all(tasks)
  assert.equal(jobs.get('synthetic-owner',h.id)?.state,'candidate');assert.equal(s.get('synthetic-owner',h.id).sceneId,'street')
 }finally{raw.close()}
})

for(const decision of ['keep','leave'])test(`prepared expansion opens a real bound room, saves ${decision} choice and permits return travel`,async()=>{
 const {OldStreetExpansionJobs}=await import('../server/old-street-expansion-jobs')
 const {compileExpansionPlan}=await import('../src/old-street-expansion-plan')
 const raw=new DatabaseSync(':memory:'),db=storage(raw)
 let jobs:InstanceType<typeof OldStreetExpansionJobs>
 const s=new OldStreetAuthority(db,admit,undefined,undefined,h=>jobs?.candidateFor(h),()=> 'a'.repeat(64))
 try{
  let h=s.create('synthetic-owner',randomUUID(),'zh')
  const go=async(to:string)=>{h=(await s.action('synthetic-owner',h.id,request(h,oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===to)!.actionId))).head}
  await go('photo')
  h=(await s.action('synthetic-owner',h.id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position,type:'expansion-request',template:'photo-darkroom-v1',text:'想看看暗房'})).head
  const activate=()=>({action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position,type:'expansion-activate'})
  await assert.rejects(s.action('synthetic-owner',h.id,activate()),/EXPANSION_UNAVAILABLE/)
  jobs=new OldStreetExpansionJobs(db,(o,id)=>s.get(o,id),async intent=>compileExpansionPlan(intent,{title:'暗房',discovery:'旧街影像。',photograph:'An old storefront with continuous window edges.'}))
  jobs.enqueue('synthetic-owner',h.id);await jobs.run('synthetic-owner',h.id)
  h=(await s.action('synthetic-owner',h.id,activate())).head
  assert.equal(h.save.facts['darkroom-ready'],true)
  await go('darkroom')
  h=(await s.action('synthetic-owner',h.id,request(h,'oldstreet:observe-darkroom'))).head
  assert.equal(h.sceneId,'darkroom');assert.equal(h.save.inventory.length,0)
  const {oldStreetWalkable}=await import('../src/old-street-space')
  assert.equal(oldStreetWalkable('darkroom',{x:160,y:180},h.save),false)
  assert.equal(oldStreetWalkable('darkroom',h.position,h.save),true)
  const proof={action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position,type:'expansion-photo-match',photoMatch:{version:'a'.repeat(64),piece:'piece-river',rotation:0}}
  await assert.rejects(s.action('synthetic-owner',h.id,{...proof,photoMatch:{...proof.photoMatch,version:'b'.repeat(64)}}),/ALIGNMENT_REQUIRED/)
  await assert.rejects(s.action('synthetic-owner',h.id,{...proof,type:'free-input',target:'developing-bench',text:'把照片拼起来',photoMatch:undefined}),/ALIGNMENT_REQUIRED/)
  const result=await s.action('synthetic-owner',h.id,proof);h=result.head
  assert.equal(h.save.facts['darkroom-photo-matched'],'a'.repeat(64))
  assert.deepEqual(await s.action('synthetic-owner',h.id,proof),result)
  assert.equal(s.get('synthetic-owner',h.id).save.facts['darkroom-photo-matched'],'a'.repeat(64))
  const choose={action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position,type:'expansion-photo-decision',decision}
  const selection=decision==='keep'?{...choose,type:'free-input',target:'developing-bench',text:'把照片带走'}:choose
  await assert.rejects(s.action('synthetic-owner',h.id,{...selection,action_id:randomUUID(),type:'free-input',target:'developing-bench',text:'先不要把照片带走'}),/INPUT_UNSUPPORTED/)
  const chosen=await s.action('synthetic-owner',h.id,selection);h=chosen.head
  assert.equal(h.save.facts['darkroom-photo-choice'],decision)
  assert.equal(h.save.inventory.filter(i=>i.id==='darkroom-print').length,decision==='keep'?1:0)
  assert.deepEqual(await s.action('synthetic-owner',h.id,selection),chosen)
  await assert.rejects(s.action('synthetic-owner',h.id,{...choose,expected_version:h.version,action_id:randomUUID()}),/ACTION_UNAVAILABLE/)
  const {oldStreetJournal}=await import('../src/old-street-journal')
  assert.ok(oldStreetJournal(h.save).notes.find(n=>n.id==='darkroom-photo')?.text.includes(decision==='keep'?'身上':'留在暗房'))
  const observed=await s.action('synthetic-owner',h.id,request(h,'oldstreet:observe-darkroom'));h=observed.head
  assert.ok(observed.text.includes(decision==='keep'?'行囊里':'显影台上'))
  await go('photo');assert.equal(h.save.facts['darkroom-ready'],true)
  assert.equal(h.save.facts['darkroom-photo-matched'],'a'.repeat(64))
 }finally{raw.close()}
})
