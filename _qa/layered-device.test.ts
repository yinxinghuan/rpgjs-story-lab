import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {IDBFactory} from 'fake-indexeddb'
import {inspectSpritePng} from '../src/sprite-draft'
import {BrowserLayeredDrafts,newLayeredSource,prepareLayeredDraft,inspectLayeredDraft,saveLayerReview,layeredDatabaseName} from '../src/layered-draft'
import {fanPartsSpec,FAN_PARTS_SOURCE,prepareLayeredPixels,layeredSheets,layerPose,layerBlocks,LAYER_CHECKS} from '../src/layered-device'
import {originalFanSheets} from '../src/original-fan-art'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=()=>inspectSpritePng(new Uint8Array(readFileSync('doc/platform-art-candidates/20260912/tunnel-fan-parts-01/candidate.png')))
const io={decode:async(p:any)=>{const d=PNG.sync.read(Buffer.from(p.bytes));return{width:d.width,height:d.height,rgba:new Uint8ClampedArray(d.data)}},encode:async(p:any)=>inspectSpritePng(PNG.sync.write({width:p.width,height:p.height,data:Buffer.from(p.rgba)}))}
test('layered preparation reproduces admitted fan pixels and maps both states to one invariant base',async()=>{
 const png=await source(),raster=await io.decode(png),original=new Uint8ClampedArray(raster.rgba),prepared=prepareLayeredPixels(raster,fanPartsSpec,png.sha256)
 assert.deepEqual(raster.rgba,original)
 for(const [i,part] of ['housing','rotor'].entries()){const output=await io.encode(prepared[i].raster);assert.deepEqual(Buffer.from(output.bytes),readFileSync(`public/art/fan-${part}-v1.png`))}
 const sheets=layeredSheets('candidate','body','wheel',320,640,fanPartsSpec),formal=originalFanSheets('body','wheel')
 for(let i=0;i<2;i++){assert.deepEqual({...sheets[i],id:''},{...formal[i],id:'',textures:sheets[i].textures});for(const name of Object.keys(sheets[i].textures)){const a=(sheets[i].textures as any)[name].animations(),b=(formal[i].textures as any)[name].animations();assert.deepEqual(a,b)}}
 assert.equal(layerPose(300,1200),'spin-9');assert.equal(layerPose(1200,1200),'spin-0')
 assert.equal(layerBlocks(fanPartsSpec,{x:110,y:160},{x:105,y:150}),true);assert.equal(layerBlocks(fanPartsSpec,{x:110,y:160},{x:112,y:164}),false)
 for(const spec of [{...fanPartsSpec,rotorScale:NaN},{...fanPartsSpec,housingCenter:{x:999,y:0}},{...fanPartsSpec,periodMs:0}])assert.throws(()=>prepareLayeredPixels(raster,spec,png.sha256),/SPEC_INVALID/)
 assert.throws(()=>prepareLayeredPixels(raster,fanPartsSpec,'other-source'),/APERTURE_SOURCE_MISMATCH/)
})
test('layered drafts retain originals, fork checks, verify pixels and reject stale review or competing writes',async()=>{
 const factory=new IDBFactory(),name=layeredDatabaseName('http://localhost/game/'),repo=new BrowserLayeredDrafts(name,factory),other=new BrowserLayeredDrafts(name,factory)
 try{
 const input=newLayeredSource(await source(),'fan',fanPartsSpec);await repo.save(input,undefined)
 const candidate=await prepareLayeredDraft(repo,input,fanPartsSpec,io);assert.equal(candidate.state,'candidate');assert.equal(candidate.source.sha256,FAN_PARTS_SOURCE);assert.equal((await repo.get(input.id))!.state,'source')
 const inspected=await inspectLayeredDraft(candidate,candidate.id,io)
 await assert.rejects(saveLayerReview(repo,candidate,['stopped'],inspected.signature,io),/INCOMPLETE/)
 const accepted=await saveLayerReview(repo,candidate,[...LAYER_CHECKS],inspected.signature,io);assert.ok(accepted.review)
 await assert.rejects(saveLayerReview(other,candidate,[...LAYER_CHECKS],inspected.signature,io),/DRAFT_REPLACED/)
 const next=await prepareLayeredDraft(repo,accepted,{...fanPartsSpec,periodMs:1800},io);assert.equal(next.state,'candidate');assert.equal(next.review,undefined);assert.ok((await repo.get(accepted.id))!.review)
 const corrupt=structuredClone(next),raw=await io.decode(corrupt.result!.housing);raw.rgba[(300*320+150)*4]^=100;corrupt.result!.housing=await io.encode(raw)
 await assert.rejects(inspectLayeredDraft(corrupt,corrupt.id,io),/RESULT_MISMATCH/)
 const failed=await prepareLayeredDraft(repo,next,fanPartsSpec,{...io,encode:async()=>{throw Error('SIMULATED_ENCODING_FAILURE')}});assert.equal(failed.state,'failed');assert.equal((await repo.get(next.id))!.state,'candidate');assert.equal(failed.source.sha256,FAN_PARTS_SOURCE)
 await assert.rejects(other.save({...accepted,revision:accepted.revision+1},accepted),/DRAFT_REPLACED/)
 assert.equal((await repo.list()).length,4)
 }finally{await repo.close();await other.close()}
 const restored=new BrowserLayeredDrafts(name,factory);assert.equal((await restored.get())?.state,'failed');await restored.close()
 assert.notEqual(layeredDatabaseName('https://game.aiwaves.tech/11111111-1111-4111-8111-111111111111/'),layeredDatabaseName('https://game.aiwaves.tech/22222222-2222-4222-8222-222222222222/'))
})
