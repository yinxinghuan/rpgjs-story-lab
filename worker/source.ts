import {ORIGINAL_STORY_RELEASED} from '../src/original-release'
import {originalReleasedPresentation} from '../server/original-presentation'
import {createOriginalActionInterpreter} from '../server/original-action-interpreter'
import {createOriginalDialogueGenerator} from '../server/original-dialogue'
import {CreatorLayerArchive} from '../server/creator-layers'
import {assertPublishedLayer,layerReleaseId} from '../src/layered-archive-contract'
import {assertPublishedActor,actorReleaseId} from '../src/actor-publication'
import {assertPublishedDevice,deviceReleaseId} from '../src/device-publication'
import {CreatorSpriteArchive} from '../server/creator-sprites'
import {spriteArchiveBodyLimit} from '../src/sprite-archive-contract'
import {OriginalTrainAuthority,originalPresentationUnavailable,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {OriginalActionInterpreter} from '../server/original-action-interpreter'
import type {OriginalDialogueGenerator} from '../server/original-dialogue'
import {originalJson,handleOriginalSession} from '../server/original-http'
import {ORIGINAL_API_PATH,ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from '../src/original-runtime-contract'
import {createJournalImageProducer,readJournalImageAsset,type ImageProducer} from '../server/journal-image'
import {JOURNAL_IMAGE_RELEASED} from '../src/journal-image-release'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {LabError} from '../src/journey-runtime'
import {propose,chatModel,type ModelRequest} from '../server/model'
import {RUNTIME_CONTRACT,RUNTIME_HEADER,RELEASE_ID} from '../src/runtime-contract'
import {CreatorArtArchive,type ArtArchiveSource} from '../server/creator-art'
import {CREATOR_API_PATH,CREATOR_RUNTIME_HEADER,CREATOR_RUNTIME_CONTRACT} from '../src/creator-contract'
import {assertPublishedBackground,backgroundReleaseId} from '../src/background-publication'
// Runtime capability; players opt in separately through an explicit live envelope.
export const ONLINE_NARRATION_AVAILABLE=true
// User approved this bounded new-journey capability trial on 2026-09-10.
export const PRODUCTION_WRITES_ENABLED=true
interface Namespace{ idFromName(name:string):unknown;get(id:unknown):{fetch(request:Request):Promise<Response>} }
interface Environment{CARRIAGE_JOURNEYS?:Namespace}
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT}})
async function body(request:Request,limit=6000){
 const reader=request.body?.getReader();if(!reader)return {}
 let size=0;const chunks:Uint8Array[]=[]
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>limit){await reader.cancel();throw new LabError('BODY_TOO_LARGE',413)}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();return value}catch{throw new LabError('INVALID_JSON')}
}
const failure=(e:unknown)=>json({error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'},e instanceof LabError?e.status:503)
export function createHandler(writesEnabled:boolean,imageEnabled=JOURNAL_IMAGE_RELEASED,originalEnabled=false,originalDialogueAvailable:()=>boolean=()=>false,originalActionAvailable:()=>boolean=()=>false,creatorEnabled=false,originalProduction=false){return async(request:Request,env:Environment)=>{
 const path=new URL(request.url).pathname
 const creator=path===CREATOR_API_PATH||path.startsWith(CREATOR_API_PATH+'/')
 const creatorJson=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
 const original=path===ORIGINAL_API_PATH||path.startsWith(ORIGINAL_API_PATH+'/'),reply=creator?creatorJson:original?originalJson:json
 if(creator&&!creatorEnabled)return reply({error:'NOT_FOUND'},404)
 if(creator&&path===CREATOR_API_PATH+'/health'&&request.method==='GET')return reply({ok:true,runtimeContract:CREATOR_RUNTIME_CONTRACT,identityMode:'anonymous-capability-v1'})
 const published=path.match(/^\/api\/creator\/(?:releases|device-releases|actor-releases|layer-releases)\/([a-f0-9]{64}\.[a-f0-9-]{36})(\/(?:file|housing|rotor))?$/)
 if(creator&&published&&request.method==='GET'){
  if(!backgroundReleaseId(published[1])||!env.CARRIAGE_JOURNEYS)return reply({error:'NOT_FOUND'},404)
  const owner=published[1].split('.')[0]
  return env.CARRIAGE_JOURNEYS.get(env.CARRIAGE_JOURNEYS.idFromName('creator-art-v1:'+owner)).fetch(new Request(request.url,{headers:{'X-Authority-Owner':owner,[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}}))
 }
 if(original&&!originalEnabled)return reply({error:'NOT_FOUND'},404)
 if(original&&path===ORIGINAL_API_PATH+'/health'&&request.method==='GET')return reply({ok:true,production:originalProduction,identityMode:'anonymous-capability-v1',runtimeContract:ORIGINAL_RUNTIME_CONTRACT,liveModelAvailable:originalActionAvailable(),liveDialogueAvailable:originalDialogueAvailable()})
 if((path==='/api/health'||path==='/api/lab/health')&&request.method==='GET')return reply({ok:true,storage:'durable-object-sqlite',identity_mode:writesEnabled?'anonymous-capability-v1':'not-enabled',runtime:'durable-object-sqlite',production:writesEnabled,identityMode:writesEnabled?'anonymous-capability-v1':'not-enabled',liveModelAvailable:ONLINE_NARRATION_AVAILABLE,narrationMode:'opt-in',release:RELEASE_ID,runtimeContract:RUNTIME_CONTRACT})
 if(!creator&&!original&&!path.startsWith('/api/lab/'))return reply({error:'NOT_FOUND'},404)
 if(!imageEnabled&&/^\/api\/lab\/sessions\/[^/]+\/image(?:\/file)?$/.test(path))return reply({error:'NOT_FOUND'},404)
 if(!writesEnabled)return reply({error:'PRODUCTION_IDENTITY_NOT_ENABLED'},503)
 if(!env.CARRIAGE_JOURNEYS)return reply({error:'AUTHORITY_UNAVAILABLE'},503)
 const token=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1]
 if(!token)return reply({error:'AUTH_REQUIRED'},401)
 // Decode/re-encode uniqueness: a 32-byte base64url capability has a constrained tail.
 if(!/[AEIMQUYcgkosw048]$/.test(token))return reply({error:'AUTH_REQUIRED'},401)
 if(request.headers.get(RUNTIME_HEADER)!==RUNTIME_CONTRACT||original&&request.headers.get(ORIGINAL_RUNTIME_HEADER)!==ORIGINAL_RUNTIME_CONTRACT||creator&&request.headers.get(CREATOR_RUNTIME_HEADER)!==CREATOR_RUNTIME_CONTRACT)return reply({error:'RUNTIME_VERSION_MISMATCH'},409)
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)),owner=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')
 try{
  const payload=request.method==='GET'?undefined:JSON.stringify(await body(request,spriteArchiveBodyLimit(path)))
  const forwarded=new Request(request.url,{method:request.method,headers:{'Content-Type':'application/json','X-Authority-Owner':owner,[RUNTIME_HEADER]:RUNTIME_CONTRACT,...(creator?{[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}:{}),...(original?{[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT}:{})},body:payload})
  return await env.CARRIAGE_JOURNEYS.get(env.CARRIAGE_JOURNEYS.idFromName(creator?'creator-art-v1:'+owner:original?'original-v8:'+owner:owner)).fetch(forwarded)
 }catch(e){return reply({error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'},e instanceof LabError?e.status:503)}
}}
// Both stories retain their own owner keys inside the existing namespace.
export const handleApi=createHandler(PRODUCTION_WRITES_ENABLED,JOURNAL_IMAGE_RELEASED,ORIGINAL_STORY_RELEASED,()=>ORIGINAL_STORY_RELEASED,()=>ORIGINAL_STORY_RELEASED,true,ORIGINAL_STORY_RELEASED)
interface DurableContext{waitUntil?:(promise:Promise<unknown>)=>void;storage:{sql:{exec(query:string,...bindings:any[]):{toArray():any[]}};transactionSync<T>(work:()=>T):T}}
export class CarriageJourneyAuthority{
 private authority:ProductionAuthority
 private original?:OriginalTrainAuthority
 private creator?:CreatorArtArchive
 private sprites?:CreatorSpriteArchive
 private layers?:CreatorLayerArchive
 private db:AuthorityStorage
 private originalGate:OriginalPresentationGate
 private produceImage:ImageProducer
 private background:(promise:Promise<unknown>)=>void
 constructor(ctx:DurableContext,private env?:Environment,modelRequest?:ModelRequest,imageProducer?:ImageProducer,originalGate:OriginalPresentationGate=ORIGINAL_STORY_RELEASED?originalReleasedPresentation:originalPresentationUnavailable,private originalInterpreter?:OriginalActionInterpreter,private originalDialogue?:OriginalDialogueGenerator,private artSource?:ArtArchiveSource){
  this.produceImage=imageProducer??createJournalImageProducer()
  this.background=p=>{if(ctx.waitUntil)ctx.waitUntil(p);else void p.catch(()=>{})}
  const db:AuthorityStorage={all:(sql,...values)=>ctx.storage.sql.exec(sql,...values).toArray(),run:(sql,...values)=>{ctx.storage.sql.exec(sql,...values)},transaction:work=>ctx.storage.transactionSync(work)}
  this.db=db;this.originalGate=originalGate
  // Explicit preflight/test gates never acquire a live provider accidentally.
  // The session authority enforces its persisted per-owner narration quota.
  if(originalGate===originalReleasedPresentation){
   this.originalInterpreter??=createOriginalActionInterpreter(modelRequest??chatModel)
   this.originalDialogue??=createOriginalDialogueGenerator(modelRequest??chatModel)
  }
  this.authority=new ProductionAuthority(db,(input,save,target,live)=>propose(input,save,target,live&&ONLINE_NARRATION_AVAILABLE,modelRequest))
 }
 async fetch(request:Request){try{
  const owner=request.headers.get('X-Authority-Owner');if(!owner||!/^[a-f0-9]{64}$/.test(owner))throw new LabError('AUTH_REQUIRED',401)
  if(request.headers.get(RUNTIME_HEADER)!==RUNTIME_CONTRACT)throw new LabError('RUNTIME_VERSION_MISMATCH',409)
  const url=new URL(request.url)
  if(url.pathname.startsWith(CREATOR_API_PATH+'/')){
   const respond=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
   try{
    if(request.headers.get(CREATOR_RUNTIME_HEADER)!==CREATOR_RUNTIME_CONTRACT)throw new LabError('RUNTIME_VERSION_MISMATCH',409)
    this.creator??=new CreatorArtArchive(this.db,this.artSource)
    const path=url.pathname.slice(CREATOR_API_PATH.length)
    const devicePublished=path.match(/^\/device-releases\/([a-f0-9]{64})\.([a-f0-9-]{36})(\/file)?$/)
    if(devicePublished&&request.method==='GET'){
     if(devicePublished[1]!==owner)throw new LabError('DEVICE_NOT_PUBLISHED',404)
     this.sprites??=new CreatorSpriteArchive(this.db)
     const release=this.sprites.publication(owner,devicePublished[2]);if(!release)throw new LabError('DEVICE_NOT_PUBLISHED',404)
     if(!devicePublished[3])return respond(release)
     return new Response(new Uint8Array(await this.sprites.file(owner,devicePublished[2],'candidate')),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
    }
    const actorPublished=path.match(/^\/actor-releases\/([a-f0-9]{64})\.([a-f0-9-]{36})(\/file)?$/)
    if(actorPublished&&request.method==='GET'){
     if(actorPublished[1]!==owner)throw new LabError('ACTOR_NOT_PUBLISHED',404)
     this.sprites??=new CreatorSpriteArchive(this.db)
     const release=this.sprites.actorPublication(owner,actorPublished[2]);if(!release)throw new LabError('ACTOR_NOT_PUBLISHED',404)
     if(!actorPublished[3])return respond(release)
     return new Response(new Uint8Array(await this.sprites.file(owner,actorPublished[2],'candidate')),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
    }
    const layerPublished=path.match(/^\/layer-releases\/([a-f0-9]{64})\.([a-f0-9-]{36})(?:\/(housing|rotor))?$/)
    if(layerPublished&&request.method==='GET'){
     this.layers??=new CreatorLayerArchive(this.db);const release=this.layers.publication(owner,layerPublished[2]);if(!release)throw new LabError('LAYER_NOT_PUBLISHED',404)
     if(!layerPublished[3])return respond(release)
     return new Response(new Uint8Array(await this.layers.file(owner,layerPublished[2],layerPublished[3])),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
    }
    if(path==='/layers'||path.startsWith('/layers/')){
     this.layers??=new CreatorLayerArchive(this.db)
     if(path==='/layers'&&request.method==='GET')return respond({layers:this.layers.list(owner)})
     if(path==='/layers'&&request.method==='POST')return respond(this.layers.begin(owner,await body(request)))
     const m=path.match(/^\/layers\/([a-f0-9-]{36})(?:\/(parts|finish|cancel|review|release|publish|file\/(source|housing|rotor)))?$/)
     if(!m)throw new LabError('NOT_FOUND',404)
     if(request.method==='GET'){
      if(!m[2])return respond(this.layers.get(owner,m[1]))
      if(m[2]==='parts')return respond(this.layers.progress(owner,m[1]))
      if(m[2]==='review')return respond({review:this.layers.review(owner,m[1])})
      if(m[2]==='release'){this.layers.get(owner,m[1]);return respond({release:this.layers.publication(owner,m[1])})}
      if(m[3])return new Response(new Uint8Array(await this.layers.file(owner,m[1],m[3])),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
     }
     if(request.method==='POST'){
      if(m[2]==='parts')return respond(this.layers.part(owner,m[1],await body(request,spriteArchiveBodyLimit(url.pathname))))
      if(m[2]==='finish')return respond(await this.layers.finish(owner,m[1]))
      if(m[2]==='cancel')return respond(this.layers.cancel(owner,m[1]))
      if(m[2]==='review')return respond(await this.layers.saveReview(owner,m[1],await body(request)))
      if(m[2]==='publish')return respond(await this.layers.publish(owner,m[1],await body(request)))
     }
     throw new LabError('METHOD_NOT_ALLOWED',405)
    }
    if(path==='/sprites'||path.startsWith('/sprites/')){
     this.sprites??=new CreatorSpriteArchive(this.db)
     if(path==='/sprites'&&request.method==='GET')return respond({sprites:this.sprites.list(owner)})
     if(path==='/sprites'&&request.method==='POST')return respond(this.sprites.begin(owner,await body(request)))
     const m=path.match(/^\/sprites\/([a-f0-9-]{36})(?:\/(parts|finish|cancel|release|publish|actor-reviews|actor-release|publish-actor|file\/(source|candidate|input-0|input-1)))?$/)
     if(!m)throw new LabError('NOT_FOUND',404)
     if(request.method==='GET'){
      if(!m[2])return respond(this.sprites.get(owner,m[1]))
      if(m[2]==='release'){this.sprites.get(owner,m[1]);return respond({release:this.sprites.publication(owner,m[1])})}
      if(m[2]==='parts')return respond(this.sprites.progress(owner,m[1]))
      if(m[2]==='actor-release'){this.sprites.get(owner,m[1]);return respond({release:this.sprites.actorPublication(owner,m[1])})}
      if(m[2]==='actor-reviews')return respond({reviews:this.sprites.actorReviews(owner,m[1])})
      if(m[3])return new Response(new Uint8Array(await this.sprites.file(owner,m[1],m[3])),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
     }
     if(request.method==='POST'){
      if(m[2]==='parts')return respond(this.sprites.part(owner,m[1],await body(request,spriteArchiveBodyLimit(url.pathname))))
      if(m[2]==='publish-actor')return respond(await this.sprites.publishActor(owner,m[1],await body(request)))
      if(m[2]==='publish')return respond(await this.sprites.publish(owner,m[1],await body(request)))
      if(m[2]==='actor-reviews')return respond(await this.sprites.saveActorReview(owner,m[1],await body(request)))
      if(m[2]==='finish')return respond(await this.sprites.finish(owner,m[1]))
      if(m[2]==='cancel')return respond(this.sprites.cancel(owner,m[1]))
     }
     throw new LabError('METHOD_NOT_ALLOWED',405)
    }
    const published=path.match(/^\/releases\/([a-f0-9]{64})\.([a-f0-9-]{36})(\/file)?$/)
    if(published&&request.method==='GET'){
     if(published[1]!==owner)throw new LabError('BACKGROUND_NOT_PUBLISHED',404)
     const release=this.creator.published(owner,published[2])
     if(!published[3])return respond(release)
     return new Response(new Uint8Array(await this.creator.file(owner,published[2])),{headers:{'Content-Type':'image/png','Cache-Control':'public, max-age=31536000, immutable',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
    }
    if(path==='/drafts'&&request.method==='GET')return respond({drafts:this.creator.list(owner)})
    if(path==='/drafts'&&request.method==='POST')return respond(await this.creator.save(owner,await body(request)))
    const match=path.match(/^\/drafts\/([a-f0-9-]{36})(\/(?:file|publish|release))?$/)
    if(match?.[2]==='/publish'&&request.method==='POST')return respond(await this.creator.publish(owner,match[1],await body(request)))
    if(match&&request.method==='GET'){
     if(!match[2])return respond(this.creator.get(owner,match[1]))
     if(match[2]==='/release'){
      this.creator.get(owner,match[1])
      try{return respond({release:this.creator.published(owner,match[1])})}catch(e){if(e instanceof LabError&&e.code==='BACKGROUND_NOT_PUBLISHED')return respond({release:null});throw e}
     }
     if(match[2]!=='/file')throw new LabError('NOT_FOUND',404)
     return new Response(new Uint8Array(await this.creator.file(owner,match[1])),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}})
    }
    throw new LabError('NOT_FOUND',404)
   }catch(e){return respond({error:e instanceof LabError?e.code:'ART_SOURCE_UNAVAILABLE'},e instanceof LabError?e.status:503)}
  }
  if(url.pathname.startsWith(ORIGINAL_API_PATH+'/')){
   this.original??=new OriginalTrainAuthority(this.db,this.originalGate,undefined,undefined,this.originalInterpreter,this.originalDialogue)
   return handleOriginalSession(request,owner,this.original,body,async id=>{
    if(!backgroundReleaseId(id)||!this.env?.CARRIAGE_JOURNEYS)throw new LabError('BACKGROUND_NOT_PUBLISHED',404)
    const publisher=id.split('.')[0],r=await this.env.CARRIAGE_JOURNEYS.get(this.env.CARRIAGE_JOURNEYS.idFromName('creator-art-v1:'+publisher)).fetch(new Request('https://authority.invalid/api/creator/releases/'+id,{headers:{'X-Authority-Owner':publisher,[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}}))
    if(!r.ok)throw new LabError('BACKGROUND_NOT_PUBLISHED',404)
    const release=await r.json();assertPublishedBackground(release);if(release.id!==id)throw new LabError('BACKGROUND_RELEASE_INVALID',409);return release
   },async id=>{
    if(!deviceReleaseId(id)||!this.env?.CARRIAGE_JOURNEYS)throw new LabError('DEVICE_NOT_PUBLISHED',404)
    const publisher=id.split('.')[0],r=await this.env.CARRIAGE_JOURNEYS.get(this.env.CARRIAGE_JOURNEYS.idFromName('creator-art-v1:'+publisher)).fetch(new Request('https://authority.invalid/api/creator/device-releases/'+id,{headers:{'X-Authority-Owner':publisher,[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}}))
    if(!r.ok)throw new LabError('DEVICE_NOT_PUBLISHED',404)
    const release=await r.json();assertPublishedDevice(release);if(release.id!==id)throw new LabError('DEVICE_RELEASE_INVALID',409);return release
   },async id=>{
    if(!actorReleaseId(id)||!this.env?.CARRIAGE_JOURNEYS)throw new LabError('ACTOR_NOT_PUBLISHED',404)
    const publisher=id.split('.')[0],r=await this.env.CARRIAGE_JOURNEYS.get(this.env.CARRIAGE_JOURNEYS.idFromName('creator-art-v1:'+publisher)).fetch(new Request('https://authority.invalid/api/creator/actor-releases/'+id,{headers:{'X-Authority-Owner':publisher,[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}}))
    if(!r.ok)throw new LabError('ACTOR_NOT_PUBLISHED',404)
    const release=await r.json();assertPublishedActor(release);if(release.id!==id)throw new LabError('ACTOR_RELEASE_INVALID',409);return release
  },async id=>{
    if(!layerReleaseId(id)||!this.env?.CARRIAGE_JOURNEYS)throw new LabError('LAYER_NOT_PUBLISHED',404)
    const publisher=id.split('.')[0],r=await this.env.CARRIAGE_JOURNEYS.get(this.env.CARRIAGE_JOURNEYS.idFromName('creator-art-v1:'+publisher)).fetch(new Request('https://authority.invalid/api/creator/layer-releases/'+id,{headers:{'X-Authority-Owner':publisher,[RUNTIME_HEADER]:RUNTIME_CONTRACT,[CREATOR_RUNTIME_HEADER]:CREATOR_RUNTIME_CONTRACT}}))
    if(!r.ok)throw new LabError('LAYER_NOT_PUBLISHED',404)
    const release=await r.json();assertPublishedLayer(release);if(release.id!==id)throw new LabError('LAYER_RELEASE_INVALID',409);return release
   })
  }
  const path=url.pathname.slice('/api/lab'.length)
  if(path==='/sessions'&&request.method==='GET')return json({sessions:this.authority.directory(owner)})
  if(path==='/sessions'&&request.method==='POST'){const b=await body(request);return json(this.authority.create(owner,b.enrollment_id,b.locale==='en'?'en':'zh'))}
  const imagePath=path.match(/^\/sessions\/([a-zA-Z0-9-]{16,80})\/image(\/file)?$/)
  if(imagePath){
   const id=imagePath[1]
   if(request.method==='GET'&&imagePath[2]){
    const job=this.authority.get(owner,id).journalImage;if(!job)throw new LabError('IMAGE_NOT_READY',409)
    const bytes=await readJournalImageAsset(job)
    return new Response(bytes,{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT}})
   }
   if(request.method==='GET')return json({job:this.authority.image(owner,id)})
   if(request.method==='POST'&&!imagePath[2]){
    const b=await body(request);if(Object.keys(b).some(k=>k!=='retry')||b.retry!==undefined&&typeof b.retry!=='boolean')throw new LabError('INVALID_IMAGE_REQUEST')
    const job=this.authority.startImage(owner,id,b.retry===true)
    this.background(this.authority.runImage(owner,id,this.produceImage))
    return json({job})
   }
   throw new LabError('METHOD_NOT_ALLOWED',405)
  }
  const m=path.match(/^\/sessions\/([a-zA-Z0-9-]{16,80})(?:\/(actions|position|events|backup))?$/);if(!m)throw new LabError('NOT_FOUND',404)
  if(request.method==='GET'&&!m[2])return json(this.authority.get(owner,m[1]))
  if(request.method==='GET'&&m[2]==='backup')return json(await this.authority.backup(owner,m[1]))
  if(request.method==='GET'&&m[2]==='events')return json({events:this.authority.events(owner,m[1],Number(url.searchParams.get('after')??0))})
  if(request.method==='POST'&&m[2]==='actions')return json(await this.authority.action(owner,m[1],await body(request)))
  if(request.method==='POST'&&m[2]==='position')return json(this.authority.checkpoint(owner,m[1],await body(request)))
  throw new LabError('METHOD_NOT_ALLOWED',405)
 }catch(e){return failure(e)}}
}
