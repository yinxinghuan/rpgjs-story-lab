import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {IDBFactory} from 'fake-indexeddb'
import {BrowserArtDrafts,planArtDraft,runArtDraft,inspectArtCandidate,createArtProducer,artDraftDatabaseName,type ArtDraft} from '../src/art-draft'
import {MediaServiceError} from '../src/vendor/media/client'
const bytes=new Uint8Array(readFileSync(new URL('../doc/platform-art-candidates/20260911/environment-edit-01/candidate.png',import.meta.url)))
const candidate=await inspectArtCandidate(bytes)
function memory(){let value:ArtDraft|undefined;return {get:async()=>structuredClone(value),put:async(d:ArtDraft)=>{value=structuredClone(d)}}}
test('browser creator stores candidate bytes across database reopening without touching journeys',async()=>{
 const factory=new IDBFactory(),name=artDraftDatabaseName('https://game.aiwaves.tech/11111111-2222-4333-8444-555555555555/')
 assert.notEqual(name,artDraftDatabaseName('https://game.aiwaves.tech/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/'))
 const first=new BrowserArtDrafts(name,factory);await first.put(planArtDraft('cool'));await runArtDraft(first,async()=>candidate);const saved=await first.get();await first.close()
 const second=new BrowserArtDrafts(name,factory);assert.deepEqual(await second.get(),saved);let calls=0;await runArtDraft(second,async()=>{calls++;return candidate});assert.equal(calls,0);assert.equal(saved?.state,'candidate');assert.equal('active' in saved!,false);await second.close()
})
test('interrupted media request persists task then resumes same identity after rate limit',async()=>{
 const repo=memory();await repo.put(planArtDraft('cool'));const id=(await repo.get())!.id;let clock=100
 await runArtDraft(repo,async(_d,save)=>{await save('mt-known');throw new MediaServiceError('RATE_LIMITED','wait',429,true,30)},()=>{},()=>clock)
 assert.equal((await repo.get())?.nextAt,30100);let calls=0
 await runArtDraft(repo,async()=>{calls++;return candidate},()=>{},()=>clock);assert.equal(calls,0)
 clock=30101;await runArtDraft(repo,async d=>{assert.equal(d.id,id);assert.equal(d.taskId,'mt-known');return candidate},()=>{},()=>clock)
 assert.equal((await repo.get())?.state,'candidate')
})
test('terminal rejection is not retried automatically and uncertain failure preserves request',async()=>{
 const repo=memory();await repo.put(planArtDraft('warm'));const id=(await repo.get())!.id
 await runArtDraft(repo,async()=>{throw Error('private transport details')},()=>{},()=>10)
 assert.equal((await repo.get())?.error,'ART_UNAVAILABLE');assert.equal((await repo.get())?.retryable,true)
 await runArtDraft(repo,async d=>{assert.equal(d.id,id);throw new MediaServiceError('PROVIDER_REJECTED','rejected',400,false)},()=>{},()=>9000)
 let calls=0;await runArtDraft(repo,async()=>{calls++;return candidate},()=>{},()=>19000);assert.equal(calls,0)
})
test('late result cannot replace a newer draft',async()=>{
 const repo=memory();await repo.put(planArtDraft('cool'));let release!:()=>void,started!:()=>void;const gate=new Promise<void>(r=>started=r)
 const work=runArtDraft(repo,async()=>{started();await new Promise<void>(r=>release=r);return candidate});await gate
 const newer=planArtDraft('warm');await repo.put(newer);release();await work;assert.deepEqual(await repo.get(),newer)
})
test('candidate validator rejects mismatched output and hashes actual platform bytes',async()=>{
 assert.equal(candidate.sha256,'2f3f479192e9723ea46b17c35bc0114a925752f7c1235cf87811d9ac8ef8d34c')
 await assert.rejects(inspectArtCandidate(bytes.subarray(0,20)),/ART_INVALID/)
 const actor=new Uint8Array(readFileSync(new URL('../doc/platform-art-candidates/20260911/actor-edit-02/candidate.png',import.meta.url)));await assert.rejects(inspectArtCandidate(actor),/ART_INVALID/)
})
test('saved task GET downloads and decodes the original result without new POST',async()=>{
 const repo=memory(),draft=planArtDraft('cool');draft.taskId='mt-recover';await repo.put(draft);const calls:string[]=[]
 const task={task_id:draft.taskId,request_id:draft.id,type:'image',status:'succeeded',media:{type:'image',format:'png',width:1024,height:1536,url:'https://cdn.aiwaves.tech/synthetic.png'}}
 let decodes=0;const produce=createArtProducer(async(input,init)=>{calls.push((init?.method??'GET')+' '+String(input));return String(input).includes('/tasks/')?Response.json(task):new Response(bytes)},async c=>{assert.equal(c.sha256,candidate.sha256);decodes++;return 'blob:synthetic'})
 await runArtDraft(repo,produce);assert.equal((await repo.get())?.state,'candidate');assert.equal(decodes,1);assert.equal(calls.length,2);assert.ok(calls.every(c=>c.startsWith('GET ')))
})
test('mismatched service identity cannot download or save an image',async()=>{
 const repo=memory(),draft=planArtDraft('cool');draft.taskId='mt-recover';await repo.put(draft);let calls=0
 await runArtDraft(repo,createArtProducer(async()=>{calls++;return Response.json({request_id:'wrong',task_id:'mt-other',status:'succeeded'})}))
 assert.equal(calls,1);assert.equal((await repo.get())?.candidate,undefined);assert.equal((await repo.get())?.retryable,false)
})
test('older candidate versions remain readable after a new draft becomes current',async()=>{
 const factory=new IDBFactory(),store=new BrowserArtDrafts('history-'+crypto.randomUUID(),factory)
 const old=planArtDraft('cool');await store.put(old);await runArtDraft(store,async()=>candidate)
 const completed=await store.get(),next=planArtDraft('warm');await store.put(next)
 assert.deepEqual(await store.get(old.id),completed);assert.deepEqual(await store.get(),next);await store.close()
})
