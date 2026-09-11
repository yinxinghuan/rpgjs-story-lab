import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,mkdtempSync,rmSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomUUID} from 'node:crypto'
import {createServer} from 'node:http'
import {PreflightStorage} from '../server/preflight-storage'
import {CreatorArtArchive,platformArtArchiveSource} from '../server/creator-art'
import {inspectArtCandidate,planArtDraft,type ArtDraft} from '../src/art-draft'
import {CreatorCloudDrafts,creatorCloudTransport} from '../src/creator-cloud'
import {CarriageJourneyAuthority,createHandler} from '../worker/source'
import {CREATOR_RUNTIME_HEADER,CREATOR_RUNTIME_CONTRACT} from '../src/creator-contract'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
const bytes=new Uint8Array(readFileSync(new URL('../doc/platform-art-candidates/20260911/environment-edit-02/candidate.png',import.meta.url)))
const candidate=await inspectArtCandidate(bytes),taskId='mt_1a1c4492493eaf68a32331d43d91c207'
const input=()=>{const d=planArtDraft('cool');return {id:d.id,taskId,sha256:candidate.sha256,lighting:'cool' as const,request:d.request}}
function fixture(source=async()=>bytes){
 const dir=mkdtempSync(join(tmpdir(),'creator-cloud-')),pool=new PreflightStorage(dir);let fail=false,calls=0
 const db=()=>{const ctx=pool.context('synthetic-creator');return {all:<T>(s:string,...b:any[])=>ctx.storage.sql.exec(s,...b).toArray() as T[],run:(s:string,...b:any[])=>{if(fail&&s.startsWith('INSERT INTO creator_art_bytes')&&b[2]===1)throw Error('SYNTHETIC_STORAGE_FAILURE');ctx.storage.sql.exec(s,...b)},transaction:<T>(w:()=>T)=>ctx.storage.transactionSync(w)}}
 const make=()=>new CreatorArtArchive(db(),async()=>{calls++;return source()});let archive=make()
 return {get archive(){return archive},calls:()=>calls,db,fail:(v:boolean)=>{fail=v},restart:()=>{pool.close();archive=make()},close:()=>{pool.close();rmSync(dir,{recursive:true,force:true})}}
}
test('cloud art preserves original bytes, private immutable records and same-task retries across restart',async()=>{
 const f=fixture();try{const i=input(),[a,b]=await Promise.all([f.archive.save('alice',i),f.archive.save('alice',i)])
  assert.deepEqual(a,b);assert.equal(f.calls(),1);assert.deepEqual(await f.archive.file('alice',i.id),bytes)
  assert.deepEqual(f.archive.list('bob'),[]);await assert.rejects(f.archive.file('bob',i.id),/ART_DRAFT_NOT_FOUND/)
  f.restart();assert.deepEqual(await f.archive.save('alice',i),a);assert.equal(f.calls(),1);assert.deepEqual(await f.archive.file('alice',i.id),bytes)
  await assert.rejects(f.archive.save('alice',{...i,lighting:'warm'}),/ART_DRAFT_CONFLICT/);assert.equal(f.calls(),1)
  assert.deepEqual(f.db().all('SELECT * FROM creator_art_bytes WHERE owner=? AND id=? AND part=0','alice',i.id).length,1)
 }finally{f.close()}
})
test('hash mismatch and interrupted SQLite writes leave no partial online candidate',async()=>{
 const f=fixture();try{await assert.rejects(f.archive.save('alice',{...input(),sha256:'0'.repeat(64)}),/ART_SOURCE_MISMATCH/);assert.deepEqual(f.archive.list('alice'),[])
  const i=input();f.fail(true);await assert.rejects(f.archive.save('alice',i),/SYNTHETIC_STORAGE_FAILURE/);assert.deepEqual(f.archive.list('alice'),[]);assert.deepEqual(f.db().all('SELECT * FROM creator_art_bytes'),[])
  f.fail(false);await f.archive.save('alice',i);f.db().run('DELETE FROM creator_art_bytes WHERE part=1');await assert.rejects(f.archive.file('alice',i.id),/ART_STORAGE_INVALID/)
 }finally{f.close()}
})
test('six candidate quota fences concurrent downloads and committed storage',async()=>{
 let release!:()=>void;const wait=new Promise<void>(r=>{release=r}),f=fixture(async()=>{await wait;return bytes})
 try{const pending=Array.from({length:6},()=>f.archive.save('alice',input()));await assert.rejects(f.archive.save('alice',input()),/ART_DRAFT_LIMIT/);assert.equal(f.calls(),6);release();await Promise.all(pending);f.restart();await assert.rejects(f.archive.save('alice',input()),/ART_DRAFT_LIMIT/);assert.equal(f.archive.list('alice').length,6)}finally{release();f.close()}
})
test('archive source only reads existing media task, verifies request and rejects arbitrary URLs',async()=>{
 const i=input(),seen:string[]=[];let wrong=false,host='https://cdn.aiwaves.tech/test.png'
 const request:typeof fetch=async(url,init)=>{assert.equal(init?.method??'GET','GET');seen.push(String(url));return String(url).includes('/v1/tasks/')?Response.json({task_id:taskId,request_id:wrong?randomUUID():i.id,type:'image',status:'succeeded',created_at:1,updated_at:1,media:{type:'image',format:'png',width:1024,height:1536,url:host}}):new Response(bytes)}
 const source=platformArtArchiveSource(request);assert.deepEqual(await source(i),bytes);assert.equal(seen.length,2)
 wrong=true;await assert.rejects(source(i),/ART_SOURCE_MISMATCH/);assert.equal(seen.length,3)
 wrong=false;host='http://127.0.0.1/private';await assert.rejects(source(i),/ART_SOURCE_MISMATCH/);assert.equal(seen.length,4)
})
class Memory implements Storage{values=new Map<string,string>();get length(){return this.values.size}key(i:number){return [...this.values.keys()][i]??null}getItem(k:string){return this.values.get(k)??null}setItem(k:string,v:string){this.values.set(k,v)}removeItem(k:string){this.values.delete(k)}clear(){this.values.clear()}}
test('real HTTP archive recovers lost save response, restores to fresh local state and isolates creator identity',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'creator-cloud-http-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>();let calls=0,lose=true
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key),undefined,undefined,undefined,undefined,undefined,undefined,async()=>{calls++;return bytes});objects.set(key,o)}return o.fetch(r)}})}}
 const handler=createHandler(true,false,false,undefined,undefined,true)
 const server=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const r=await handler(new Request('http://localhost'+req.url,{method:req.method,headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env)
  if(lose&&req.method==='POST'&&r.ok){lose=false;res.destroy();return}res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))
 }catch{res.writeHead(500);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 try{const base='http://127.0.0.1:'+(server.address() as any).port,storage=new Memory(),lock=async<T>(_n:string,w:()=>Promise<T>)=>w(),make=(s=storage)=>new CreatorCloudDrafts(creatorCloudTransport(s,lock,fetch,base)),c=make()
  const planned=planArtDraft('cool'),draft:ArtDraft={...planned,taskId,candidate,state:'candidate',retryable:false}
  await assert.rejects(c.save(draft));assert.equal(calls,1);objects.clear();pool.close()
  const record=await make().save(draft);assert.equal(calls,1);assert.deepEqual(await make().list(),[record]);assert.deepEqual(await make(new Memory()).list(),[])
  const restored=await make().restore(record);assert.equal(restored.id,draft.id);assert.equal(restored.taskId,draft.taskId);assert.deepEqual(restored.request,draft.request);assert.deepEqual(restored.candidate, candidate);assert.equal(calls,1)
  assert.equal([...objects.keys()].every(k=>k.startsWith('creator-art-v1:')),true)
  assert.equal((await fetch(base+'/api/creator/drafts')).status,401)
  const unauth=await handler(new Request('http://localhost/api/creator/drafts',{headers:{'X-Authority-Owner':'a'.repeat(64),[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}}),env);assert.equal(unauth.status,401)
  const disabled=await createHandler(true)(new Request('http://localhost/api/creator/health'),env);assert.equal(disabled.status,404)
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}
})
