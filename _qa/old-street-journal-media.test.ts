import {handleOldStreetSession} from '../server/old-street-http'
import {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from '../src/old-street-runtime-contract'
import {introduceJournalPerson} from '../src/old-street-mediated-cast'
import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {OldStreetAuthority} from '../server/old-street-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {OldStreetJournalMedia,journalArtProducer,journalArtOperation} from '../server/old-street-journal-media'
import {journalMediaSubjects} from '../src/old-street-journal-media'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const png=new Uint8Array(PNG.sync.write({width:512,height:512,data:Buffer.alloc(512*512*4,110)}))
function storage(db:DatabaseSync):AuthorityStorage{return {all:(s,...b)=>db.prepare(s).all(...b) as any,run:(s,...b)=>{db.prepare(s).run(...b)},transaction:f=>{db.exec('BEGIN IMMEDIATE');try{const r=f();db.exec('COMMIT');return r}catch(e){db.exec('ROLLBACK');throw e}}}}
function fixture(db:AuthorityStorage){const h=new OldStreetAuthority(db,()=>true).create('synthetic',crypto.randomUUID(),'en');h.save.inventory.push({id:'brass-compass',label:'Brass compass',count:1,detail:'A small worn brass compass in a dark green leather case.'});introduceJournalPerson(h.save,{id:'eli-courier',name:'Eli',role:'Retired mail carrier',origin:'generated',status:'known',detail:'Older man with short gray hair, a blue knit cap, a brown work jacket and round glasses.',vitality:100,stress:0,skills:[],updatedAtScene:0},'record-book',{id:'eli-introduction',text:'A sketch shows a gray-haired man wearing glasses. The letter is signed Eli, a retired mail carrier offering river directions.'});return h}
test('committed content selects art; inventory loss and unknown cast never gain authority from images',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw),h=fixture(db),get=(o:string)=>{assert.equal(o,'synthetic');return h},m=new OldStreetJournalMedia(db,get)
 const before=JSON.stringify(h);assert.equal(journalMediaSubjects(h.save).length,2);m.sync('synthetic',h.id)
 let calls=0;await m.run('synthetic',h.id,async()=>{calls++;return png});m.sync('synthetic',h.id);await m.run('synthetic',h.id,async()=>{calls++;return png})
 assert.equal(calls,2);assert.equal(JSON.stringify(h),before);assert.deepEqual(await m.file('synthetic',h.id,'item:brass-compass'),png)
 h.save.inventory[0].count=0;assert.ok(!m.list('synthetic',h.id).some(j=>j.id==='item:brass-compass'));await assert.rejects(m.file('synthetic',h.id,'item:brass-compass'))
 assert.throws(()=>m.list('other',h.id));assert.throws(()=>journalArtOperation('POST','synthetic',h.id,{prompt:'invent a new person'},{media:m,produce:async()=>png,background:()=>{}}))
 raw.close()
})
test('reload resumes stored platform task, pins first appearance, and restores identical files',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'journal-art-')),file=join(dir,'db.sqlite');let raw=new DatabaseSync(file),db=storage(raw),now=1000
 const h=fixture(db);h.save.characters=[];let m=new OldStreetJournalMedia(db,()=>h,()=>now),submissions=0,downloads=0,requestId=''
 const producer=journalArtProducer(async(input,init)=>{if(String(input).includes('/v1/')){if(String(input).endsWith('generations')){submissions++;requestId=JSON.parse(String(init!.body)).request_id}return Response.json({request_id:requestId,task_id:'synthetic-journal',status:'succeeded',media:{type:'image',url:'https://cdn.aiwaves.tech/art.png',format:'png',width:512,height:512}})}downloads++;return downloads===1?new Response('',{status:503}):new Response(png)})
 try{
  m.sync('synthetic',h.id);await m.run('synthetic',h.id,producer);assert.equal(m.list('synthetic',h.id)[0].state,'failed')
  const prompt=JSON.parse(db.all<{data:string}>('SELECT data FROM oldstreet_journal_media')[0].data).prompt
  raw.close();raw=new DatabaseSync(file);db=storage(raw);now+=9000;m=new OldStreetJournalMedia(db,()=>h,()=>now)
  h.save.inventory[0].detail='New irrelevant text must not redraw a red compass.';m.sync('synthetic',h.id);await m.run('synthetic',h.id,producer)
  assert.equal(submissions,1);assert.equal(downloads,2);assert.equal(m.list('synthetic',h.id)[0].state,'ready');assert.deepEqual(await m.file('synthetic',h.id,'item:brass-compass'),png)
  assert.equal(JSON.parse(db.all<{data:string}>('SELECT data FROM oldstreet_journal_media')[0].data).prompt,prompt)
  raw.close();raw=new DatabaseSync(file);m=new OldStreetJournalMedia(storage(raw),()=>h,()=>now);assert.deepEqual(await m.file('synthetic',h.id,'item:brass-compass'),png)
 }finally{raw.close();rmSync(dir,{recursive:true,force:true})}
})
test('overlapping updates hold one generation lease; failed images do not remove objects',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw),h=fixture(db);h.save.characters=[];let now=1000
 const m=new OldStreetJournalMedia(db,()=>h,()=>now);m.sync('synthetic',h.id)
 let release!:(b:Uint8Array)=>void,calls=0;const work=m.run('synthetic',h.id,async()=>{calls++;return new Promise(resolve=>release=resolve)})
 await m.run('synthetic',h.id,async()=>{calls++;return png});assert.equal(calls,1);release(new Uint8Array([1,2,3]));await work
 assert.equal(m.list('synthetic',h.id)[0].state,'failed');assert.equal(m.list('synthetic',h.id)[0].recoverable,false);assert.equal(h.save.inventory[0].count,1)
 assert.throws(()=>m.sync('synthetic',h.id,'item:brass-compass'));now+=9000;m.sync('synthetic',h.id,'item:brass-compass');await m.run('synthetic',h.id,async()=>png);assert.equal(m.list('synthetic',h.id)[0].state,'ready');raw.close()
})

test('mediated introduction survives authoritative reload without leaking into another journey',()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw),h=fixture(db),a=new OldStreetAuthority(db,()=>true)
 raw.prepare('UPDATE journeys SET data=? WHERE id=?').run(JSON.stringify(h),h.id)
 assert.equal(a.get('synthetic',h.id).save.characters.at(-1)?.name,'Eli')
 assert.doesNotThrow(()=>a.create('synthetic',crypto.randomUUID(),'en'))
 delete h.save.facts['journal-person:eli-courier']
 raw.prepare('UPDATE journeys SET data=? WHERE id=?').run(JSON.stringify(h),h.id)
 assert.throws(()=>a.get('synthetic',h.id),/OLD_STREET_SAVE_UNSUPPORTED/)
 raw.close()
})

test('HTTP image contract restores authorized bytes and never accepts a client prompt',async()=>{
 const raw=new DatabaseSync(':memory:'),db=storage(raw),h=fixture(db),a=new OldStreetAuthority(db,()=>true)
 raw.prepare('UPDATE journeys SET data=? WHERE id=?').run(JSON.stringify(h),h.id)
 const media=new OldStreetJournalMedia(db,(o,id)=>a.get(o,id)),pending:Promise<unknown>[]=[],runtime={media,produce:async()=>png,background:(p:Promise<unknown>)=>{pending.push(p)}}
 const send=(owner:string,path:string,body?:unknown)=>handleOldStreetSession(new Request('https://qa.invalid'+OLD_STREET_API_PATH+'/sessions/'+h.id+path,{method:body===undefined?'GET':'POST',headers:{[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})}),owner,a,r=>r.json(),undefined,undefined,runtime)
 assert.equal((await send('synthetic','/journal-art',{})).status,200);await Promise.all(pending)
 const reply=await send('synthetic','/journal-art-file?asset=item%3Abrass-compass')
 assert.equal(reply.status,200);assert.equal(reply.headers.get('Content-Type'),'image/png');assert.equal(reply.headers.get(OLD_STREET_RUNTIME_HEADER),OLD_STREET_RUNTIME_CONTRACT)
 assert.deepEqual(new Uint8Array(await reply.arrayBuffer()),png)
 const list=await (await send('synthetic','/journal-art')).json();assert.equal(list.jobs.length,2);assert.ok(list.jobs.every((j:any)=>j.state==='ready'&&!j.prompt&&!j.taskId))
 assert.equal((await send('other','/journal-art-file?asset=item%3Abrass-compass')).status,404)
 assert.equal((await send('synthetic','/journal-art',{prompt:'create a new key'})).status,400)
 raw.close()
})
