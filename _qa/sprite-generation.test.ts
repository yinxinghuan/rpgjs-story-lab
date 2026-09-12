import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {IDBFactory} from 'fake-indexeddb'
import {GAME_ID} from '../src/game-id'
import {BrowserSpriteGenerations,planSpriteGeneration,runSpriteGeneration,createSpriteProducer,adoptSpriteGeneration,pendingSpriteGeneration,spriteGenerationDatabase} from '../src/sprite-generation'
import {spriteGenerationRequest,assertSpriteGenerationSource,SPRITE_RECIPES} from '../src/sprite-generation-recipe'
import {BrowserSpriteDrafts,newSpriteSource,inspectSpritePng} from '../src/sprite-draft'
import {MediaServiceError} from '../src/vendor/media/client'
const png=await inspectSpritePng(new Uint8Array(readFileSync('doc/platform-art-candidates/20260911/actor-edit-03/candidate.png')))
const store=(name='generation',factory=new IDBFactory())=>new BrowserSpriteGenerations(name,factory)
const task=(id:string,overrides:any={})=>({task_id:'synthetic-task-1',request_id:id,type:'image',status:'succeeded',created_at:0,updated_at:0,media:{type:'image',url:'https://cdn.aiwaves.tech/synthetic.png',width:960,height:1280,format:'png'},...overrides})
const imageResponse=()=>new Response(new Uint8Array(png.bytes),{headers:{'Content-Type':'image/png'}})
const decode=async()=> 'blob:synthetic-decoded'
// Existing pre-gate records must remain recoverable. This fixture constructs
// that historical state, rather than bypassing production new-intent policy.
const legacyActor=()=>({version:1 as const,id:crypto.randomUUID(),recipe:'ada-walk-v1' as const,sessionId:GAME_ID,createdAt:1,state:'prepared' as const,retryable:true,nextAt:0,taskId:undefined as string|undefined})

test('historical recipe preserves its reference; equipment never inherits actor identity; namespace survives Remix',()=>{
 for(const r of SPRITE_RECIPES){const d=r==='ada-walk-v1'?legacyActor():planSpriteGeneration(r,GAME_ID),request=spriteGenerationRequest(r,d.id,GAME_ID);assert.equal(request.mode,'edit');assert.equal(request.referenceUrls!.length,1);assert.ok(request.prompt.length<2400);assert.equal(request.size.width%64,0);assert.equal(request.size.height%64,0);assert.deepEqual(request,spriteGenerationRequest(r,d.id,GAME_ID));if(r==='ada-walk-v1'){assert.match(request.referenceUrls![0],/hero-gait-v2/);assert.match(request.prompt,/opposite walking strides/)}else assert.doesNotMatch(request.prompt,/Ada|female|apprentice/)}
 assert.match(spriteGenerationDatabase('https://game.aiwaves.tech/aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa/creator.html'),/alteru:aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa:/)
 assert.throws(()=>assertSpriteGenerationSource({version:1,recipe:'ada-walk-v1',requestId:crypto.randomUUID(),sessionId:GAME_ID,taskId:'../../private'}))
})
test('ambiguous lost submission keeps request ID and cooldown; successful response is retained without changing active source',async()=>{
 const r=store(),s=new BrowserSpriteDrafts('sprites',new IDBFactory()),previous=newSpriteSource(png,'previous');await s.save(previous,undefined)
 const d=legacyActor();await r.put(d);const ids:string[]=[];let first=true
 const produce=createSpriteProducer(async(input,init)=>{if(String(input).includes('/generations')){ids.push(JSON.parse(String(init!.body)).request_id);if(first){first=false;throw TypeError('lost response')}return Response.json(task(d.id))}return imageResponse()},decode)
 await runSpriteGeneration(r,produce,()=>{},()=>0);assert.equal((await r.get())!.state,'failed');assert.equal(pendingSpriteGeneration(await r.get()),true)
 await runSpriteGeneration(r,produce,()=>{},()=>7999);assert.equal(ids.length,1)
 await runSpriteGeneration(r,produce,()=>{},()=>8000);assert.deepEqual(ids,[d.id,d.id]);assert.equal((await r.get())!.state,'ready');assert.deepEqual(await s.get(),previous)
 await adoptSpriteGeneration((await r.get())!,s);assert.equal((await s.get())!.id,d.id);assert.equal((await s.get())!.state,'source');assert.equal((await s.get())!.result,undefined);assert.equal((await s.get())!.deviceReview,undefined);assert.deepEqual(await s.get(previous.id),previous)
 const n=(await s.list()).length;await adoptSpriteGeneration((await r.get())!,s);assert.equal((await s.list()).length,n)
 await r.close();await s.close()
})
test('task ID persists before download; reopen resumes GET only and verifies PNG hash plus native decode',async()=>{
 const f=new IDBFactory();let r=store('resume',f);const d=legacyActor();await r.put(d)
 const calls:string[]=[];let fail=true,decoded=0
 const produce=createSpriteProducer(async(input)=>{const url=String(input);calls.push(url);if(url.includes('/v1/'))return Response.json(task(d.id));if(fail)return new Response('',{status:503});return imageResponse()},async p=>{assert.equal(p.sha256,png.sha256);decoded++;return decode()})
 await runSpriteGeneration(r,produce,()=>{},()=>0);assert.equal((await r.get())!.taskId,'synthetic-task-1');assert.equal((await r.get())!.error,'SPRITE_DOWNLOAD');await r.close();r=store('resume',f);fail=false
 await runSpriteGeneration(r,produce,()=>{},()=>8000);assert.equal(calls.filter(c=>c.endsWith('/generations')).length,1);assert.equal(calls.filter(c=>c.endsWith('/tasks/synthetic-task-1')).length,1);assert.equal(decoded,1);assert.equal((await r.get())!.png!.sha256,png.sha256);await r.close()
})
test('rate limiting honors delay, terminal origin rejection cannot be resumed, history keeps earlier results',async()=>{
 const r=store();const d=legacyActor();await r.put(d);let calls=0
 await runSpriteGeneration(r,async()=>{calls++;throw new MediaServiceError('RATE_LIMITED','rate',429,true,60)},()=>{},()=>0)
 await runSpriteGeneration(r,async()=>{calls++;return png},()=>{},()=>59999);assert.equal(calls,1)
 await runSpriteGeneration(r,async()=>{calls++;throw new MediaServiceError('ORIGIN_NOT_ALLOWED','origin',403,false)},()=>{},()=>60000)
 await runSpriteGeneration(r,async()=>{calls++;return png},()=>{},()=>999999);assert.equal(calls,2);assert.equal((await r.get())!.retryable,false)
 const next=planSpriteGeneration('starter-broken-v1',GAME_ID);await r.put(next);assert.equal((await r.list()).length,2);assert.equal((await r.get(d.id))!.error,'ORIGIN_NOT_ALLOWED');await r.close()
})
test('wrong request/task/media, untrusted URL, wrong PNG dimensions and failed native decoding never become ready',async()=>{
 for(const kind of ['request','task','format','url','size','bytes','decode']){
  const r=store(kind),d=legacyActor();if(kind==='task')d.taskId='expected-task';await r.put(d)
  const produce=createSpriteProducer(async input=>{if(String(input).includes('/v1/')){const t=task(d.id);if(kind==='request')t.request_id=crypto.randomUUID();if(kind==='format')t.media.format='webp';if(kind==='url')t.media.url='https://example.com/secret';if(kind==='size')t.media.width=1024;return Response.json(t)}if(kind==='bytes')return new Response('not PNG');return imageResponse()},async()=>{if(kind==='decode')throw Error('SPRITE_DECODE');return decode()})
  await runSpriteGeneration(r,produce);assert.equal((await r.get())!.state,'failed',kind);assert.equal((await r.get())!.png,undefined);assert.equal((await r.get())!.retryable,false,kind);await r.close()
 }
})
test('late generation completion cannot replace a newer request or source',async()=>{
 const r=store();await r.put(legacyActor());let newer:any
 await assert.rejects(runSpriteGeneration(r,async()=>{newer=planSpriteGeneration('starter-repaired-v1',GAME_ID);await r.put(newer);return png}),/SPRITE_DRAFT_REPLACED/);assert.deepEqual(await r.get(),newer);await r.close()
})

test('unapproved walking recipes cannot create new intentions while source provenance stays readable',()=>{
 assert.throws(()=>planSpriteGeneration('ada-walk-v1',GAME_ID),/SPRITE_RECIPE_NOT_RELEASED/)
 const old=legacyActor(),request=spriteGenerationRequest(old.recipe,old.id,old.sessionId)
 assert.equal(request.requestId,old.id);assert.match(request.referenceUrls![0],/hero-gait-v2/)
 for(const recipe of ['starter-broken-v1','starter-repaired-v1'] as const)assert.equal(planSpriteGeneration(recipe,GAME_ID).recipe,recipe)
})
