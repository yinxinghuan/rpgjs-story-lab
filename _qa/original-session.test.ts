import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID,createHash} from 'node:crypto'
import {mkdtempSync,readFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate,originalTrainRuntime} from '../server/original-train-runtime'
import {ProductionAuthority} from '../server/production-authority'
import {localReply} from '../src/contract'
import {SessionAuthority,type AuthorityStorage} from '../server/session-authority'
import {originalTrainSpatialPlan} from '../src/original-train-spatial-plan'
import type {StoryTurnGenerator} from '../src/vendor/original-train/engine/executeTurn'
// This suite validates rules and durable transactions. This explicit gate is
// synthetic admission, not a claim that NPC or other regions' art is ready.
const syntheticAdmission:OriginalPresentationGate=()=>true
const world=originalTrainSpatialPlan()
function storage(raw:DatabaseSync):AuthorityStorage{return {all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const result=work();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}}
function request(h:OriginalHead,id:string,free=false){const entity=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!;return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:entity.id,position:entity.approach,mode:'local',...(free?{type:'free-input',text:originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0]}:{type:'action',action:id})}}
function setup(gate=syntheticAdmission,generator?:StoryTurnGenerator){const raw=new DatabaseSync(':memory:'),db=storage(raw);return {raw,db,service:new OriginalTrainAuthority(db,gate,generator)}}
test('vendored original v8 sources are exact recorded copies',()=>{
 const base=new URL('../src/vendor/original-train/',import.meta.url),manifest=JSON.parse(readFileSync(new URL('SOURCE.json',base),'utf8'))
 assert.equal(manifest.sourceSchema,8);for(const [name,hash] of Object.entries(manifest.files))assert.equal(createHash('sha256').update(readFileSync(new URL(name,base))).digest('hex'),hash,name)
})
test('unready original presentation cannot create a playable journey',()=>{const {raw,db}=setup();const service=new OriginalTrainAuthority(db);assert.throws(()=>service.create('owner',randomUUID(),'zh'),/ORIGINAL_PRESENTATION_NOT_READY/);assert.equal(db.all<{n:number}>('SELECT COUNT(*) AS n FROM journeys')[0].n,0);raw.close()})
for(const locale of ['zh','en'] as const)for(const route of ['valley','quarry','forest'])test(`original ${locale}/${route} mixed inputs, replay, disk reopen and checkpoint preserve v8`,async()=>{
 const temp=mkdtempSync(join(tmpdir(),'original-session-')),file=join(temp,'synthetic.sqlite');let raw=new DatabaseSync(file),db=storage(raw),service=new OriginalTrainAuthority(db,syntheticAdmission)
 try{
  const enrollment=randomUUID();let h=service.create('owner',enrollment,locale);const opening=structuredClone(h.save.blocks),finale=structuredClone(h.save.finale)
  assert.deepEqual(service.create('owner',enrollment,locale),h)
  assert.throws(()=>service.create('owner',enrollment,locale==='en'?'zh':'en'),/ENROLLMENT_ID_CONFLICT/)
  let i=0
  for(const action of ['replace-brake-hose','inspect-brakes','replace-brake-hose','repair-starter','repair-starter','salvage-fuel-shed',`commit-${route}-route`,'use-master-switch-key']){
   const b=request(h,action,++i%2===0),r=await service.action('owner',h.id,b)
   assert.equal(r.accepted,![1,5,8].includes(i));assert.equal(r.cursor,i)
   assert.deepEqual(await service.action('owner',h.id,b),r);h=r.head
   const events=service.events('owner',h.id,0);assert.equal(events.length,i)
   raw.close();raw=new DatabaseSync(file);db=storage(raw);service=new OriginalTrainAuthority(db,syntheticAdmission)
   assert.deepEqual(service.get('owner',h.id),h);assert.deepEqual(await service.action('owner',h.id,b),r)
   assert.throws(()=>service.get('stranger',h.id),/SESSION_NOT_FOUND/)
   assert.equal(service.directory('stranger').length,0)
   await assert.rejects(service.action('stranger',h.id,b),/SESSION_NOT_FOUND/)
   assert.deepEqual(service.get('owner',h.id).save.finale,finale)
  }
  assert.equal(h.save.version,8);assert.deepEqual(h.save.characters.map(c=>c.id),['ada-mechanic']);assert.deepEqual(h.save.partyMemberIds,['ada-mechanic'])
  assert.equal(h.save.inventory.find(i=>i.id==='spare-hose')?.count??0,0);assert.equal(h.save.inventory.find(i=>i.id==='sealed-diesel')?.count,2)
  assert.equal(h.save.stats.condition,97);assert.equal(h.save.stats.morale,58);assert.equal(h.save.stats.fuel,{valley:76,quarry:77,forest:78}[route]);assert.equal(h.save.facts['route-family'],route)
  for(const block of opening)assert.deepEqual(h.save.blocks.find(b=>b.id===block.id),block)
  const point={x:190,y:440};assert.deepEqual(service.checkpoint('owner',h.id,{sceneId:h.sceneId,expected_version:h.version,position:point}),{position:point})
  const oldVersion=h.version-1;assert.throws(()=>service.checkpoint('owner',h.id,{sceneId:h.sceneId,expected_version:oldVersion,position:h.position}),/STALE_POSITION/)
  assert.deepEqual(service.get('owner',h.id).position,point)
 }finally{raw.close();rmSync(temp,{recursive:true,force:true})}
})
test('original cross-target input, off-scene input and unprepared dialogue cannot write a turn',async()=>{
 let calls=0;const {raw,db,service:s}=setup(syntheticAdmission,{send:async()=>{calls++;throw Error('AUTHORED_ONLY')}})
 const h=s.create('owner',randomUUID(),'en'),base=request(h,'inspect-brakes')
 for(const changed of [{type:'free-input',text:originalCartridge('en').domainRules!.rules.find(r=>r.id==='repair-starter')!.match[0]},{sceneId:'train-at-river-valley'},{position:{x:188,y:130}},{type:'free-input',text:'Walk into a restaurant that is not made yet.'},{mode:'live'}])await assert.rejects(s.action('owner',h.id,{...base,action_id:randomUUID(),...changed}))
 assert.equal(calls,0);assert.deepEqual(s.get('owner',h.id),h);assert.equal(s.events('owner',h.id,0).length,0);assert.equal(db.all<{n:number}>('SELECT COUNT(*) AS n FROM receipts')[0].n,0);raw.close()
})
test('missing next-state presentation rejects after source engine without changing story or receipt',async()=>{
 const gate:OriginalPresentationGate=(h,previous)=>{if(previous&&h.save.facts['brake-hose-warning'])throw Error('MISSING_CRACKED_HOSE_ART');return true}
 const {raw,service:s}=setup(gate);const h=s.create('owner',randomUUID(),'en')
 await assert.rejects(s.action('owner',h.id,request(h,'inspect-brakes')),/MISSING_CRACKED_HOSE_ART/)
 assert.deepEqual(s.get('owner',h.id),h);assert.equal(s.events('owner',h.id,0).length,0);raw.close()
})
test('two authority instances cannot overwrite a newer original story after async preparation',async()=>{
 let release!:()=>void,started!:()=>void,calls=0;const ready=new Promise<void>(r=>started=r),gate=new Promise<void>(r=>release=r)
 const {raw,db,service:slow}=setup(syntheticAdmission,{send:async()=>{calls++;started();await gate;throw Error('AUTHORED_ONLY')}})
 const fast=new OriginalTrainAuthority(db,syntheticAdmission),h=slow.create('owner',randomUUID(),'en'),b=request(h,'repair-starter')
 const one=slow.action('owner',h.id,b);await ready;const duplicate=slow.action('owner',h.id,b)
 await assert.rejects(slow.action('owner',h.id,{...b,action:'inspect-brakes'}),/ACTION_ID_CONFLICT/)
 const newer=await fast.action('owner',h.id,request(h,'inspect-brakes'))
 release();await assert.rejects(one,/VERSION_CONFLICT/);await assert.rejects(duplicate,/VERSION_CONFLICT/)
 assert.equal(calls,1);assert.deepEqual(fast.get('owner',h.id),newer.head);assert.equal(fast.events('owner',h.id,0).length,1);raw.close()
})
test('original receipt write failure rolls back story and event; same request can recover',async()=>{
 const {raw,db}=setup();let fail=true
 const broken:AuthorityStorage={...db,run:(q,...b)=>{if(fail&&q.startsWith('INSERT INTO receipts'))throw Error('TEST_DISK_FAILURE');db.run(q,...b)}}
 const s=new OriginalTrainAuthority(broken,syntheticAdmission),h=s.create('owner',randomUUID(),'en'),b=request(h,'repair-starter')
 await assert.rejects(s.action('owner',h.id,b),/TEST_DISK_FAILURE/);assert.deepEqual(s.get('owner',h.id),h);assert.equal(s.events('owner',h.id,0).length,0)
 fail=false;const r=await s.action('owner',h.id,b);assert.equal(r.accepted,true);assert.deepEqual(await s.action('owner',h.id,b),r);raw.close()
})
test('shared commit kernel rejects policy attempts to change journey identity or skip versions',async()=>{
 for(const change of ['identity','version']){
  const {raw,db}=setup(),runtime=originalTrainRuntime(syntheticAdmission),original=runtime.prepare
  runtime.prepare=async(...args)=>{const result=await original(...args);if(change==='identity')result.head.id=randomUUID();else result.head.version+=1;return result}
  const s=new SessionAuthority(db,runtime),h=s.create('owner',randomUUID(),'en')
  await assert.rejects(s.action('owner',h.id,request(h,'inspect-brakes')),/INVALID_COMMIT_CANDIDATE/);assert.deepEqual(s.get('owner',h.id),h);assert.equal(s.events('owner',h.id,0).length,0);raw.close()
 }
})

test('one shared store cannot mix original v8 and carriage v10 journeys',()=>{
 for(const originalFirst of [true,false]){
  const {raw,db,service:original}=setup(),carriage=new ProductionAuthority(db,async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'local'}}))
  if(originalFirst){original.create('first-owner',randomUUID(),'zh');assert.throws(()=>carriage.create('other-owner',randomUUID(),'zh'))}
  else{carriage.create('first-owner',randomUUID(),'zh');assert.throws(()=>original.create('other-owner',randomUUID(),'zh'))}
  assert.equal(db.all<{n:number}>('SELECT COUNT(*) AS n FROM journeys')[0].n,1);raw.close()
 }
})

test('original readiness must return an explicit synchronous true',()=>{
 for(const gate of [()=>false,()=>undefined,()=>Promise.resolve(true)]){
  const {raw,db}=setup(),s=new OriginalTrainAuthority(db,gate as unknown as OriginalPresentationGate)
  assert.throws(()=>s.create('owner',randomUUID(),'en'),/ORIGINAL_PRESENTATION_NOT_READY/)
  assert.equal(db.all<{n:number}>('SELECT COUNT(*) AS n FROM journeys')[0].n,0);raw.close()
 }
})
