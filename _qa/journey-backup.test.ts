import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {restoreJourneyToEmptyDatabase,checksum,validateBackup} from '../server/journey-backup'
import {currentScene,localReply} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
const owner='a'.repeat(64)
function setup(){const raw=new DatabaseSync(':memory:');let fail=false
 const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{if(fail&&q.startsWith('INSERT INTO receipts'))throw Error('DISK_FAILURE');raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 const service=new ProductionAuthority(db,async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'local'}}));return {raw,db,service,fail:()=>{fail=true}}
}
async function source(steps=2){const s=setup(),enrollment=randomUUID();let h=s.service.create(owner,enrollment,'zh');const bodies:any[]=[],responses:any[]=[]
 for(let i=0;i<steps;i++){const body={action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints.cabinet,target:'cabinet',...(i<2?{type:'action',action:i===0?'open-cabinet':'take-fuse'}:{type:'free-input',text:'看看柜子',mode:'local'})};const r=await s.service.action(owner,h.id,body);h=r.head;bodies.push(body);responses.push(r)}
 return {...s,h,bodies,responses,enrollment,backup:await s.service.backup(owner,h.id)}
}
test('restore full archive beyond event page limit and replay lost receipt without another item',async()=>{
 const s=await source(105),t=setup();assert.equal(s.service.events(owner,s.h.id,0).length,100)
 const result=await restoreJourneyToEmptyDatabase(t.db,s.backup);assert.equal(result.events,105);assert.deepEqual(t.service.get(owner,s.h.id),s.h)
 assert.deepEqual(await t.service.action(owner,s.h.id,s.bodies[1]),s.responses[1]);assert.equal(t.service.get(owner,s.h.id).save.inventory[0].count,1)
 assert.equal(t.service.create(owner,s.enrollment,'zh').id,s.h.id);assert.equal(t.service.events(owner,s.h.id,100).length,5)
 const body={...s.bodies[0],action_id:randomUUID(),expected_version:105};const next=await t.service.action(owner,s.h.id,body);assert.equal(next.cursor,106)
 s.raw.close();t.raw.close()
})
test('backup is owner-scoped and restore never overwrites an occupied database',async()=>{const s=await source(),t=setup();await assert.rejects(s.service.backup('b'.repeat(64),s.h.id),/SESSION_NOT_FOUND/);const old=t.service.create(owner,randomUUID(),'en');await assert.rejects(restoreJourneyToEmptyDatabase(t.db,s.backup),/RESTORE_TARGET_NOT_EMPTY/);assert.deepEqual(t.service.get(owner,old.id),old);s.raw.close();t.raw.close()})
test('corrupt checksum, mismatched lineage, missing receipts and other game rejected before restore',async()=>{const s=await source(),t=setup()
 const corrupted=structuredClone(s.backup);corrupted.payload.journey.data+=' ';await assert.rejects(restoreJourneyToEmptyDatabase(t.db,corrupted),/INVALID_BACKUP/)
 for(const change of [(p:any)=>p.receipts.pop(),(p:any)=>p.journal[0].cursor=3,(p:any)=>p.receipts[0].owner='b'.repeat(64),(p:any)=>p.gameId=randomUUID(),(p:any)=>p.mapVersion='future-map']){const b=structuredClone(s.backup);change(b.payload);b.sha256=await checksum(b.payload);await assert.rejects(validateBackup(b),/INVALID_BACKUP/)}
 assert.equal(t.service.directory(owner).length,0);s.raw.close();t.raw.close()
})
test('restore rolls back head and journal when receipt insert fails',async()=>{const s=await source(),t=setup();t.fail();await assert.rejects(restoreJourneyToEmptyDatabase(t.db,s.backup),/DISK_FAILURE/);for(const table of ['journeys','journal','receipts'])assert.equal(t.raw.prepare('SELECT COUNT(*) AS n FROM '+table).get()?.n,0);s.raw.close();t.raw.close()})

test('offline CLI writes a private new SQLite file and refuses existing destination',async()=>{
 const {mkdtempSync,writeFileSync,statSync,rmSync}=await import('node:fs'),{tmpdir}=await import('node:os'),{join}=await import('node:path'),{spawnSync}=await import('node:child_process')
 const s=await source(),dir=mkdtempSync(join(tmpdir(),'carriage-restore-')),input=join(dir,'backup.json'),output=join(dir,'restored.sqlite')
 try{writeFileSync(input,JSON.stringify(s.backup),{mode:0o600});const args=['--import','tsx','scripts/restore-journey-backup.ts',input,output],run=spawnSync(process.execPath,args,{encoding:'utf8'});assert.equal(run.status,0,run.stderr);assert.equal(statSync(output).mode&0o777,0o600)
 const restored=new DatabaseSync(output,{readOnly:true});assert.equal(restored.prepare('SELECT data FROM journeys').get()?.data,JSON.stringify(s.h));restored.close();const old=statSync(output).size;assert.notEqual(spawnSync(process.execPath,args).status,0);assert.equal(statSync(output).size,old)
 }finally{s.raw.close();rmSync(dir,{recursive:true,force:true})}
})
