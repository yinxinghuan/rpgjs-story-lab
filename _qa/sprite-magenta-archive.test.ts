import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {inspectSpritePng,newSpriteSource,type SpriteDraft} from '../src/sprite-draft'
import {spriteManifest,assertSpriteManifest,restoreSpriteManifest} from '../src/sprite-archive-contract'
import {inspectActorMapCandidate} from '../src/sprite-map-candidate'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('real rejected Lan source survives shared preparation, archive restore and map geometry without acquiring visual approval',async()=>{
 const source=await inspectSpritePng(new Uint8Array(readFileSync(new URL('../doc/oldstreet-lan-walking/candidate.png',import.meta.url))))
 const image=PNG.sync.read(Buffer.from(source.bytes)),spec={columns:3,rows:4,cellWidth:320,cellHeight:352,foot:{x:160,y:328},kind:'actor' as const,backgroundMode:'magenta' as const,neutralMin:200,chromaMax:20}
 const result=prepareSpritePixels({width:image.width,height:image.height,rgba:new Uint8ClampedArray(image.data)},spec)
 const png=await inspectSpritePng(PNG.sync.write({width:result.raster.width,height:result.raster.height,data:Buffer.from(result.raster.rgba)}))
 const draft:SpriteDraft={...newSpriteSource(source,'Lan walking — pose review rejected','actor'),spec,state:'candidate',result:{algorithm:result.algorithm,frames:result.frames,metrics:result.metrics,png}}
 const {manifest,payload}=spriteManifest(draft);assertSpriteManifest(manifest)
 const restored=await restoreSpriteManifest(manifest,async f=>payload.get(f.role)!.bytes)
 assert.equal(restored.source.sha256,source.sha256);assert.equal(restored.result!.png.sha256,png.sha256);assert.equal(restored.spec!.backgroundMode,'magenta');assert.equal(restored.actorReview,undefined)
 const preview=await inspectActorMapCandidate(restored,restored.id,async p=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}})
 assert.equal(preview.frameBounds.length,12)
 const changed=structuredClone(manifest);changed.draft.result.algorithm='neutral-matte-unmix-1';assert.throws(()=>assertSpriteManifest(changed),/SPRITE_ARCHIVE_INVALID/)
})
