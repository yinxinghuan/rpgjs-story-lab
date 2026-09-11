import test from 'node:test'
import assert from 'node:assert/strict'
import {ActorMapTrial,ACTOR_MAP_CHECKS,actorMapReview} from '../src/actor-map-review'
import type {RendererMotion} from '../src/rpg-renderer'
import {walkingPose} from '../src/walking-motion'
import {actorReviewId,actorReviewTarget,assertArchivedActorReview} from '../src/actor-review-archive'
import {emptyActorAnswers,ACTOR_DIRECTIONS,ACTOR_ROW_CHECKS,saveActorSheetReview,saveActorMapReview,assertActorSheetReview} from '../src/actor-sheet-review'
import {inspectActorMapCandidate} from '../src/sprite-map-candidate'
import {inspectSpritePng,newSpriteSource,runSpriteDraft,BrowserSpriteDrafts,type SpritePng} from '../src/sprite-draft'
import {spriteManifest} from '../src/sprite-archive-contract'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
import {IDBFactory} from 'fake-indexeddb'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
const home='train-at-dead-station',river='train-at-river-valley'
function walk(trial:ActorMapTrial,direction='up',scene=home,mutate:(s:RendererMotion,i:number)=>void=()=>{},offset=0){
 const v:{[key:string]:[number,number]}={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}
 for(let i=0;i<=25;i++){const p={x:180+v[direction][0]*i*4,y:430+v[direction][1]*i*4},pose=i===25?'stand':walkingPose(i*4),s:RendererMotion={scene,renderedScene:scene,position:p,renderedPosition:{...p},direction,renderedDirection:direction,animation:pose,renderedAnimation:pose,paused:false};mutate(s,i);trial.sample(s,offset+i*40)}
}
test('real aligned cardinal motion requires all stride poses, one full cycle and a stop; scene arrival alone earns nothing',()=>{
 const t=new ActorMapTrial();let offset=0;for(const d of ACTOR_DIRECTIONS){walk(t,d,home,undefined,offset);offset+=1100}
 assert.deepEqual(t.result(),['down','left','right','up','stand']);t.collision(river,true);assert.equal(t.result().includes('collision'),false)
 t.collision(home,false);assert.equal(t.result().includes('collision'),false);t.collision(home,true)
 walk(t,'up',river,undefined,offset);assert.ok(t.result().includes('river'));assert.equal(t.result().includes('return'),false)
 walk(t,'down',home,undefined,offset+1100);assert.deepEqual(t.result(),[...ACTOR_MAP_CHECKS])
})
test('teleports, diagonal drift, stale renderer, false frames, pauses and non-finite samples cannot complete trials',()=>{
 for(const mutate of [
  (s:RendererMotion)=>s.paused=true,
  (s:RendererMotion)=>s.renderedScene=river,
  (s:RendererMotion)=>s.renderedPosition!.x+=8,
  (s:RendererMotion)=>s.renderedAnimation='stand',
  (s:RendererMotion)=>s.renderedDirection='left',
  (s:RendererMotion)=>s.position.x=NaN,
  (s:RendererMotion,i:number)=>{s.position.x+=i;s.renderedPosition={...s.position}},
  (s:RendererMotion,i:number)=>{s.position.y-=i*100;s.renderedPosition={...s.position}},
  (s:RendererMotion)=>{s.animation='stride-0';s.renderedAnimation='stride-0'},
 ]){const t=new ActorMapTrial();walk(t,'up',home,mutate);assert.deepEqual(t.result(),[])}
 const t=new ActorMapTrial();walk(t,'up',home,(_s,i)=>{if(i%5===0)t.sample(null,i*40-1)});assert.deepEqual(t.result(),[])
})
test('standing confirmation requires a correct stop in every direction, not one successful stop or a changed facing',()=>{
 const t=new ActorMapTrial();walk(t,'up');assert.deepEqual(t.result(),['up'])
 walk(t,'left',home,undefined,1100);walk(t,'right',home,undefined,2200)
 walk(t,'down',home,(s,i)=>{if(i===25){s.direction='up';s.renderedDirection='up'}},3300)
 assert.equal(t.result().includes('stand'),false)
 walk(t,'down',home,undefined,4400);assert.ok(t.result().includes('stand'))
})
async function fixture(){
 const width=60,height=112,rgba=new Uint8ClampedArray(width*height*4).fill(255)
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x%20>=6&&x%20<15&&y%28>=6&&y%28<24)rgba.set([20,40,90,255],(y*width+x)*4)
 const source=newSpriteSource(await encode({width,height,rgba}),'synthetic-non-art-test','actor'),spec={kind:'actor' as const,columns:3,rows:4,cellWidth:20,cellHeight:28,foot:{x:10,y:24},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20},factory=new IDBFactory(),repo=new BrowserSpriteDrafts('map-review',factory),io={encode,decode,process:async(...args:Parameters<typeof prepareSpritePixels>)=>prepareSpritePixels(...args)}
 await repo.save(source,undefined);const draft=await runSpriteDraft(repo,source,spec,io),candidate=await inspectActorMapCandidate(draft,draft.id,decode),map=actorMapReview(candidate,[...ACTOR_MAP_CHECKS]);return {repo,factory,draft,candidate,map,spec,io}
}
test('map confirmation requires all sheet passes, binds actual pixels/scale and invalidates on sheet edit or reprocessing',async()=>{
 const {repo,factory,draft,candidate,map,spec,io}=await fixture(),answers=emptyActorAnswers()
 let reviewed=await saveActorSheetReview(repo,draft,answers)
 await assert.rejects(saveActorMapReview(repo,reviewed,map,candidate,decode),/REQUIRED/)
 for(const d of ACTOR_DIRECTIONS)for(const c of ACTOR_ROW_CHECKS)answers[d][c]='pass'
 reviewed=await saveActorSheetReview(repo,reviewed,answers)
 const before=await actorReviewId(reviewed.actorReview!);await assert.rejects(saveActorMapReview(repo,reviewed,{...map,scale:map.scale*2},candidate,decode),/REPLACED/)
 const saved=await saveActorMapReview(repo,reviewed,map,candidate,decode);assert.notEqual(await actorReviewId(saved.actorReview!),before)
 assert.deepEqual(saved.actorReview!.map,map);await assert.rejects(saveActorMapReview(repo,reviewed,map,candidate,decode),/REPLACED/)
 const target=actorReviewTarget(spriteManifest(saved).manifest),record={version:1,id:await actorReviewId(saved.actorReview!),revision:1,createdAt:0,review:saved.actorReview}
 await assertArchivedActorReview(record,target)
 for(const change of [(r:any)=>r.map.checks.pop(),(r:any)=>r.map.bounds[0][2]=999,(r:any)=>r.answers.up.alternatingSteps='fail']){const r=structuredClone(saved.actorReview);change(r);assert.throws(()=>assertActorSheetReview(r,target))}
 await repo.close();const reopened=new BrowserSpriteDrafts('map-review',factory),read=(await reopened.get())!;assert.deepEqual(read.actorReview!.map,map)
 const processed=await runSpriteDraft(reopened,read,spec,io);assert.equal(processed.actorReview,undefined);assert.deepEqual((await reopened.get(saved.id))!.actorReview!.map,map)
 await reopened.save(saved,processed);answers.up.alternatingSteps='fail';const edited=await saveActorSheetReview(reopened,saved,answers);assert.equal(edited.actorReview!.map,undefined);await reopened.close()
})
