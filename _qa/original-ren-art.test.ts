import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomUUID} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {fixedStandingReleases} from '../src/original-art-identities'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {assertOriginalAssetBindings,newOriginalAssetBindings,originalStandingCast} from '../src/original-asset-releases'
import {originalCharacterArtAnimation,originalCharacterArtSlots} from '../src/original-character-art'
import {originalCharacterBodies} from '../src/original-character-space'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalVisualContext} from '../server/original-visual-context'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
test('Ren standing pixels reproduce authorized matte removal and foot alignment without repainting',()=>{
 const source=readFileSync('doc/platform-art-candidates/20260912/ren-standing-02/candidate.png'),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex'),raw=PNG.sync.read(source),a=fixedStandingReleases['ren-standing-v1']
 assert.equal(hash(source),'db7701d7cda3510a6500242abb9bafd719d3ac5b7f252d096b94e9a79d4eb4d5')
 const result=prepareSpritePixels({width:640,height:640,rgba:new Uint8ClampedArray(raw.data)},{columns:1,rows:1,cellWidth:640,cellHeight:640,foot:a.foot,kind:'actor',backgroundMode:'pale-neutral',neutralMin:200,chromaMax:20})
 const bytes=readFileSync('public/'+a.resource.path.slice(2)),output=PNG.sync.read(bytes)
 assert.equal(hash(bytes),a.resource.sha256);assert.equal(bytes.length,a.resource.bytes);assert.deepEqual(new Uint8Array(output.data),new Uint8Array(result.raster.rgba))
 assert.equal(output.data[3],0);assert.equal(a.capability,'front-standing-only');assert.ok((result.frames[0].sourceBox[3]-result.frames[0].sourceBox[1])*a.scale<34)
})
test('fixed cast is explicit and immutable across old and published asset wrappers; unknown identities reject',()=>{
 const a=newOriginalAssetBindings();assert.equal(originalStandingCast(a)['ren-medic'],'ren-standing-v1')
 const old={version:1 as const,backgrounds:{...(a as any).backgrounds}};assertOriginalAssetBindings(old);assert.deepEqual(originalStandingCast(old),{})
 assert.equal(originalCharacterArtSlots('train-at-river-valley',old).some(s=>s.characterId==='ren-medic'),false)
 for(const standingCast of [null,[],{'ren-medic':'missing'},{'ada-mechanic':'ren-standing-v1'},{'ren-medic':'__proto__'}])assert.throws(()=>assertOriginalAssetBindings({...old,standingCast}),/UNSUPPORTED/)
})
test('Ren appears only after actual river rescue, shares collision feet and persists into the tunnel',async()=>{
 const runtime=originalTrainRuntime(()=>true),world=originalTrainChapterSpatialPlan();let h=runtime.initial('zh',randomUUID()),assets=structuredClone(h.assets)
 assert.equal(originalCharacterArtAnimation(h.save,'ren-medic',h.assets),'hidden')
 for(const action of ['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart']){
  const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!
  h=(await runtime.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action},()=>true)).head
  assert.deepEqual(h.assets,assets)
  assert.equal(originalCharacterArtAnimation(h.save,'ren-medic',h.assets),h.version>=4?'stand':'hidden')
  if(h.version>=4){const s=originalCharacterArtSlots(h.sceneId,h.assets).find(s=>s.characterId==='ren-medic')!,b=originalCharacterBodies(h).find(b=>b.id==='ren-medic')!;assert.equal(s.x,b.x+4.5);assert.equal(s.y+1,b.y+15);assert.equal(originalVisualContext(h,'ren-medic').speaker.assetSha256,fixedStandingReleases['ren-standing-v1'].resource.sha256)}
 }
 assert.equal(h.sceneId,'train-at-tunnel');assert.deepEqual(runtime.upgrade(h),h)
 const legacy=structuredClone(h);delete (legacy.assets as any).standingCast
 assert.equal(originalVisualContext(legacy,'ren-medic').speaker.representation,'development-marker')
 assert.deepEqual(runtime.upgrade(legacy),legacy)
 h.save.characters.find(c=>c.id==='ren-medic')!.status='departed';h.save.partyMemberIds=h.save.partyMemberIds.filter(id=>id!=='ren-medic')
 assert.equal(originalCharacterArtAnimation(h.save,'ren-medic',h.assets),'hidden')
})
