import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID,createHash} from 'node:crypto'
import {DatabaseSync} from 'node:sqlite'
import {originalTrainRuntime,assertOriginalHead,OriginalTrainAuthority} from '../server/original-train-runtime'
import {assertOriginalClientHead} from '../src/original-session-client'
import {originalStoryPreviewDefinition,originalReleasedBackgroundBytes} from '../server/original-scene-preview'
import {originalBoundSceneResources,originalBackgroundVersion,originalBackgroundReleases,currentOriginalBackgrounds,newOriginalAssetBindings,ORIGINAL_BACKGROUND_BASELINE,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
import {loadBrowserSceneResource} from '../src/scene-readiness'
import type {AuthorityStorage} from '../server/session-authority'

test('registered background bytes retain their reviewed digest and source identity',()=>{
 for(const {release,data} of originalReleasedBackgroundBytes()){
  assert.equal(createHash('sha256').update(data).digest('hex'),release.sha256)
  assert.equal(data.byteLength,release.bytes)
 }
 assert.equal(originalBackgroundReleases[ORIGINAL_BACKGROUND_PLATFORM].source,'alteru-media')
 assert.equal(originalBackgroundReleases[ORIGINAL_BACKGROUND_PLATFORM].taskId,'mt_1a1c4492493eaf68a32331d43d91c207')
})
test('new journeys bind the reviewed platform version; old journeys keep baseline through upgrade and actions',async()=>{
 const r=originalTrainRuntime(()=>true),current=r.initial('zh',randomUUID()),legacy=structuredClone(current);delete legacy.assets
 assert.equal(originalBackgroundVersion(current.assets),ORIGINAL_BACKGROUND_PLATFORM)
 const upgraded=r.upgrade(legacy);assert.deepEqual(upgraded,legacy)
 for(const h of [current,upgraded]){
  assertOriginalClientHead(h)
  const result=await r.prepare(h,{action_id:randomUUID(),expected_version:0,sceneId:h.sceneId,position:{x:110,y:185},target:'starter',type:'action',action:'repair-starter'},()=>true)
  assert.deepEqual(result.head.assets,h.assets)
  assert.equal(originalBackgroundVersion(result.head.assets),h===current?ORIGINAL_BACKGROUND_PLATFORM:ORIGINAL_BACKGROUND_BASELINE)
 }
})
test('snapshot binding selects only the background and preserves collision maps and other rooms',()=>{
 const base=originalStoryPreviewDefinition(),before=JSON.stringify(base)
 const old=originalBoundSceneResources(base),next=originalBoundSceneResources(base,newOriginalAssetBindings()),id='train-at-dead-station'
 assert.equal(old.scenes[id].assets.find(a=>a.kind==='background')!.sha256,originalBackgroundReleases[ORIGINAL_BACKGROUND_BASELINE].sha256)
 assert.equal(next.scenes[id].assets.find(a=>a.kind==='background')!.sha256,originalBackgroundReleases[ORIGINAL_BACKGROUND_PLATFORM].sha256)
 assert.deepEqual(old.scenes[id].assets.filter(a=>a.kind==='map'),next.scenes[id].assets.filter(a=>a.kind==='map'))
 for(const scene of Object.keys(base.scenes))if(scene!==id){assert.deepEqual(old.scenes[scene],base.scenes[scene]);const bound=currentOriginalBackgrounds[scene];if(bound)assert.equal(next.scenes[scene].assets.find(a=>a.kind==='background')!.sha256,originalBackgroundReleases[bound].sha256);else assert.deepEqual(next.scenes[scene],base.scenes[scene])}
 assert.equal(JSON.stringify(base),before)
})
test('unsupported or forged bindings are rejected on both sides instead of selecting a fallback',()=>{
 const h=originalTrainRuntime(()=>true).initial('en',randomUUID())
 for(const assets of [null,{version:2,backgrounds:{}},{version:1,backgrounds:{}},{version:1,backgrounds:{'train-at-river-valley':ORIGINAL_BACKGROUND_PLATFORM}},{version:1,backgrounds:{'train-at-dead-station':'https://untrusted.invalid/image.png'}},{version:1,backgrounds:{'train-at-dead-station':'__proto__'}}]){
  const bad={...h,assets};assert.throws(()=>assertOriginalHead(bad),/ORIGINAL_ASSET_VERSION_UNSUPPORTED/);assert.throws(()=>assertOriginalClientHead(bad),/ORIGINAL_ASSET_VERSION_UNSUPPORTED/)
 }
})
test('a bad response for the bound platform asset fails checksum validation without trying baseline',async()=>{
 const resource=originalBackgroundReleases[ORIGINAL_BACKGROUND_PLATFORM],requested:string[]=[]
 await assert.rejects(loadBrowserSceneResource(resource,new AbortController().signal,'http://127.0.0.1:5316/',async input=>{requested.push(String(input));return new Response(new Uint8Array(resource.bytes))}),/RESOURCE_VERSION/)
 assert.equal(requested.length,1);assert.ok(requested[0].includes('north-cape-8fc11a96.png'))
})
test('asset binding survives SQLite authority recreation and replay while legacy rows remain unpinned',async()=>{
 const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 try{
  const owner='synthetic-art-version',s=new OriginalTrainAuthority(db,()=>true),h=s.create(owner,randomUUID(),'en')
  const body={action_id:randomUUID(),expected_version:0,sceneId:h.sceneId,position:{x:110,y:185},target:'starter',type:'action',action:'repair-starter'}
  const result=await s.action(owner,h.id,body),reopened=new OriginalTrainAuthority(db,()=>true)
  assert.deepEqual(reopened.get(owner,h.id).assets,h.assets);assert.deepEqual(await reopened.action(owner,h.id,body),result)
  const old=s.create(owner,randomUUID(),'en');delete old.assets;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),old.id)
  assert.deepEqual(reopened.get(owner,old.id),old);assert.equal(originalBackgroundVersion(old.assets),ORIGINAL_BACKGROUND_BASELINE)
 }finally{raw.close()}
})
