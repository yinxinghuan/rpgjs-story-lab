import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,mkdtempSync,rmSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomUUID} from 'node:crypto'
import {createServer} from 'node:http'
import {PreflightStorage} from '../server/preflight-storage'
import {CreatorSpriteArchive} from '../server/creator-sprites'
import {CarriageJourneyAuthority,createHandler} from '../worker/source'
import {creatorCloudTransport} from '../src/creator-cloud'
import {SpriteCloudArchive} from '../src/sprite-cloud'
import {spriteManifest,assertSpriteManifest,restoreSpriteManifest,spritePartText,SPRITE_ARCHIVE_PART,spriteArchiveBodyLimit} from '../src/sprite-archive-contract'
import {inspectSpritePng,newSpriteSource,verifySpriteComposition,type SpriteDraft,type SpritePng} from '../src/sprite-draft'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
import {composeRepairFrames} from '../src/sprite-composition'
import {inspectDeviceMapCandidate} from '../src/device-map-candidate'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
const inputs=await Promise.all(['starter-edit-02','starter-repair-03'].map(async(name,i)=>({source:await inspectSpritePng(new Uint8Array(readFileSync(new URL('../doc/platform-art-candidates/20260911/'+name+'/candidate.png',import.meta.url)))),sourceName:name,columns:i===0?3:1,column:i===0?1:0})))
const raster=composeRepairFrames(await Promise.all(inputs.map(async i=>({raster:await decode(i.source),columns:i.columns,column:i.column}))))
const spec={kind:'states' as const,columns:2,rows:1,cellWidth:320,cellHeight:640,foot:{x:160,y:544},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20,sourceAnchors:[{x:173,y:463},{x:173,y:468}]}
const prepared=prepareSpritePixels(raster,spec)
const base:SpriteDraft={...newSpriteSource(await encode(raster),'两张平台原图组合','states'),deviceStateSet:'repair',composition:{version:1,inputs},spec,state:'candidate',result:{algorithm:'neutral-matte-unmix-1',png:await encode(prepared.raster),frames:prepared.frames,metrics:prepared.metrics}}
const draft=()=>({...structuredClone(base),id:randomUUID()})
test('twelve-frame actor archive fits the same bounded manifest without declaring its directions approved',async()=>{
 const source=await inspectSpritePng(new Uint8Array(readFileSync(new URL('../doc/platform-art-candidates/20260911/actor-edit-03/candidate.png',import.meta.url))))
 const spec={kind:'actor' as const,columns:3,rows:4,cellWidth:320,cellHeight:320,foot:{x:160,y:300},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
 const p=prepareSpritePixels(await decode(source),spec),d:SpriteDraft={...newSpriteSource(source,'阿达候选：方向未通过','actor'),spec,state:'candidate',result:{algorithm:'neutral-matte-unmix-1',png:await encode(p.raster),frames:p.frames,metrics:p.metrics}}
 d.generation={version:1,recipe:'ada-walk-v1',requestId:crypto.randomUUID(),sessionId:'cb90357b-fe01-48ab-b14b-0620eb0d556e',taskId:'synthetic-archive-provenance'}
 const {manifest,payload}=spriteManifest(d);assert.equal(manifest.files.length,2);assert.equal(manifest.draft.result.frames.length,12);assert.ok(Buffer.byteLength(JSON.stringify(manifest))<6000)
 assert.deepEqual(await restoreSpriteManifest(manifest,async f=>payload.get(f.role)!.bytes),d)
 assert.equal('visualApproved' in manifest.draft,false)
 const invalid=structuredClone(manifest);invalid.draft.generation.taskId='../../private';assert.throws(()=>assertSpriteManifest(invalid),/SPRITE_GENERATION_INVALID/)
})
function fixture(){const dir=mkdtempSync(join(tmpdir(),'sprite-cloud-')),pool=new PreflightStorage(dir)
 const db=()=>{const ctx=pool.context('synthetic-sprite');return {all:<T>(s:string,...b:any[])=>ctx.storage.sql.exec(s,...b).toArray() as T[],run:(s:string,...b:any[])=>{ctx.storage.sql.exec(s,...b)},transaction:<T>(w:()=>T)=>ctx.storage.transactionSync(w)}}
 let archive=new CreatorSpriteArchive(db());return {get archive(){return archive},db,restart:()=>{pool.close();archive=new CreatorSpriteArchive(db())},close:()=>{pool.close();rmSync(dir,{recursive:true,force:true})}}
}
function upload(archive:CreatorSpriteArchive,d:SpriteDraft,owner='alice'){
 const {manifest,payload}=spriteManifest(d);archive.begin(owner,manifest)
 for(const f of manifest.files){const bytes=payload.get(f.role)!.bytes;for(let offset=0,part=0;offset<bytes.length;offset+=SPRITE_ARCHIVE_PART,part++)archive.part(owner,d.id,{role:f.role,part,data:spritePartText(bytes.subarray(offset,offset+SPRITE_ARCHIVE_PART))})}
 return manifest
}
test('real platform repair art retains all source PNGs, selections and foot alignment after archive restoration',async()=>{
 const f=fixture();try{const d=draft();d.composition!.inputs.forEach((i,n)=>i.generation={version:1,recipe:n===0?'starter-broken-v1':'starter-repaired-v1',requestId:crypto.randomUUID(),sessionId:'cb90357b-fe01-48ab-b14b-0620eb0d556e',taskId:'synthetic-composition-'+n});const m=upload(f.archive,d);assertSpriteManifest(m);assert.equal(m.files.length,4);assert.ok(Buffer.byteLength(JSON.stringify(m))<6000)
  await assert.rejects(f.archive.file('alice',d.id,'source'),/NOT_READY/)
  const ready=await f.archive.finish('alice',d.id);f.restart();assert.deepEqual(f.archive.get('alice',d.id),ready)
  const restored=await restoreSpriteManifest(m,file=>f.archive.file('alice',d.id,file.role));assert.deepEqual(restored,d);await verifySpriteComposition(restored,decode)
  assert.deepEqual((await inspectDeviceMapCandidate(restored,d.id,decode)).states,['broken','repaired'])
  assert.deepEqual(f.archive.list('bob'),[]);await assert.rejects(f.archive.file('bob',d.id,'candidate'),/NOT_FOUND/)
  assert.throws(()=>f.archive.cancel('alice',d.id),/ALREADY_READY/);assert.deepEqual(await f.archive.finish('alice',d.id),ready)
  const changed=structuredClone(m);changed.draft.sourceName='changed';assert.throws(()=>f.archive.begin('alice',changed),/CONFLICT/)
 }finally{f.close()}
})
test('incomplete or changed chunks never become ready; interrupted records can be discarded without altering originals',async()=>{
 const f=fixture();try{const d=draft(),{manifest,payload}=spriteManifest(d);f.archive.begin('alice',manifest)
  const bytes=payload.get('source')!.bytes.subarray(0,SPRITE_ARCHIVE_PART),part={role:'source',part:0,data:spritePartText(bytes)}
  f.archive.part('alice',d.id,part);f.restart();assert.deepEqual(f.archive.progress('alice',d.id).parts.map(p=>({...p})),[{role:'source',part:0}]);f.archive.part('alice',d.id,part)
  await assert.rejects(f.archive.finish('alice',d.id),/INCOMPLETE/)
  const wrong=bytes.slice();wrong[45]^=1;assert.throws(()=>f.archive.part('alice',d.id,{...part,data:spritePartText(wrong)}),/CONFLICT/)
  assert.throws(()=>f.archive.part('alice',d.id,{...part,data:'!'}),/PART_INVALID/)
  f.archive.cancel('alice',d.id);assert.deepEqual(f.db().all('SELECT * FROM creator_sprite_parts'),[])
  upload(f.archive,d);f.db().run('UPDATE creator_sprite_parts SET data=? WHERE owner=? AND id=? AND role=? AND part=0',wrong.buffer,'alice',d.id,'source')
  await assert.rejects(f.archive.finish('alice',d.id),/CORRUPT/);assert.equal(f.archive.get('alice',d.id).state,'uploading')
 }finally{f.close()}
})
test('metadata and quota bound retained uploads, with no embedded binaries or arbitrary fields',()=>{
 const f=fixture();try{const {manifest}=spriteManifest(draft())
  for(const change of [(m:any)=>m.files[0].bytes=25*1024*1024,(m:any)=>m.draft.composition.inputs[0].column=3,(m:any)=>m.draft.spec.sourceAnchors[0].x=0,(m:any)=>m.draft.result.png={bytes:[1]},(m:any)=>m.draft.url='https://example.com/private']){const m=structuredClone(manifest);change(m);assert.throws(()=>assertSpriteManifest(m),/INVALID/)}
  for(let i=0;i<6;i++)f.archive.begin('alice',spriteManifest(draft()).manifest)
  assert.throws(()=>f.archive.begin('alice',manifest),/LIMIT/);const old=f.archive.list('alice')[0];f.archive.cancel('alice',old.manifest.id);f.archive.begin('alice',manifest);assert.equal(f.archive.list('alice').length,6)
  assert.equal(spriteArchiveBodyLimit('/api/creator/sprites/'+manifest.id+'/parts'),70000);assert.equal(spriteArchiveBodyLimit('/api/original/sessions'),6000)
 }finally{f.close()}
})
class Memory implements Storage{values=new Map<string,string>();get length(){return this.values.size}key(i:number){return [...this.values.keys()][i]??null}getItem(k:string){return this.values.get(k)??null}setItem(k:string,v:string){this.values.set(k,v)}removeItem(k:string){this.values.delete(k)}clear(){this.values.clear()}}
test('actual HTTP resumes a lost chunk response after authority restart and rejects unauthenticated PNG access',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'sprite-cloud-http-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>();let lose=true,partZero=0
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key));objects.set(key,o)}return o.fetch(r)}})}}
 const handler=createHandler(true,false,false,undefined,undefined,true)
 const server=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const body=Buffer.concat(chunks),r=await handler(new Request('http://localhost'+req.url,{method:req.method,headers,body:req.method==='GET'?undefined:body}),env)
  if(req.method==='POST'&&req.url?.endsWith('/parts')){const p=JSON.parse(body.toString());if(p.role==='source'&&p.part===0)partZero++;if(lose&&r.ok){lose=false;res.destroy();return}}
  res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))
 }catch{res.writeHead(500);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 try{const base='http://127.0.0.1:'+(server.address() as any).port,storage=new Memory(),lock=async<T>(_n:string,w:()=>Promise<T>)=>w(),make=(s=storage)=>new SpriteCloudArchive(creatorCloudTransport(s,lock,fetch,base)),d=draft()
  await assert.rejects(make().save(d));assert.equal(partZero,1);objects.clear();pool.close()
  const ready=await make().save(d);assert.equal(partZero,1);assert.equal(ready.state,'ready');assert.deepEqual(await make().restore(ready),d)
  assert.deepEqual(await make(new Memory()).list(),[]);assert.equal((await make().list()).length,1)
  assert.equal((await fetch(base+'/api/creator/sprites/'+d.id+'/file/candidate')).status,401)
  assert.equal((await fetch(base+'/api/creator/sprites')).status,401)
  assert.equal((await createHandler(true)(new Request(base+'/api/creator/sprites'),env)).status,404)
 }finally{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}
})
