import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {originalEntry} from '../src/original-release'
import {originalReleasedPresentation} from '../server/original-presentation'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {handleApi} from '../worker/source'

test('full story is the cloud default, with explicit carriage and legacy/browser isolation',()=>{
 assert.equal(originalEntry('cloud','game.aiwaves.tech',''),true)
 assert.equal(originalEntry('cloud','127.0.0.1',''),true)
 assert.equal(originalEntry('cloud','game.aiwaves.tech','?story=carriage'),false)
 assert.equal(originalEntry('cloud','game.aiwaves.tech','?story_runtime=legacy&story=original'),false)
 assert.equal(originalEntry('cloud','yinxinghuan.github.io','?story=original'),false)
 assert.equal(originalEntry('pages','127.0.0.1','?story=original'),false)
 assert.equal(originalEntry('cloud-preflight','127.0.0.1',''),false)
 assert.equal(originalEntry('cloud-preflight','127.0.0.1','?story=original'),true)
})
test('released admission requires every room and cast, stable bindings, and legal action positions',()=>{
 const runtime=originalTrainRuntime(originalReleasedPresentation),h=runtime.initial('zh',randomUUID())
 assert.equal(originalReleasedPresentation(h),true)
 for(const scene of originalTrainChapterSpatialPlan().scenes.filter(s=>s.id!=='train-at-river-valley')){
  const broken=structuredClone(h);if(broken.assets?.version!==1)throw Error('TEST_ASSETS')
  delete broken.assets.backgrounds[scene.id]
  assert.throws(()=>originalReleasedPresentation(broken))
 }
 for(const id of ['ren-medic','lin-scout','mara-raider']as const){
  const broken=structuredClone(h);if(broken.assets?.version!==1)throw Error('TEST_ASSETS')
  delete broken.assets.standingCast![id];assert.throws(()=>originalReleasedPresentation(broken),/ORIGINAL_PRESENTATION_NOT_READY/)
 }
 const missingFan=structuredClone(h);if(missingFan.assets?.version!==1)throw Error('TEST_ASSETS')
 delete missingFan.assets.fixedEquipment;assert.throws(()=>originalReleasedPresentation(missingFan),/ORIGINAL_PRESENTATION_NOT_READY/)
 const old=structuredClone(h);delete old.assets;assert.throws(()=>originalReleasedPresentation(old),/ORIGINAL_PRESENTATION_NOT_READY/)
 assert.throws(()=>originalReleasedPresentation({...h,position:{x:110,y:150}}),/ORIGINAL_PRESENTATION_NOT_READY/)
 assert.throws(()=>originalReleasedPresentation(h,{...h,id:randomUUID()}),/ORIGINAL_PRESENTATION_NOT_READY/)
 assert.throws(()=>originalReleasedPresentation(h,old),/ORIGINAL_PRESENTATION_NOT_READY/)
})
test('production health truthfully advertises original admission and opt-in model capabilities',async()=>{
 const r=await handleApi(new Request('https://authority.invalid/api/original/health'),{})
 assert.equal(r.status,200);const h=await r.json() as any
 assert.equal(h.production,true);assert.equal(h.liveModelAvailable,true);assert.equal(h.liveDialogueAvailable,true)
 assert.equal((await handleApi(new Request('https://authority.invalid/api/original/sessions'),{})).status,503)
})
