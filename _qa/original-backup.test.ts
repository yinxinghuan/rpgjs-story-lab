import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalTrainAuthority,originalCartridge} from '../server/original-train-runtime'
import {OriginalIllustrations} from '../server/original-illustration'
import type {AuthorityStorage} from '../server/session-authority'
import {restoreOriginalJourneyToEmptyDatabase,validateOriginalBackup,originalBackupChecksum} from '../server/original-backup'
import {originalGameEntities} from '../src/original-game-projection'
import {environmentStoryRoute} from './environment-story-route'
import {buildEndingSnapshot} from '../src/vendor/original-train/engine/endingDirector'
import {originalEndingCartridge} from '../src/original-ending-capabilities'
const owner='a'.repeat(64)
function setup(){const raw=new DatabaseSync(':memory:');let fail=false
 const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{if(fail&&q.startsWith('INSERT INTO receipts'))throw Error('DISK_FAILURE');raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 const service=new OriginalTrainAuthority(db,()=>true),images=new OriginalIllustrations(db,(o,id)=>service.get(o,id));return {raw,db,service,images,fail:()=>{fail=true}}
}
function action(h:any,id:string){const e=originalGameEntities(h).find(e=>e.actions.some(a=>a.id===id))!;assert.ok(e,id);return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action:id}}
for(const locale of ['zh','en']as const)test('original backup restores complete '+locale+' journey, ending receipt and immutable art',async()=>{
 const s=setup(),t=setup();try{const enrollment=randomUUID();let h=s.service.create(owner,enrollment,locale),last:any
 for(const id of environmentStoryRoute){const body=action(h,id);last={body,result:await s.service.action(owner,h.id,body)};h=last.result.head}
 const snapshot=buildEndingSnapshot(h.save,originalEndingCartridge(h.save,originalCartridge(locale))),body={ending_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,mapVersion:h.mapVersion,snapshot_id:snapshot.id}
 const ending=await s.service.ending(owner,h.id,body);h=ending.head
 s.service.create('b'.repeat(64),randomUUID(),'en');s.service.create(owner,randomUUID(),'zh')
 const backup=await s.service.backup(owner,h.id);assert.equal(backup.payload.tables.journal.length,environmentStoryRoute.length);assert.equal(backup.payload.tables.receipts.length,h.version)
 assert.equal(backup.payload.tables.journeys.length,1);const result=await restoreOriginalJourneyToEmptyDatabase(t.db,backup);assert.equal(result.version,h.version)
 assert.deepEqual(t.service.get(owner,h.id),h);assert.deepEqual(await t.service.ending(owner,h.id,body),ending);assert.deepEqual(await t.service.action(owner,h.id,last.body),last.result);assert.deepEqual(t.service.get(owner,h.id),h);assert.equal(t.service.create(owner,enrollment,locale).id,h.id)
 assert.deepEqual((await t.service.backup(owner,h.id)).payload.tables,backup.payload.tables)
 }finally{s.raw.close();t.raw.close()}
})
test('prepared action and owner quotas survive original backup without committing early',async()=>{
 const s=setup(),t=setup();try{const h=s.service.create(owner,randomUUID(),'en'),body=action(h,'repair-starter'),prepared=await s.service.prepareAction(owner,h.id,body)
 s.db.run('INSERT INTO narration_usage VALUES(?,?,?)',owner,Date.now(),6);s.db.run('INSERT INTO original_illustration_usage VALUES(?,?,?)',owner,123,2)
 const backup=await s.service.backup(owner,h.id);await restoreOriginalJourneyToEmptyDatabase(t.db,backup);assert.equal(t.service.get(owner,h.id).version,0)
 assert.deepEqual(await t.service.prepareAction(owner,h.id,body),prepared);const committed=await t.service.commitPreparedAction(owner,h.id,body);assert.equal(committed.head.version,1);assert.deepEqual(await t.service.commitPreparedAction(owner,h.id,body),committed)
 assert.equal(t.db.all<any>('SELECT uses FROM narration_usage')[0].uses,6);assert.equal(t.db.all<any>('SELECT uses FROM original_illustration_usage')[0].uses,2)
 }finally{s.raw.close();t.raw.close()}
})
test('original backup refuses corruption, missing ending/action receipts, foreign owner and nonempty targets',async()=>{
 const s=setup(),t=setup();try{let h=s.service.create(owner,randomUUID(),'en');h=(await s.service.action(owner,h.id,action(h,'repair-starter'))).head;const b=await s.service.backup(owner,h.id)
 await assert.rejects(s.service.backup('b'.repeat(64),h.id),/SESSION_NOT_FOUND/)
 const bad=structuredClone(b);bad.payload.tables.journeys[0].data+=' ';await assert.rejects(validateOriginalBackup(bad),/INVALID_ORIGINAL_BACKUP/)
 for(const mutate of [(p:any)=>p.tables.receipts.pop(),(p:any)=>p.tables.journal[0].cursor=9,(p:any)=>p.tables.receipts[0].owner='b'.repeat(64),(p:any)=>p.gameId=randomUUID(),(p:any)=>p.tables.journeys[0].data=JSON.stringify({...h,save:{...h.save,version:10}})]){const b2=structuredClone(b);mutate(b2.payload);b2.sha256=await originalBackupChecksum(b2.payload);await assert.rejects(validateOriginalBackup(b2),/INVALID_ORIGINAL_BACKUP/)}
 const untouched=t.service.create(owner,randomUUID(),'zh');await assert.rejects(restoreOriginalJourneyToEmptyDatabase(t.db,b),/RESTORE_TARGET_NOT_EMPTY/);assert.deepEqual(t.service.get(owner,untouched.id),untouched)
 }finally{s.raw.close();t.raw.close()}
})
test('original restore rolls back all rows on failed receipt insertion',async()=>{const s=setup(),t=setup();try{let h=s.service.create(owner,randomUUID(),'en');h=(await s.service.action(owner,h.id,action(h,'repair-starter'))).head;const b=await s.service.backup(owner,h.id);t.fail();await assert.rejects(restoreOriginalJourneyToEmptyDatabase(t.db,b),/DISK_FAILURE/);assert.equal(t.service.directory(owner).length,0);assert.equal(t.db.all<any>('SELECT count(*) n FROM journal')[0].n,0)}finally{s.raw.close();t.raw.close()}})

test('retained illustration bytes, rejected history and request identity survive offline recovery',async()=>{
 const {readFileSync}=await import('node:fs'),s=setup(),t=setup()
 try{const h=s.service.create(owner,randomUUID(),'en'),bytes=new Uint8Array(readFileSync('doc/platform-art-candidates/20260912/original-journal-01/candidate.png'))
 s.images.start(owner,h.id,{scene:h.sceneId,expected_version:0,retry:false});await s.images.run(owner,h.id,h.sceneId,async()=>bytes)
 const first=s.images.list(owner,h.id)[0];s.images.decide(owner,h.id,{scene:h.sceneId,attempt:1,sha256:first.asset!.sha256,decision:'discard'})
 s.images.start(owner,h.id,{scene:h.sceneId,expected_version:0,retry:true})
 const b=await s.service.backup(owner,h.id);await restoreOriginalJourneyToEmptyDatabase(t.db,b)
 assert.deepEqual(t.images.history(owner,h.id,h.sceneId),s.images.history(owner,h.id,h.sceneId));assert.deepEqual(await t.images.file(owner,h.id,h.sceneId,1),bytes)
 assert.deepEqual((await t.service.backup(owner,h.id)).payload.tables,b.payload.tables)
 }finally{s.raw.close();t.raw.close()}
})
test('original CLI creates a private new database and refuses an existing destination',async()=>{
 const {mkdtempSync,writeFileSync,statSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{spawnSync}=await import('node:child_process')
 const s=setup(),dir=mkdtempSync(join(tmpdir(),'original-backup-cli-'))
 try{const h=s.service.create(owner,randomUUID(),'zh'),b=await s.service.backup(owner,h.id),input=join(dir,'backup.json'),output=join(dir,'restored.sqlite');writeFileSync(input,JSON.stringify(b),{mode:0o600})
 const args=['--import','tsx','scripts/restore-original-backup.ts',input,output],r=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(statSync(output).mode&0o777,0o600);assert.notEqual(spawnSync(process.execPath,args).status,0)
 const restored=new DatabaseSync(output,{readOnly:true});assert.deepEqual(JSON.parse(String(restored.prepare('SELECT data FROM journeys').get()!.data)),h);restored.close()
 }finally{s.raw.close();rmSync(dir,{recursive:true,force:true})}
})
