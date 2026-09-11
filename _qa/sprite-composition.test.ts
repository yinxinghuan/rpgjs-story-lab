import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {IDBFactory} from 'fake-indexeddb'
import {composeRepairFrames} from '../src/sprite-composition'
import {BrowserSpriteDrafts,inspectSpritePng,newSpriteSource,runSpriteDraft,verifySpriteComposition,type SpritePng,type SpriteDraft} from '../src/sprite-draft'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
import {inspectDeviceMapCandidate,deviceCandidateSheet} from '../src/device-map-candidate'
import {deviceGeometry,DEVICE_CHECKS,DEVICE_LAYOUT} from '../src/device-publication'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
function raster(columns:number){const width=columns*20,height=28,rgba=new Uint8ClampedArray(width*height*4).fill(255);for(let col=0;col<columns;col++)for(let y=6;y<24;y++)for(let x=6;x<15;x++)rgba.set([20+col*25,40,90,255],(y*width+col*20+x)*4);return {width,height,rgba}}
async function fixture(){
 const a=raster(3),b=raster(1),source=composeRepairFrames([{raster:a,columns:3,column:1},{raster:b,columns:1,column:0}])
 const draft:SpriteDraft={...newSpriteSource(await encode(source),'composite','states'),deviceStateSet:'repair',composition:{version:1,inputs:[{source:await encode(a),sourceName:'before',columns:3,column:1},{source:await encode(b),sourceName:'after',columns:1,column:0}]}}
 return {draft,spec:{kind:'states' as const,columns:2,rows:1,cellWidth:20,cellHeight:28,foot:{x:10,y:24},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20,sourceAnchors:[{x:10,y:24},{x:10,y:24}]},io:{encode,decode,process:async(...args:Parameters<typeof prepareSpritePixels>)=>prepareSpritePixels(...args)}}
}
test('composition selects only declared source columns without changing originals',()=>{
 const a=raster(3),b=raster(1),original=structuredClone(a),out=composeRepairFrames([{raster:a,columns:3,column:1},{raster:b,columns:1,column:0}])
 assert.deepEqual(a,original);assert.equal(out.width,40)
 for(let y=0;y<28;y++){assert.deepEqual(out.rgba.subarray(y*160,y*160+80),a.rgba.subarray((y*60+20)*4,(y*60+40)*4));assert.deepEqual(out.rgba.subarray(y*160+80,(y+1)*160),b.rgba.subarray(y*80,(y+1)*80))}
 assert.throws(()=>composeRepairFrames([{raster:a,columns:3,column:3},{raster:b,columns:1,column:0}]),/GRID/)
 assert.throws(()=>composeRepairFrames([{raster:a,columns:1,column:0},{raster:b,columns:1,column:0}]),/SIZE_MISMATCH/)
})
test('original inputs and column provenance survive processing, reopen and retry',async()=>{
 const {draft,spec,io}=await fixture(),factory=new IDBFactory(),repo=new BrowserSpriteDrafts('composition',factory)
 await repo.save(draft,undefined);const result=await runSpriteDraft(repo,draft,spec,io)
 assert.equal(result.state,'candidate');assert.deepEqual(result.composition,draft.composition)
 await repo.close();const reopened=new BrowserSpriteDrafts('composition',factory)
 const restored=(await reopened.get())!;assert.deepEqual(restored,result);await verifySpriteComposition(restored,decode)
 const again=await runSpriteDraft(reopened,restored,spec,io);assert.equal(again.state,'candidate');assert.deepEqual(await reopened.get(draft.id),draft)
 await reopened.close()
})
test('changed original bytes, changed selection or composite cannot silently enter a candidate',async()=>{
 const {draft,spec,io}=await fixture()
 const changed=structuredClone(draft);changed.composition!.inputs[0].column=0
 await assert.rejects(verifySpriteComposition(changed,decode),/COMPOSITION_MISMATCH/)
 const corrupt=structuredClone(draft);corrupt.composition!.inputs[0].source.sha256='0'.repeat(64)
 const repo=new BrowserSpriteDrafts('composition-failure',new IDBFactory());await repo.save(corrupt,undefined)
 let processed=false;const failed=await runSpriteDraft(repo,corrupt,spec,{...io,process:async(input,s)=>{processed=true;return io.process(input,s)}})
 assert.equal(failed.state,'failed');assert.equal(processed,false);assert.deepEqual(await repo.get(corrupt.id),corrupt);await repo.close()
})
test('two repair states use their actual columns and cannot masquerade as the legacy stocked cabinet',async()=>{
 const {draft,spec,io}=await fixture(),repo=new BrowserSpriteDrafts('composition-map',new IDBFactory());await repo.save(draft,undefined)
 const result=await runSpriteDraft(repo,draft,spec,io),checked=await inspectDeviceMapCandidate(result,result.id,decode),sheet=deviceCandidateSheet(checked,'checked.png')
 assert.deepEqual(checked.states,['broken','repaired']);assert.equal(sheet.framesWidth,2)
 assert.deepEqual(Object.keys(sheet.textures),['stand','broken','repaired'])
 assert.equal((sheet.textures as any).repaired.animations()[0][0].frameX,1)
 await assert.rejects(inspectDeviceMapCandidate({...result,deviceStateSet:undefined},result.id,decode))
 const reviewed:SpriteDraft={...result,deviceReview:{sha256:result.result!.png.sha256,layout:DEVICE_LAYOUT,geometry:deviceGeometry(checked.cellWidth,checked.cellHeight,checked.foot,checked.bounds),checks:[...DEVICE_CHECKS],visualAccepted:true}}
 await repo.save(reviewed,result);const next=await runSpriteDraft(repo,reviewed,spec,io)
 assert.equal(next.state,'candidate');assert.equal(next.deviceReview,undefined);assert.ok((await repo.get(reviewed.id))!.deviceReview)
 await repo.close()
})
