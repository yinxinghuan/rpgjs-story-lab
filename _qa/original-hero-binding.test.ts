import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomUUID} from 'node:crypto'
import {originalHeroRelease,ORIGINAL_HERO_V2} from '../src/original-hero-release'
import {originalHeroVersion,newOriginalAssetBindings,assertOriginalAssetBindings} from '../src/original-asset-releases'
import {originalHeroSheet} from '../src/original-hero-sheet'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalReleasedPresentation} from '../server/original-presentation'
import {originalGameEntities} from '../src/original-game-projection'
import {originalVisualContext} from '../server/original-visual-context'
import {actorArt} from '../src/art-catalog'

test('bound protagonist metadata hashes the actual B PNG and preserves the existing four-direction crop/anchor geometry',()=>{
 const h=newOriginalAssetBindings(),r=originalHeroRelease(originalHeroVersion(h)),bytes=readFileSync('public/'+r.resource.path.slice(2))
 assert.equal(createHash('sha256').update(bytes).digest('hex'),r.resource.sha256);assert.equal(bytes.length,r.resource.bytes)
 assert.equal(r.resource.width,bytes.readUInt32BE(16));assert.equal(r.resource.height,bytes.readUInt32BE(20))
 assert.deepEqual(r.centers,actorArt.balanced.hero.centers);assert.deepEqual(r.baselines,actorArt.balanced.hero.baselines);assert.equal(r.scale,actorArt.balanced.hero.scale)
 const sheet=originalHeroSheet('blob:verified',h)
 for(const [row,direction]of ['down','left','right','up'].entries())for(const [pose,column]of [['stand',1],['stride-0',0],['stride-1',1],['stride-2',2]]as const){
  const frame=sheet.textures[pose].animations({direction:direction as any})[0][0]
  assert.equal(frame.frameY,row);assert.equal(frame.frameX,column);assert.deepEqual(frame.anchor,[.5,330/362]);assert.deepEqual(frame.scale,[.14,.14]);assert.equal(frame.x,4.5);assert.equal(frame.y,15)
 }
 assert.equal(sheet.image,'blob:verified')
})
test('old unbound journeys retain the fixed B fallback without being rewritten; new journeys persist an explicit version',async()=>{
 const runtime=originalTrainRuntime(originalReleasedPresentation),current=runtime.initial('zh',randomUUID()),legacy=structuredClone(current)
 assert.equal((current.assets as any).hero,ORIGINAL_HERO_V2);delete (legacy.assets as any).hero
 const snapshot=structuredClone(legacy),upgraded=runtime.upgrade(legacy)
 assert.deepEqual(legacy,snapshot);assert.equal(Object.hasOwn(upgraded.assets!,'hero'),false);assert.equal(originalHeroVersion(upgraded.assets),ORIGINAL_HERO_V2)
 const e=originalGameEntities(upgraded).find(e=>e.actions.some(a=>a.id==='repair-starter'))!
 const result=await runtime.prepare(upgraded,{action_id:randomUUID(),expected_version:0,sceneId:upgraded.sceneId,target:e.id,position:e.approach,type:'action',action:'repair-starter'},()=>true)
 assert.equal(result.head.version,1);assert.equal(Object.hasOwn(result.head.assets!,'hero'),false);assert.equal(originalHeroVersion(result.head.assets),ORIGINAL_HERO_V2)
})
test('unknown hero versions are rejected and caller mutation cannot change the registered image or model appearance',()=>{
 const assets=newOriginalAssetBindings(),before=originalHeroRelease();assert.throws(()=>assertOriginalAssetBindings({...assets,hero:'unreviewed-future-avatar'}),/HERO_VERSION_UNSUPPORTED/)
 const copy=originalHeroRelease();copy.resource.path='https://example.invalid/changed.png';copy.appearance.outerwear='red coat';copy.centers[0][0]=0
 assert.deepEqual(originalHeroRelease(),before)
 const h=originalTrainRuntime(originalReleasedPresentation).initial('en',randomUUID()),context=originalVisualContext(h,'ada-mechanic')
 assert.equal(context.protagonist.assetVersion,ORIGINAL_HERO_V2);assert.equal(context.protagonist.assetSha256,before.resource.sha256);assert.deepEqual(context.protagonist.appearance,before.appearance)
 assert.notDeepEqual(context.protagonist.appearance,context.speaker.appearance)
})
