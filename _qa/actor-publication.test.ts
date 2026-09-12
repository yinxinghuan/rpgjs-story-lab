import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {mkdtempSync,rmSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomUUID} from 'node:crypto'
import {PreflightStorage} from '../server/preflight-storage'
import {CreatorSpriteArchive} from '../server/creator-sprites'
import {createHandler,CarriageJourneyAuthority} from '../worker/source'
import {creatorCloudTransport} from '../src/creator-cloud'
import {SpriteCloudArchive} from '../src/sprite-cloud'
import {newSpriteSource,inspectSpritePng,type SpriteDraft,type SpritePng} from '../src/sprite-draft'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
import {inspectActorMapCandidate,verifyPublishedActorPixels} from '../src/sprite-map-candidate'
import {ACTOR_MAP_CHECKS,actorMapReview} from '../src/actor-map-review'
import {ACTOR_DIRECTIONS,ACTOR_ROW_CHECKS,emptyActorAnswers,saveActorSheetReview,saveActorMapReview} from '../src/actor-sheet-review'
import {actorReviewId} from '../src/actor-review-archive'
import {assertPublishedActor,actorReleasePath} from '../src/actor-publication'
import {originalSessionHttp} from '../src/original-session-http'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalActorRelease,originalStarterRelease,originalEnrollmentAssets,originalBackgroundVersion,originalBackgroundReleases,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
import {originalActorResource,originalStandingSheet,originalActorDirection,originalCharacterArtAnimation} from '../src/original-character-art'
import {originalEquipmentBodies} from '../src/original-equipment-art'
import {DEVICE_LAYOUT,DEVICE_CHECKS,deviceGeometry,type PublishedDevice} from '../src/device-publication'
import {BACKGROUND_LAYOUT,BACKGROUND_CHECKS,type PublishedBackground} from '../src/background-publication'
import {GAME_ID} from '../src/game-id'
import {spriteManifest,spritePartText,SPRITE_ARCHIVE_PART} from '../src/sprite-archive-contract'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
import {diagnosticActorDraft,actorPublicationFixture} from './actor-publication-fixture'
test('actor publication is explicit, private-source, latest-review-gated and immutable after lost replies',async()=>{
 const f=await actorPublicationFixture();try{const d=await diagnosticActorDraft();await f.cloud.saveWithReview(d);assert.equal(await f.cloud.actorPublication(d.id),null)
  await assert.rejects(f.api('/sprites/'+d.id+'/publish-actor',{reviewId:'0'.repeat(64)}),/ACTOR_REVIEW_REQUIRED/)
  f.lose('/publish-actor');await assert.rejects(f.cloud.publishActor(d));f.restart();const release=await f.cloud.publishActor(d);assertPublishedActor(release)
  assert.deepEqual(await f.cloud.actorPublication(d.id),release);assert.deepEqual(await (await fetch(f.base+actorReleasePath(release.id))).json(),release)
  assert.equal('sourceSha256' in release,false);assert.equal('preparation' in release.review,false)
  const file=await fetch(f.base+actorReleasePath(release.id)+'/file');assert.match(file.headers.get('Cache-Control')!,/immutable/);assert.deepEqual(new Uint8Array(await file.arrayBuffer()),d.result!.png.bytes)
  assert.equal((await fetch(f.base+'/api/creator/sprites/'+d.id+'/file/source')).status,401)
  const rejected=structuredClone(d);delete rejected.actorReview!.map;rejected.actorReview!.recordedAt++;rejected.actorReview!.answers.up.alternatingSteps='fail';await f.cloud.saveWithReview(rejected)
  assert.deepEqual(await f.cloud.publishActor(d),release)
  await assert.rejects(f.api('/sprites/'+d.id+'/publish-actor',{reviewId:await actorReviewId(rejected.actorReview!)}),/ACTOR_RELEASE_CONFLICT/)
  const another=await diagnosticActorDraft();await f.cloud.saveWithReview(another);const no=structuredClone(another);delete no.actorReview!.map;no.actorReview!.recordedAt++;no.actorReview!.answers.right.facing='fail';await f.cloud.saveWithReview(no)
  await assert.rejects(f.cloud.publishActor(another),/ACTOR_REVIEW_REQUIRED/)
  const missing=release.id.split('.')[0]+'.'+another.id;assert.equal((await fetch(f.base+actorReleasePath(missing))).status,404)
  await verifyPublishedActorPixels(release,d.result!.png,decode)
  const changed=structuredClone(release);changed.review.bounds[0][0]++;await assert.rejects(verifyPublishedActorPixels(changed,d.result!.png,decode),/ACTOR_GEOMETRY_MISMATCH/)
  assert.throws(()=>assertPublishedActor({...release,slot:'ren-medic'}),/ACTOR_RELEASE_INVALID/)
  assert.throws(()=>assertPublishedActor({...release,foot:{...release.foot,x:1}}),/ACTOR_RELEASE_INVALID/)
  const tooWide=structuredClone(release);tooWide.review.bounds.forEach(b=>{b[0]=1;b[2]=23});assert.throws(()=>assertPublishedActor(tooWide),/ACTOR_RELEASE_INVALID/)
 }finally{await f.close()}
})
test('actor binding composes with old background/device versions and preserves scene placement, facing and absence',async()=>{
 const f=await actorPublicationFixture();try{const release=await f.cloud.publishActor(await diagnosticActorDraft()),r=originalTrainRuntime(()=>true),h=r.initial('zh',randomUUID(),{actor:release})
  assert.equal(h.assets?.version,4);assert.deepEqual(originalActorRelease(h.assets),release);assert.ok(originalActorResource(h.assets).path.endsWith('/actor-releases/'+release.id+'/file'))
  const old=r.initial('zh',randomUUID());assert.equal(originalActorRelease(old.assets),undefined);assert.equal(originalStandingSheet('old').framesWidth,1)
  const sheet=originalStandingSheet('published',h.assets),before=JSON.stringify(h)
  for(const [to,row] of [[{x:0,y:1},0],[{x:-1,y:0},1],[{x:1,y:0},2],[{x:0,y:-1},3]] as const){const direction=originalActorDirection({x:0,y:0},to),frame=sheet.textures.stand.animations({direction})[0][0];assert.equal(frame.frameX,1);assert.equal(frame.frameY,row);assert.equal(frame.opacity,1)}
  assert.equal(JSON.stringify(h),before);h.save.characters[0].status='departed';assert.equal(originalCharacterArtAnimation(h.save,'ada-mechanic'),'hidden')
  const g=deviceGeometry(80,128,{x:40,y:110},[[24,30,56,111],[24,30,56,111]]),device:PublishedDevice={version:1,id:'a'.repeat(64)+'.'+randomUUID(),slot:'starter',sha256:'b'.repeat(64),bytes:100,width:160,height:128,review:{sha256:'b'.repeat(64),layout:DEVICE_LAYOUT,geometry:g,checks:[...DEVICE_CHECKS],visualAccepted:true}},bg=originalBackgroundReleases[ORIGINAL_BACKGROUND_PLATFORM],background:PublishedBackground={version:1,id:'c'.repeat(64)+'.'+randomUUID(),scene:'train-at-dead-station',sha256:bg.sha256,bytes:bg.bytes,width:1024,height:1536,review:{sha256:bg.sha256,layout:BACKGROUND_LAYOUT,checks:[...BACKGROUND_CHECKS],visualAccepted:true}}
  const combined=originalEnrollmentAssets({actor:release,starter:device,background}),legacy=originalEnrollmentAssets({starter:device,background})
  assert.deepEqual(originalStarterRelease(combined),device);assert.equal(originalBackgroundVersion(combined),background.id);assert.deepEqual(originalEquipmentBodies(h.sceneId,combined),originalEquipmentBodies(h.sceneId,legacy));assert.deepEqual(r.upgrade({...old,assets:undefined}).assets,undefined)
 }finally{await f.close()}
})
for(const locale of ['zh','en'] as const)test('published actor stays fixed through full '+locale+' story, enrollment/action/ending recovery and old journey coexistence',async()=>{
 const f=await actorPublicationFixture();try{const old=await f.player().client.enroll(locale),release=await f.cloud.publishActor(await diagnosticActorDraft());let connection=f.player(release.id)
  f.lose('/sessions');await assert.rejects(connection.client.enroll(locale));f.restart();connection=f.player(release.id);let h=await connection.client.enroll(locale)
  assert.notEqual(h.id,old.id);const assets=structuredClone(h.assets),world=originalTrainChapterSpatialPlan(),steps=['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led','tunnel-ventilate','tunnel-depart','yard-meet','yard-medical-pact','yard-route-brief','yard-invite','yard-depart','pass-inspect','pass-player-watch','pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart','town-inspect','town-grid-aid','town-public-rules','town-refuel','town-repair','town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange','bridge-rail-crossing','junction-review','junction-settle-basic']
  for(const [i,action]of steps.entries()){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!,intent={target:e.id,position:e.approach,type:'action',action}
   if(i===0){f.lose('/actions');await assert.rejects(connection.client.send(h,intent));f.restart();connection=f.player(release.id);h=(await connection.client.recover()).head;assert.equal(h.save.stats.condition,87)}else h=(await connection.client.send(h,intent)).head
   assert.deepEqual(h.assets,assets);assert.deepEqual(originalActorRelease(h.assets),release);assert.equal(h.version,i+1)
  }
  f.lose('/ending');await assert.rejects(connection.client.sendEnding(h));f.restart();h=(await f.player(release.id).client.recover()).head;assert.equal(h.save.finale.status,'complete');assert.deepEqual(h.assets,assets)
  assert.deepEqual(await f.player(release.id).client.enroll(locale),h);assert.deepEqual(await f.player().client.enroll(locale),old)
  await assert.rejects(f.player().api('/sessions',connection.client.read('enrollment-request',null)),/ENROLLMENT_ID_CONFLICT/)
  await assert.rejects(f.player(release.id.split('.')[0]+'.'+randomUUID()).client.enroll(locale),/ACTOR_NOT_PUBLISHED/)
 }finally{await f.close()}
})
test('a rejection written during async publication verification prevents publication',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'actor-publish-race-')),pool=new PreflightStorage(dir),ctx=pool.context('synthetic-actor-race'),archive=new CreatorSpriteArchive({all:<T>(s:string,...b:any[])=>ctx.storage.sql.exec(s,...b).toArray() as T[],run:(s:string,...b:any[])=>{ctx.storage.sql.exec(s,...b)},transaction:<T>(w:()=>T)=>ctx.storage.transactionSync(w)}),owner='a'.repeat(64)
 try{const d=await diagnosticActorDraft(),{manifest,payload}=spriteManifest(d);archive.begin(owner,manifest)
  for(const f of manifest.files){const bytes=payload.get(f.role)!.bytes;for(let offset=0,part=0;offset<bytes.length;offset+=SPRITE_ARCHIVE_PART,part++)archive.part(owner,d.id,{role:f.role,part,data:spritePartText(bytes.subarray(offset,offset+SPRITE_ARCHIVE_PART))})}
  await archive.finish(owner,d.id);const reviewId=await actorReviewId(d.actorReview!);await archive.saveActorReview(owner,d.id,{id:reviewId,review:d.actorReview})
  const checked=archive.file.bind(archive);archive.file=async(...args)=>{const review=structuredClone(d.actorReview!);delete review.map;review.recordedAt++;review.answers.up.alternatingSteps='fail';await archive.saveActorReview(owner,d.id,{id:await actorReviewId(review),review});return checked(...args)}
  await assert.rejects(archive.publishActor(owner,d.id,{reviewId}),/ACTOR_REVIEW_REQUIRED/);assert.equal(archive.actorPublication(owner,d.id),null)
 }finally{pool.close();rmSync(dir,{recursive:true,force:true})}
})
