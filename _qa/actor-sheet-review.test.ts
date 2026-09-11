import test from 'node:test'
import assert from 'node:assert/strict'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {IDBFactory} from 'fake-indexeddb'
import {ACTOR_DIRECTIONS,ACTOR_ROW_CHECKS,emptyActorAnswers,actorReviewStatus,currentActorReview,assertActorSheetReview,saveActorSheetReview} from '../src/actor-sheet-review'
import {BrowserSpriteDrafts,newSpriteSource,inspectSpritePng,runSpriteDraft,type SpritePng} from '../src/sprite-draft'
import {spriteManifest,spriteManifestSignature,restoreSpriteManifest} from '../src/sprite-archive-contract'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
async function fixture(){
 const width=60,height=112,rgba=new Uint8ClampedArray(width*height*4).fill(255)
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x%20>=6&&x%20<15&&y%28>=6&&y%28<24)rgba.set([20,40,90,255],(y*width+x)*4)
 const source=newSpriteSource(await encode({width,height,rgba}),'synthetic-no-anatomy','actor'),spec={kind:'actor' as const,columns:3,rows:4,cellWidth:20,cellHeight:28,foot:{x:10,y:24},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
 const factory=new IDBFactory(),repo=new BrowserSpriteDrafts('actor-review',factory),io={encode,decode,process:async(...args:Parameters<typeof prepareSpritePixels>)=>prepareSpritePixels(...args)}
 await repo.save(source,undefined);const draft=await runSpriteDraft(repo,source,spec,io)
 assert.equal(draft.state,'candidate');return {repo,factory,draft,spec,io}
}
test('unreviewed sheets never acquire semantic approval from processing; partial and rejected observations survive reopen',async()=>{
 const {repo,factory,draft}=await fixture();assert.equal(currentActorReview(draft),undefined)
 const answers=emptyActorAnswers();assert.equal(actorReviewStatus(answers),'incomplete')
 answers.up.alternatingSteps='fail';answers.up.facing='pass'
 const saved=await saveActorSheetReview(repo,draft,answers);assert.equal(actorReviewStatus(saved.actorReview!.answers),'rejected');assert.equal(saved.revision,draft.revision)
 answers.up.alternatingSteps='pass';assert.equal(saved.actorReview!.answers.up.alternatingSteps,'fail')
 await repo.close();const reopened=new BrowserSpriteDrafts('actor-review',factory),read=(await reopened.get())!
 assert.equal(currentActorReview(read)!.answers.up.alternatingSteps,'fail');assert.equal(read.result!.png.sha256,draft.result!.png.sha256);await reopened.close()
})
test('all twelve explicit passes mean sheet-reviewed only, and changing any result to fail takes precedence',()=>{
 const a=emptyActorAnswers();for(const d of ACTOR_DIRECTIONS)for(const c of ACTOR_ROW_CHECKS)a[d][c]='pass'
 assert.equal(actorReviewStatus(a),'sheet-reviewed');a.left.attachments='fail';assert.equal(actorReviewStatus(a),'rejected');a.left.attachments='unchecked';assert.equal(actorReviewStatus(a),'incomplete')
 assert.throws(()=>actorReviewStatus({...a,up:undefined} as any),/REVIEW_INVALID/)
 assert.throws(()=>actorReviewStatus({...a,up:{...a.up,alternatingSteps:true}} as any),/REVIEW_INVALID/)
})
test('reprocessing clears the new candidate review and retains the earlier rejected record',async()=>{
 const {repo,draft,spec,io}=await fixture(),answers=emptyActorAnswers();answers.up.alternatingSteps='fail'
 const saved=await saveActorSheetReview(repo,draft,answers),next=await runSpriteDraft(repo,saved,spec,io)
 assert.equal(next.state,'candidate');assert.equal(next.actorReview,undefined);assert.notEqual(next.id,saved.id)
 assert.equal((await repo.get(saved.id))!.actorReview!.answers.up.alternatingSteps,'fail');await repo.close()
})
test('review binds candidate identity, source, pixels, preparation and frame mapping, while stale tabs cannot replace newer observations',async()=>{
 const {repo,draft}=await fixture(),answers=emptyActorAnswers();answers.down.facing='pass'
 const saved=await saveActorSheetReview(repo,draft,answers)
 await assert.rejects(saveActorSheetReview(repo,draft,answers),/DRAFT_REPLACED/)
 for(const change of [
  (d:typeof saved)=>{d.id=crypto.randomUUID()},
  (d:typeof saved)=>{d.source.sha256='0'.repeat(64)},
  (d:typeof saved)=>{d.result!.png.sha256='0'.repeat(64)},
  (d:typeof saved)=>{d.spec!.foot.y--},
  (d:typeof saved)=>{d.result!.frames[9].row=2},
  (d:typeof saved)=>{d.spec!.kind='states'},
 ]){const changed=structuredClone(saved);change(changed);assert.equal(currentActorReview(changed),undefined);assert.throws(()=>assertActorSheetReview(saved.actorReview,changed),/REVIEW_INVALID/)}
 const corrupt=structuredClone(saved);corrupt.result!.png.bytes[0]=0;await repo.save(corrupt,saved)
 await assert.rejects(saveActorSheetReview(repo,corrupt,answers),/INVALID_PNG/);await repo.close()
})
test('local review leaves an already uploaded immutable archive unchanged; restoration explicitly starts without that local review',async()=>{
 const {repo,draft}=await fixture(),before=spriteManifest(draft),answers=emptyActorAnswers();answers.up.alternatingSteps='fail'
 const saved=await saveActorSheetReview(repo,draft,answers),after=spriteManifest(saved)
 assert.equal(spriteManifestSignature(before.manifest),spriteManifestSignature(after.manifest))
 assert.equal('actorReview' in after.manifest.draft,false)
 const restored=await restoreSpriteManifest(after.manifest,async f=>after.payload.get(f.role)!.bytes)
 assert.equal(restored.actorReview,undefined);assert.equal(currentActorReview(restored),undefined);await repo.close()
})
