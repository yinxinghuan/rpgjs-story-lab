import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {createHash,randomUUID} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {prepareSpritePixels} from '../src/sprite-preparation'
import {fixedStandingReleases} from '../src/original-art-identities'
import {originalStandingCast,assertOriginalAssetBindings} from '../src/original-asset-releases'
import {originalCharacterArtSlots,originalCharacterArtAnimation} from '../src/original-character-art'
import {originalCharacterBodies} from '../src/original-character-space'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalVisualContext} from '../server/original-visual-context'
import {environmentStoryRoute} from './environment-story-route'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
for(const [id,sha]of Object.entries({lin:'ef0812b156b9a7fb33cbab8c30b65c51a6ef008d0972f1181fd4302fa6d12cc5',mako:'c9dc59436248818e2755e26f58c7352f08b8ba620889e6cd5f285b5784f75b11'}))test(`${id}: immutable source, alpha and calibrated standing height`,()=>{
 const source=readFileSync(`doc/platform-art-candidates/20260912/${id}-standing-01/candidate.png`),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex'),raw=PNG.sync.read(source),a=fixedStandingReleases[`${id}-standing-v1` as 'lin-standing-v1'|'mako-standing-v1']
 assert.equal(hash(source),sha)
 const result=prepareSpritePixels({width:640,height:640,rgba:new Uint8ClampedArray(raw.data)},{columns:1,rows:1,cellWidth:640,cellHeight:640,foot:a.foot,kind:'actor',backgroundMode:'pale-neutral',neutralMin:200,chromaMax:20})
 const bytes=readFileSync('public/'+a.resource.path.slice(2)),png=PNG.sync.read(bytes)
 assert.equal(hash(bytes),a.resource.sha256);assert.equal(bytes.length,a.resource.bytes);assert.deepEqual(new Uint8Array(png.data),new Uint8Array(result.raster.rgba))
 assert.equal(png.data[3],0);assert.equal(a.capability,'front-standing-only');const height=(result.frames[0].sourceBox[3]-result.frames[0].sourceBox[1])*a.scale;assert.ok(height>=33&&height<=34)
})
for(const travel of [true,false])test(`cast bindings follow actual introduction and ${travel?'companionship':'staying behind'} through the full story`,async()=>{
 const runtime=originalTrainRuntime(()=>true),world=originalTrainChapterSpatialPlan();let h=runtime.initial('zh',randomUUID()),assets=structuredClone(h.assets)
 assert.deepEqual(originalStandingCast(assets),{'ren-medic':'ren-standing-v1','lin-scout':'lin-standing-v1','mara-raider':'mako-standing-v1'})
 const steps=environmentStoryRoute.map(a=>travel?a:({'pine-invite':'pine-stay','yard-invite':'yard-stay','pass-lin-watch':'pass-player-watch','pass-mako-duty':'pass-crew-duty'} as Record<string,string>)[a]??a)
 let linMet=false,makoMet=false
 for(const action of steps){
  const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;assert.ok(e,action)
  h=(await runtime.prepare(h,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action},()=>true)).head
  if(action==='pine-meet')linMet=true;if(action==='yard-meet')makoMet=true
  assert.deepEqual(h.assets,assets)
  const actors:Array<[string,boolean,string]>=[['lin-scout',linMet,'train-at-pine-line'],['mara-raider',makoMet,'train-at-graystone-yard']]
  for(const [id,met,home]of actors){
   const visible:boolean=met&&(travel||h.sceneId===home);assert.equal(originalCharacterArtAnimation(h.save,id,h.assets),visible?'stand':'hidden',action+':'+id)
   if(visible){const slot=originalCharacterArtSlots(h.sceneId,h.assets).find(s=>s.characterId===id)!,body=originalCharacterBodies(h).find(b=>b.id===id)!;assert.equal(slot.x,body.x+4.5);assert.equal(slot.y+1,body.y+15);assert.equal(originalVisualContext(h,id).speaker.representation,'reviewed-standing')}
  }
  assert.equal(originalCharacterArtAnimation(h.save,'ren-medic',h.assets),'hidden','Unvisited river doctor must stay hidden')
 }
 assert.equal(h.save.finale.status,'ready');assert.deepEqual(runtime.upgrade(h),h)
 const old=structuredClone(h);(old.assets as any).standingCast={'ren-medic':'ren-standing-v1'};assertOriginalAssetBindings(old.assets);assert.deepEqual(runtime.upgrade(old),old)
 assert.equal(originalCharacterArtAnimation(old.save,'lin-scout',old.assets),'hidden')
 assert.equal(originalCharacterArtSlots(old.sceneId,old.assets).some(s=>s.characterId==='lin-scout'),false)
 for(const standingCast of [{'ren-medic':'lin-standing-v1'},{'lin-scout':'mako-standing-v1'},{'mara-raider':'ren-standing-v1'}])assert.throws(()=>assertOriginalAssetBindings({...old.assets,standingCast}),/UNSUPPORTED/)
})
