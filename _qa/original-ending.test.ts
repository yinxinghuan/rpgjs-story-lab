import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {OriginalEndingGenerator} from '../server/original-ending'
import type {AuthorityStorage} from '../server/session-authority'
import {buildEndingSnapshot,canStartTrueEnding,fallbackEndingCandidate,validateEndingCandidate} from '../src/vendor/original-train/engine/endingDirector'

// Transaction fixtures, deliberately NOT evidence of a playable opening-to-ending route.
const admission:OriginalPresentationGate=()=>true
function storage(raw:DatabaseSync):AuthorityStorage{return {all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}}
function write(db:AuthorityStorage,h:OriginalHead){db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)}
function ready(db:AuthorityStorage,s:OriginalTrainAuthority,locale:'zh'|'en'='en'){
 const h=s.create('synthetic-owner',randomUUID(),locale)
 h.save.scene=24;h.save.facts['chapter-bridge-complete']=true;h.save.finale={status:'ready',reason:'synthetic-ending-transaction-fixture'}
 assert.equal(canStartTrueEnding(h.save,originalCartridge(locale)),true);write(db,h);return h
}
function request(h:OriginalHead){return {ending_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,mapVersion:h.mapVersion,snapshot_id:buildEndingSnapshot(h.save,originalCartridge(h.save.locale)).id}}
function setup(generator?:OriginalEndingGenerator,gate=admission){const raw=new DatabaseSync(':memory:'),db=storage(raw),s=new OriginalTrainAuthority(db,gate,undefined,generator);return {raw,db,s,h:ready(db,s)}}
const author:OriginalEndingGenerator=async(snapshot,c)=>({candidate:fallbackEndingCandidate(snapshot,c),generated:false})
function deferred(){let release!:()=>void,started!:()=>void;const entered=new Promise<void>(r=>started=r),wait=new Promise<void>(r=>release=r);return {entered,release,generator:(async(s,c)=>{started();await wait;return author(s,c)}) as OriginalEndingGenerator}}
function untouched(s:OriginalTrainAuthority,h:OriginalHead,db:AuthorityStorage){assert.deepEqual(s.get('synthetic-owner',h.id),h);assert.equal(s.events('synthetic-owner',h.id,0).length,0);assert.equal(db.all<{n:number}>('SELECT COUNT(*) AS n FROM receipts')[0].n,0)}

for(const locale of ['zh','en'] as const)test(`original ${locale} ending preserves save and cursor, survives disk reopen and exact replay`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'original-ending-')),path=join(dir,'synthetic.sqlite');let raw=new DatabaseSync(path),db=storage(raw),s=new OriginalTrainAuthority(db,admission)
 try{
  const h=ready(db,s,locale),body=request(h),r=await s.ending('synthetic-owner',h.id,body)
  assert.equal(r.kind,'ending');assert.equal(r.source,'author');assert.equal(r.cursor,0);assert.equal(r.head.version,h.version+1)
  assert.deepEqual({...r.head.save,finale:h.save.finale},h.save);assert.deepEqual(r.head.position,h.position)
  assert.equal(r.head.save.finale.status,'complete');assert.equal(r.head.save.finale.ending.snapshotId,body.snapshot_id)
  assert.deepEqual(validateEndingCandidate(r.head.save.finale.ending,r.head.save.finale.snapshot,originalCartridge(locale)),[])
  assert.equal(s.events('synthetic-owner',h.id,0).length,0);assert.equal(s.directory('synthetic-owner')[0].cursor,0)
  raw.close();raw=new DatabaseSync(path);db=storage(raw);s=new OriginalTrainAuthority(db,admission)
  assert.deepEqual(await s.ending('synthetic-owner',h.id,body),r);assert.deepEqual(s.get('synthetic-owner',h.id),r.head)
  await assert.rejects(s.ending('synthetic-owner',h.id,{...body,expected_version:1}),/ACTION_ID_CONFLICT/)
  await assert.rejects(s.ending('stranger',h.id,body),/SESSION_NOT_FOUND/)
  await assert.rejects(s.action('synthetic-owner',h.id,{action_id:randomUUID(),expected_version:1}),/ORIGINAL_FINALE_PENDING/)
 }finally{raw.close();rmSync(dir,{recursive:true,force:true})}
})

test('ending rejects client facts, stale scene/version/snapshot and unmet original requirements without writes',async()=>{
 const {raw,db,s,h}=setup(),b=request(h)
 for(const change of [{expected_version:9},{sceneId:'missing'},{mapVersion:'stale'},{snapshot_id:'ending-wrong'},{facts:{'chapter-bridge-complete':true}},{candidate:{title:'client ending'}},{ending_id:'short'}]){
  await assert.rejects(s.ending('synthetic-owner',h.id,{...b,...change}));untouched(s,h,db)
 }
 for(const mutation of [(v:OriginalHead)=>v.save.finale.status='idle',(v:OriginalHead)=>v.save.scene=23,(v:OriginalHead)=>delete v.save.facts['chapter-bridge-complete']]){
  const changed=structuredClone(h);mutation(changed);write(db,changed);await assert.rejects(s.ending('synthetic-owner',h.id,request(changed)),/ENDING_NOT_READY/);untouched(s,changed,db)
 }
 raw.close()
})

test('ending candidate capability, cost, cast and field-shape violations cannot commit',async()=>{
 for(const mutate of [(c:any)=>c.capabilitiesUsed=['unavailable'],(c:any)=>c.irreversibleCosts=[],(c:any)=>c.characterEpilogues.push({characterId:'never-introduced',text:'invented'}),(c:any)=>c.finaleScenes=[1,2,3,4],(c:any)=>c.preserved=[{}],(c:any)=>c.characterEpilogues[0].text=null]){
  const {raw,db,s,h}=setup(async(snapshot,c)=>{const r=await author(snapshot,c);mutate(r.candidate);return r})
  await assert.rejects(s.ending('synthetic-owner',h.id,request(h)),/ENDING_RESULT_MISMATCH/);untouched(s,h,db);raw.close()
 }
})

test('ending failure and presentation refusal retain original head, same envelope can retry',async()=>{
 let unavailable=true,refuse=true,calls=0
 const {raw,db,s,h}=setup(async(snapshot,c)=>{calls++;if(unavailable)throw Error('SYNTHETIC_PROVIDER_FAILURE');return author(snapshot,c)},(next)=>{if(next.save.finale.status==='complete'&&refuse)throw Error('MISSING_ENDING_PRESENTATION');return true})
 const b=request(h)
 await assert.rejects(s.ending('synthetic-owner',h.id,b),/ENDING_UNAVAILABLE/);untouched(s,h,db)
 unavailable=false;await assert.rejects(s.ending('synthetic-owner',h.id,b),/MISSING_ENDING_PRESENTATION/);untouched(s,h,db)
 refuse=false;const r=await s.ending('synthetic-owner',h.id,b);assert.equal(r.head.save.finale.status,'complete');assert.equal(calls,3);raw.close()
})

test('ending coalesces in one authority and replays concurrent commits across instances',async()=>{
 const d=deferred(),{raw,db,s,h}=setup(d.generator),b=request(h),first=s.ending('synthetic-owner',h.id,b);await d.entered
 const duplicate=s.ending('synthetic-owner',h.id,b)
 await assert.rejects(s.ending('synthetic-owner',h.id,{...b,snapshot_id:'ending-changed'}),/ACTION_ID_CONFLICT/)
 const other=new OriginalTrainAuthority(db,admission),committed=await other.ending('synthetic-owner',h.id,b)
 d.release();assert.deepEqual(await first,committed);assert.deepEqual(await duplicate,committed)
 assert.equal(db.all<{n:number}>('SELECT COUNT(*) AS n FROM receipts')[0].n,1);assert.equal(other.directory('synthetic-owner')[0].cursor,0);raw.close()
})

test('late ending rejects newer versions and same-version story mutations',async()=>{
 for(const change of [(v:OriginalHead)=>v.version++,(v:OriginalHead)=>v.save.facts['late-fact']='must survive',(v:OriginalHead)=>v.save.danger.phase='warning']){
  const d=deferred(),{raw,db,s,h}=setup(d.generator),pending=s.ending('synthetic-owner',h.id,request(h));await d.entered
  const newer=structuredClone(h);change(newer);write(db,newer);d.release()
  await assert.rejects(pending,/VERSION_CONFLICT|ENDING_SNAPSHOT_MISMATCH/);untouched(s,newer,db);raw.close()
 }
})

test('ending retains a concurrent position checkpoint without changing ordinary cursor',async()=>{
 const d=deferred(),{raw,db,s,h}=setup(d.generator),pending=s.ending('synthetic-owner',h.id,request(h));await d.entered
 const position={x:190,y:440};s.checkpoint('synthetic-owner',h.id,{sceneId:h.sceneId,expected_version:h.version,position})
 d.release();const r=await pending;assert.deepEqual(r.head.position,position);assert.deepEqual(s.get('synthetic-owner',h.id).position,position);assert.equal(r.cursor,0);raw.close()
})

test('ending receipt failure rolls back head; ending IDs do not collide with ordinary action IDs',async()=>{
 const {raw,db,s:initial,h}=setup();let fail=true
 const broken={...db,run:(q:string,...b:any[])=>{if(fail&&q.startsWith('INSERT INTO receipts'))throw Error('SYNTHETIC_DISK_FAILURE');db.run(q,...b)}}
 const s=new OriginalTrainAuthority(broken,admission),b=request(h)
 await assert.rejects(s.ending('synthetic-owner',h.id,b),/SYNTHETIC_DISK_FAILURE/);untouched(initial,h,db)
 // A pre-existing ordinary receipt with the same external UUID must remain separate.
 db.run('INSERT INTO receipts VALUES(?,?,?,?)','synthetic-owner',b.ending_id,'ordinary-digest','{}');fail=false
 const r=await s.ending('synthetic-owner',h.id,b);assert.equal(r.kind,'ending')
 assert.equal(db.all<{n:number}>('SELECT COUNT(*) AS n FROM receipts')[0].n,2);raw.close()
})
