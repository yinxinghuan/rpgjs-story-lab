import test from 'node:test'
import assert from 'node:assert/strict'
import {newProtagonistSource} from '../src/sprite-draft'
import {actorReviewId} from '../src/actor-review-archive'
import {saveProtagonistIdentityReview} from '../src/actor-sheet-review'
import {protagonistIdentity} from '../src/protagonist-identity'
import {spriteManifest,restoreSpriteManifest,assertSpriteManifest} from '../src/sprite-archive-contract'
import {diagnosticActorDraft,actorPublicationFixture} from './actor-publication-fixture'

// Synthetic pixels exercise private provenance, never visual identity quality.
test('protagonist provenance survives archive restore and cannot bind different source bytes',async()=>{
 const draft=await diagnosticActorDraft()
 draft.protagonistIdentity=protagonistIdentity('a'.repeat(64),draft.source.sha256)
 const {manifest,payload}=spriteManifest(draft)
 const restored=await restoreSpriteManifest(manifest,async f=>payload.get(f.role)!.bytes)
 assert.deepEqual(restored.protagonistIdentity,draft.protagonistIdentity)
 const changed=structuredClone(manifest)
 changed.draft.protagonistIdentity.sourceSha256='b'.repeat(64)
 assert.throws(()=>assertSpriteManifest(changed),/PROTAGONIST_IDENTITY_INVALID/)
 const leaked=structuredClone(manifest)
 leaked.draft.protagonistIdentity.avatarUrl='https://example.test/private-avatar'
 assert.throws(()=>assertSpriteManifest(leaked),/PROTAGONIST_IDENTITY_INVALID/)
 const legacy=await diagnosticActorDraft()
 assertSpriteManifest(spriteManifest(legacy).manifest)
})

test('current private archive stores provenance but neither NPC nor unchecked hero publication may use it',async()=>{
 const f=await actorPublicationFixture()
 try{
  const d=await diagnosticActorDraft()
  d.protagonistIdentity=protagonistIdentity('a'.repeat(64),d.source.sha256)
  await f.cloud.saveWithReview(d)
  f.restart()
  await assert.rejects(f.cloud.publishActor(d),/PROTAGONIST_NPC_BINDING_FORBIDDEN/)
  await assert.rejects(f.cloud.publishHero(d),/PROTAGONIST_IDENTITY_REVIEW_REQUIRED/)
  assert.equal(await f.cloud.heroPublication(d.id),null)
  assert.equal(await f.cloud.actorPublication(d.id),null)
  const accepted=structuredClone(d)
  accepted.actorReview!.recordedAt++
  accepted.actorReview!.identity={referenceSha256:d.protagonistIdentity.referenceSha256,checks:{silhouette:'pass',covering:'pass',costume:'pass',proportions:'pass'}}
  assert.notEqual(await actorReviewId(accepted.actorReview!),await actorReviewId(d.actorReview!))
  await f.cloud.saveWithReview(accepted)
  f.lose('/publish-hero');await assert.rejects(f.cloud.publishHero(accepted));f.restart()
  const release=await f.cloud.publishHero(accepted)
  assert.equal(release.slot,'protagonist')
  await assert.rejects(f.cloud.publishActor(accepted),/PROTAGONIST_NPC_BINDING_FORBIDDEN/)

 }finally{await f.close()}
})

test('reference-backed source starts unreviewed and verifies both images before creating a candidate',async()=>{
 const fixture=await diagnosticActorDraft()
 const d=await newProtagonistSource(fixture.source,fixture.source)
 assert.equal(d.state,'source');assert.equal(d.actorReview,undefined);assert.equal(d.result,undefined)
 assert.equal(d.protagonistIdentity!.referenceSha256,fixture.source.sha256)
 assert.notEqual(d.source.bytes,fixture.source.bytes)
 await assert.rejects(newProtagonistSource(fixture.source,{...fixture.source,sha256:'0'.repeat(64)}),/SPRITE_CORRUPT/)
})

test('changing identity observations clears the previous map acceptance and rejects mismatched references',async()=>{
 let current=await diagnosticActorDraft()
 current.protagonistIdentity=protagonistIdentity('a'.repeat(64),current.source.sha256)
 const repo={get:async()=>structuredClone(current),list:async()=>[structuredClone(current)],save:async(next:typeof current)=>{current=structuredClone(next)}}
 const observation={referenceSha256:'a'.repeat(64),checks:{silhouette:'pass',covering:'pass',costume:'pass',proportions:'pass'}} as const
 const next=await saveProtagonistIdentityReview(repo,current,observation)
 assert.equal(next.actorReview!.map,undefined)
 await assert.rejects(saveProtagonistIdentityReview(repo,current,{...observation,referenceSha256:'b'.repeat(64)}),/PROTAGONIST_IDENTITY_REVIEW_INVALID/)
})
