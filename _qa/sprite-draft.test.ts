import test from 'node:test'
import assert from 'node:assert/strict'
import {IDBFactory} from 'fake-indexeddb'
import {BrowserSpriteDrafts,spriteDatabaseName,inspectSpritePng,newSpriteSource,runSpriteDraft,type SpritePng} from '../src/sprite-draft'
import {prepareSpritePixels,type SpritePreparationSpec} from '../src/sprite-preparation'
// Header-only synthetic bytes test storage/digests. Browser QA separately tests real PNG codec.
async function png(w=24,h=24):Promise<SpritePng>{const b=new Uint8Array(45);b.set([137,80,78,71,13,10,26,10]);const v=new DataView(b.buffer);v.setUint32(8,13);b.set([73,72,68,82],12);v.setUint32(16,w);v.setUint32(20,h);return inspectSpritePng(b)}
const settings:SpritePreparationSpec={columns:1,rows:1,cellWidth:24,cellHeight:24,foot:{x:12,y:20},kind:'actor',backgroundMode:'pale-neutral',neutralMin:200,chromaMax:20}
const io={decode:async()=>{const rgba=new Uint8ClampedArray(24*24*4).fill(255);for(let y=5;y<18;y++)for(let x=7;x<17;x++)rgba.set([20,50,70,255],(y*24+x)*4);return {width:24,height:24,rgba}},encode:async()=>png(),process:async(...args:Parameters<typeof prepareSpritePixels>)=>prepareSpritePixels(...args)}
async function setup(){const factory=new IDBFactory(),name=spriteDatabaseName('https://game.aiwaves.tech/11111111-2222-4333-8444-555555555555/'),repo=new BrowserSpriteDrafts(name,factory),source=newSpriteSource(await png(),'synthetic');await repo.save(source,undefined);return {repo,source,factory,name}}

test('sprite source, recipe and result survive reopening, while each attempt retains history',async()=>{
 const {repo,source,factory,name}=await setup();const candidate=await runSpriteDraft(repo,source,settings,io)
 assert.equal(candidate.state,'candidate');assert.equal(candidate.parentId,source.id);assert.deepEqual(await repo.get(source.id),source)
 assert.deepEqual(candidate.spec,settings);assert.equal(candidate.result?.algorithm,'neutral-matte-unmix-1')
 await repo.close();const reopened=new BrowserSpriteDrafts(name,factory);assert.deepEqual(await reopened.get(),candidate)
 const second=await runSpriteDraft(reopened,candidate,settings,io)
 assert.equal(second.parentId,candidate.id);assert.equal((await reopened.list()).length,3);assert.deepEqual(await reopened.get(candidate.id),candidate)
 assert.notEqual(name,spriteDatabaseName('https://game.aiwaves.tech/aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee/'));await reopened.close()
})

test('atomic current revision fence rejects another tab overwrite',async()=>{
 const {repo,source,factory,name}=await setup(),other=new BrowserSpriteDrafts(name,factory)
 const next={...source,revision:1};await other.save(next,source)
 await assert.rejects(repo.save({...source,revision:2},source),/DRAFT_REPLACED/)
 assert.deepEqual(await repo.get(),next);await repo.close();await other.close()
})

test('processing failures and cancellation retain original and earlier candidate',async()=>{
 const {repo,source}=await setup(),first=await runSpriteDraft(repo,source,settings,io)
 const failed=await runSpriteDraft(repo,first,settings,{...io,encode:async()=>{throw Error('private device details')}})
 assert.equal(failed.state,'failed');assert.equal(failed.error,'SPRITE_PREPARATION_FAILED');assert.deepEqual(await repo.get(first.id),first)
 const controller=new AbortController()
 const aborted=await runSpriteDraft(repo,failed,settings,{...io,process:async(input,spec)=>{controller.abort();return prepareSpritePixels(input,spec)}},controller.signal)
 assert.equal(aborted.error,'SPRITE_PREPARATION_ABORTED');assert.deepEqual(aborted.source,source.source);assert.equal(aborted.result,undefined)
 const resumed=await runSpriteDraft(repo,aborted,settings,io);assert.equal(resumed.state,'candidate');await repo.close()
})

test('late processing result cannot replace another imported source',async()=>{
 const {repo,source}=await setup();let release!:()=>void,entered!:()=>void
 const started=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r)
 const work=runSpriteDraft(repo,source,settings,{...io,process:async(input,spec)=>{entered();await gate;return prepareSpritePixels(input,spec)}})
 await started;const pending=await repo.get(),replacement=newSpriteSource(await png(),'replacement');await repo.save(replacement,pending);release()
 await assert.rejects(work,/DRAFT_REPLACED/);assert.deepEqual(await repo.get(),replacement);await repo.close()
})

test('corrupt source and invalid encoded dimensions cannot become candidates',async()=>{
 const {repo,source}=await setup();source.source.sha256='0'.repeat(64);await repo.save(source,source)
 let processed=0;const failed=await runSpriteDraft(repo,source,settings,{...io,process:async(input,spec)=>{processed++;return prepareSpritePixels(input,spec)}})
 assert.equal(failed.error,'SPRITE_CORRUPT');assert.equal(processed,0)
 const fresh=newSpriteSource(await png(),'fresh');await repo.save(fresh,failed)
 const wrongSize=await runSpriteDraft(repo,fresh,settings,{...io,encode:async()=>png(23,24)})
 assert.equal(wrongSize.error,'SPRITE_ENCODE');assert.equal(wrongSize.result,undefined);await repo.close()
})

test('interrupted processing record can be reopened and retried without losing parent history',async()=>{
 const {repo,source,factory,name}=await setup();const pending={...source,id:crypto.randomUUID(),parentId:source.id,spec:settings,state:'processing' as const};await repo.save(pending,source);await repo.close()
 const reopened=new BrowserSpriteDrafts(name,factory),restored=await reopened.get();assert.equal(restored?.state,'processing')
 const recovered=await runSpriteDraft(reopened,restored!,settings,io);assert.equal(recovered.state,'candidate');assert.deepEqual(await reopened.get(source.id),source);await reopened.close()
})
