import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {IDBFactory} from 'fake-indexeddb'
import {BrowserSpriteDrafts,inspectSpritePng,newSpriteSource,newActorFrameSource,runSpriteDraft,verifySpriteComposition,type SpritePng} from '../src/sprite-draft'
import {spriteManifest,restoreSpriteManifest,assertSpriteManifest} from '../src/sprite-archive-contract'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
function raster(columns:number,rows:number,color:number){const width=columns*20,height=rows*28,rgba=new Uint8ClampedArray(width*height*4).fill(255);for(let row=0;row<rows;row++)for(let col=0;col<columns;col++)for(let y=6;y<24;y++)for(let x=6;x<15;x++)rgba.set([color,40,90,255],((row*28+y)*width+col*20+x)*4);return {width,height,rgba}}
test('single frame sources survive preparation, database reopen and archive restoration without inherited approval',async()=>{
 const factory=new IDBFactory(),repo=new BrowserSpriteDrafts('actor-patch',factory)
 const original=newSpriteSource(await encode(raster(3,4,30)),'base','actor'),snapshot=structuredClone(original)
 original.actorReview={oldApproval:true} as any
 const patch=await newActorFrameSource(original,await encode(raster(1,1,130)),'opposite frame',1,2,{encode,decode})
 assert.equal(patch.actorReview,undefined);assert.equal(patch.generation,undefined);assert.equal(patch.parentId,original.id)
 assert.deepEqual(original.source,snapshot.source)
 await repo.save(original,undefined);await repo.save(patch,original)
 const spec={kind:'actor' as const,columns:3,rows:4,cellWidth:20,cellHeight:28,foot:{x:10,y:24},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
 const result=await runSpriteDraft(repo,patch,spec,{encode,decode,process:async(r,s)=>prepareSpritePixels(r,s)})
 assert.equal(result.state,'candidate');assert.deepEqual(result.actorPatch,patch.actorPatch)
 await repo.close();const reopened=new BrowserSpriteDrafts('actor-patch',factory)
 const loaded=(await reopened.get())!;assert.deepEqual(loaded,result);await verifySpriteComposition(loaded,decode)
 const {manifest,payload}=spriteManifest(loaded);assert.equal(manifest.files.length,4)
 const restored=await restoreSpriteManifest(manifest,async f=>payload.get(f.role)!.bytes)
 assert.deepEqual(restored,result);await verifySpriteComposition(restored,decode)
 const tampered=structuredClone(restored);tampered.actorPatch!.row=2
 await assert.rejects(verifySpriteComposition(tampered,decode),/COMPOSITION_MISMATCH/)
 const bad=structuredClone(manifest);bad.draft.actorPatch.column=3;assert.throws(()=>assertSpriteManifest(bad),/ARCHIVE_INVALID/)
 assert.deepEqual((await reopened.get(original.id))!.source,snapshot.source)
 await reopened.close()
})
