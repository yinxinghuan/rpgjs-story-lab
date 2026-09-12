import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {diagnosticActorDraft,actorPublicationFixture} from './actor-publication-fixture'
import {assertPublishedActor,assertPublishedHero,heroReleasePath,actorReleasePath} from '../src/actor-publication'
import {originalPublishedHero,originalEnrollmentAssets,originalActorRelease} from '../src/original-asset-releases'
import {originalBoundHero} from '../src/original-bound-hero'
import {originalHeroSheet} from '../src/original-hero-sheet'
import {originalVisualContext} from '../server/original-visual-context'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {actorReviewId} from '../src/actor-review-archive'

test('player publication has a separate public role, recovers lost replies and cannot overwrite a review',async()=>{
 const f=await actorPublicationFixture();try{
  const d=await diagnosticActorDraft();await f.cloud.saveWithReview(d)
  assert.equal(await f.cloud.heroPublication(d.id),null)
  await assert.rejects(f.api('/sprites/'+d.id+'/publish-hero',{reviewId:'0'.repeat(64)}),/ACTOR_REVIEW_REQUIRED/)
  f.lose('/publish-hero');await assert.rejects(f.cloud.publishHero(d));f.restart()
  const r=await f.cloud.publishHero(d);assertPublishedHero(r);assert.throws(()=>assertPublishedActor(r))
  assert.equal(await f.cloud.actorPublication(d.id),null)
  assert.equal((await fetch(f.base+actorReleasePath(r.id))).status,404)
  assert.deepEqual(await (await fetch(f.base+heroReleasePath(r.id))).json(),r)
  const png=await fetch(f.base+heroReleasePath(r.id)+'/file');assert.match(png.headers.get('cache-control')!,/immutable/);assert.deepEqual(new Uint8Array(await png.arrayBuffer()),d.result!.png.bytes)
  assert.equal((await fetch(f.base+'/api/creator/sprites/'+d.id+'/file/source')).status,401)
  const ada=await f.cloud.publishActor(d);assertPublishedActor(ada);assert.throws(()=>assertPublishedHero(ada))
  assert.throws(()=>originalEnrollmentAssets({protagonist:ada}));assert.throws(()=>originalEnrollmentAssets({actor:r}))
  const no=structuredClone(d);no.actorReview!.recordedAt++;delete no.actorReview!.map;no.actorReview!.answers.up.alternatingSteps='fail';await f.cloud.saveWithReview(no)
  assert.deepEqual(await f.cloud.publishHero(d),r)
  await assert.rejects(f.api('/sprites/'+d.id+'/publish-hero',{reviewId:await actorReviewId(no.actorReview!)}),/ACTOR_RELEASE_CONFLICT/)
  const fresh=await diagnosticActorDraft();await f.cloud.saveWithReview(fresh);const reject=structuredClone(fresh);reject.actorReview!.recordedAt++;delete reject.actorReview!.map;reject.actorReview!.answers.up.alternatingSteps='fail';await f.cloud.saveWithReview(reject)
  await assert.rejects(f.cloud.publishHero(fresh),/ACTOR_REVIEW_REQUIRED/)
 }finally{await f.close()}
})
for(const locale of ['zh','en']as const)test('custom protagonist binds separately, retains old journeys and never inherits yellow clothing '+locale,async()=>{
 const f=await actorPublicationFixture();try{
  const old=await f.player().client.enroll(locale),baseline=originalBoundHero(old.assets),d=await diagnosticActorDraft(),r=await f.cloud.publishHero(d),a=await f.cloud.publishActor(d)
  f.lose('/sessions');await assert.rejects(f.player(a.id,r.id).client.enroll(locale));f.restart()
  const h=await f.player(a.id,r.id).client.enroll(locale);assert.notEqual(h.id,old.id);assert.deepEqual(originalPublishedHero(h.assets),r);assert.deepEqual(originalActorRelease(h.assets),a)
  const hero=originalBoundHero(h.assets);assert.equal(hero.resource.sha256,r.sha256);assert.equal(hero.scale,r.review.scale);assert.deepEqual(hero.appearance,{});assert.equal(hero.appearanceStatus,'not-described')
  assert.equal(originalHeroSheet('test',h.assets).framesWidth,3)
  const context=originalVisualContext(h,'ada-mechanic');assert.deepEqual(context.protagonist.appearance,{});assert.equal(context.protagonist.appearanceStatus,'not-described')
  assert.deepEqual(await f.player(a.id,r.id).client.enroll(locale),h);assert.deepEqual(await f.player().client.enroll(locale),old);assert.deepEqual(originalBoundHero(old.assets),baseline)
  assert.equal(originalPublishedHero((await f.player(a.id).client.enroll(locale)).assets),undefined)
  await assert.rejects(f.player(undefined,r.id.split('.')[0]+'.'+randomUUID()).client.enroll(locale),/HERO_NOT_PUBLISHED/)
 }finally{await f.close()}
})

for(const locale of ['zh','en'] as const)test('published protagonist stays fixed through full '+locale+' story, enrollment/action/ending recovery and old journey coexistence',async()=>{
 const f=await actorPublicationFixture();try{const old=await f.player().client.enroll(locale),release=await f.cloud.publishHero(await diagnosticActorDraft());let connection=f.player(undefined,release.id)
  f.lose('/sessions');await assert.rejects(connection.client.enroll(locale));f.restart();connection=f.player(undefined,release.id);let h=await connection.client.enroll(locale)
  assert.notEqual(h.id,old.id);const assets=structuredClone(h.assets),world=originalTrainChapterSpatialPlan(),steps=['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart','tunnel-inspect','tunnel-doctor-led','tunnel-ventilate','tunnel-depart','yard-meet','yard-medical-pact','yard-route-brief','yard-invite','yard-depart','pass-inspect','pass-player-watch','pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart','town-inspect','town-grid-aid','town-public-rules','town-refuel','town-repair','town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange','bridge-rail-crossing','junction-review','junction-settle-basic']
  for(const [i,action]of steps.entries()){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!,intent={target:e.id,position:e.approach,type:'action',action}
   if(i===0){f.lose('/actions');await assert.rejects(connection.client.send(h,intent));f.restart();connection=f.player(undefined,release.id);h=(await connection.client.recover()).head;assert.equal(h.save.stats.condition,87)}else h=(await connection.client.send(h,intent)).head
   assert.deepEqual(h.assets,assets);assert.deepEqual(originalPublishedHero(h.assets),release);assert.equal(h.version,i+1)
  }
  f.lose('/ending');await assert.rejects(connection.client.sendEnding(h));f.restart();h=(await f.player(undefined,release.id).client.recover()).head;assert.equal(h.save.finale.status,'complete');assert.deepEqual(h.assets,assets)
  assert.deepEqual(await f.player(undefined,release.id).client.enroll(locale),h);assert.deepEqual(await f.player().client.enroll(locale),old)
  await assert.rejects(f.player().api('/sessions',connection.client.read('enrollment-request',null)),/ENROLLMENT_ID_CONFLICT/)
  await assert.rejects(f.player(undefined,release.id.split('.')[0]+'.'+randomUUID()).client.enroll(locale),/HERO_NOT_PUBLISHED/)
 }finally{await f.close()}
})
