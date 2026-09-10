import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,mkdirSync,copyFileSync,readFileSync,writeFileSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {randomUUID} from 'node:crypto'
import 'fake-indexeddb/auto'
import {sceneResourceManifest} from '../server/scene-resource-manifest'
import {SceneReadiness,loadBrowserSceneResource} from '../src/scene-readiness'
import {prepareSceneAction} from '../src/prepare-scene-action'
import {initialStory} from '../src/story'
import {SessionClient} from '../src/session-client'
import {BrowserJourney} from '../src/browser-journey'
import {actionTarget,currentScene} from '../src/contract'
import {approachPoints} from '../src/scene-layout'

const manifest=sceneResourceManifest()
test('actual scene inventory rejects missing resources and collision drift at build time',()=>{
 assert.deepEqual(Object.keys(manifest.scenes),['carriage','baggage','cab','walkway'])
 const root=mkdtempSync(tmpdir()+'/carriage-resource-')
 try{
  for(const spec of Object.values(manifest.scenes))for(const resource of spec.assets){const path='/public/'+resource.path.slice(2);mkdirSync(root+path.slice(0,path.lastIndexOf('/')),{recursive:true});copyFileSync(process.cwd()+path,root+path)}
  assert.deepEqual(sceneResourceManifest(root),manifest)
  const path=root+'/public/map/walkway.tmx';writeFileSync(path,readFileSync(path,'utf8').replace('x="0"','x="1"'))
  assert.throws(()=>sceneResourceManifest(root),/SCENE_COLLISION_SOURCE_MISMATCH:walkway/)
  rmSync(path);assert.throws(()=>sceneResourceManifest(root),/ENOENT/)
 }finally{rmSync(root,{recursive:true,force:true})}
})
test('load only requested scene, coalesce clicks, reuse validation, and reject premature activation',async()=>{
 const loads:string[]=[],r=new SceneReadiness(manifest,async resource=>{loads.push(resource.path);return resource.kind==='background'?'blob:prepared':undefined})
 assert.throws(()=>r.activate('carriage'),/NOT_VALIDATED/)
 const first=r.prepare('carriage');assert.equal(r.prepare('carriage'),first);await first
 r.activate('carriage');await r.prepare('carriage',true)
 assert.equal(loads.length,2);assert.equal(r.status('carriage').state,'active');assert.equal(r.status('walkway').attempts,0)
 assert.equal(loads[0],'./map/carriage.tmx') // Validate map before allocating a background object URL.
 await assert.rejects(r.prepare('dining-car'),/UNREGISTERED_SCENE/)
})
test('failed future scene keeps current background and requires explicit retry',async()=>{
 let fail=true;const r=new SceneReadiness(manifest,async resource=>{if(resource.path.includes('walkway')&&fail)throw Error('OFFLINE');return resource.kind==='background'?'blob:'+resource.path:undefined})
 await r.prepare('carriage');r.activate('carriage');await assert.rejects(r.prepare('walkway'))
 assert.equal(r.status('carriage').state,'active');assert.ok(r.background('carriage'));assert.equal(r.background('walkway'),undefined)
 fail=false;await assert.rejects(r.prepare('walkway'));assert.equal(r.status('walkway').attempts,1)
 await r.prepare('walkway',true);assert.equal(r.status('walkway').attempts,2);assert.equal(r.status('walkway').state,'validated')
})
test('failed preparation preserves safe resource diagnosis without exposing arbitrary error text',async()=>{
 for(const reason of ['RESOURCE_HTTP','RESOURCE_SIZE','RESOURCE_VERSION','RESOURCE_DECODE','private transport details']){
  const r=new SceneReadiness(manifest,async()=>{throw Error(reason)})
  await assert.rejects(r.prepare('carriage'))
  assert.equal(r.status('carriage').reason,reason==='private transport details'?'RESOURCE_UNAVAILABLE':reason)
  assert.equal(r.background('carriage'),undefined);assert.throws(()=>r.activate('carriage'))
 }
})
test('timeout cannot be activated by a late loader completion',async()=>{
 let release!:()=>void;const r=new SceneReadiness(manifest,async resource=>{await new Promise<void>(resolve=>{release=resolve});return resource.kind==='background'?'blob:late':undefined},15)
 await assert.rejects(r.prepare('carriage'),/TIMEOUT/);release();await new Promise(resolve=>setTimeout(resolve,0))
 assert.equal(r.status('carriage').state,'failed');assert.equal(r.background('carriage'),undefined);assert.throws(()=>r.activate('carriage'))
})
class MemoryStorage implements Storage{private data=new Map<string,string>();get length(){return this.data.size}key(i:number){return [...this.data.keys()][i]??null}clear(){this.data.clear()}getItem(k:string){return this.data.get(k)??null}setItem(k:string,v:string){this.data.set(k,String(v))}removeItem(k:string){this.data.delete(k)}}
test('unready portal never creates pending action or changes actual browser save; retry commits once',async()=>{
 const storage=new MemoryStorage(),store=new BrowserJourney(randomUUID());let submitted=0
 const client=new SessionClient(storage,'scene-test-',async(p,b)=>{if(p.endsWith('/actions'))submitted++;return store.api(p,b)})
 try{
  let h=await client.enroll('zh')
  for(const action of ['open-cabinet','take-fuse','meet-lin','repair']){const target=actionTarget[action];h=(await client.send(h,{target,position:approachPoints[target],type:'action',action})).head}
  let fail=true;const r=new SceneReadiness(manifest,async resource=>{if(fail)throw Error('OFFLINE');return resource.kind==='background'?'blob:ready':undefined})
  const before=structuredClone(h),calls=submitted
  const attempt=async(retry=false)=>{await prepareSceneAction(r,h.save,'exit','leave',retry);return client.send(h,{target:'exit',position:approachPoints.exit,type:'action',action:'leave'})}
  await assert.rejects(attempt());assert.equal(submitted,calls);assert.equal(client.hasPending(),false);assert.deepEqual(await store.get(h.id),before)
  fail=false;await assert.rejects(attempt());assert.equal(submitted,calls)
  const response=await attempt(true);assert.equal(response.accepted,true);assert.equal(currentScene(response.head.save),'baggage');assert.equal(response.head.version,before.version+1);assert.equal(client.hasPending(),false)
  assert.deepEqual(response.head.save.inventory,before.save.inventory)
  // Restoring this authority result prepares the committed destination, never repeats the portal.
  const restored=await client.recover();await r.prepare(currentScene(restored.head.save));assert.equal(submitted,calls+1)
 }finally{await store.close()}
})
test('blocked and nonportal actions need no future art; free portal input prepares admitted destinations',async()=>{
 const loads:string[]=[],r=new SceneReadiness(manifest,async resource=>{loads.push(resource.path);return resource.kind==='background'?'blob:ready':undefined}),save=initialStory('en')
 await prepareSceneAction(r,save,'exit','leave');await prepareSceneAction(r,save,'cabinet');assert.equal(loads.length,0)
 save.facts.repaired=true
 await prepareSceneAction(r,save,'exit');assert.ok(loads.includes('./map/baggage.tmx'));assert.equal(r.status('walkway').attempts,0)
})

test('runtime validates bytes and digest under an arbitrary deployment subpath',async()=>{
 const resource=manifest.scenes.walkway.assets.find(r=>r.kind==='map')!,bytes=readFileSync('public/'+resource.path.slice(2)),signal=new AbortController().signal
 let url='';const load=(data:Uint8Array,status=200)=>loadBrowserSceneResource(resource,signal,'https://example.test/new-session/',async(input,init)=>{url=String(input);assert.equal(init?.credentials,'omit');return new Response(new Uint8Array(data),{status})})
 await load(bytes);assert.equal(new URL(url).pathname,'/new-session/map/walkway.tmx');assert.equal(new URL(url).searchParams.get('scene_asset'),resource.sha256)
 const altered=Buffer.from(bytes);altered[100]^=1;await assert.rejects(load(altered),/RESOURCE_VERSION/)
 await assert.rejects(load(bytes.subarray(1)),/RESOURCE_SIZE/);await assert.rejects(load(bytes,503),/RESOURCE_HTTP/)
})
