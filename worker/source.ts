import {OriginalTrainAuthority,originalPresentationUnavailable,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {OriginalActionInterpreter} from '../server/original-action-interpreter'
import type {OriginalDialogueGenerator} from '../server/original-dialogue'
import {originalJson,handleOriginalSession} from '../server/original-http'
import {ORIGINAL_API_PATH,ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from '../src/original-runtime-contract'
import {createJournalImageProducer,readJournalImageAsset,type ImageProducer} from '../server/journal-image'
import {JOURNAL_IMAGE_RELEASED} from '../src/journal-image-release'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {LabError} from '../src/journey-runtime'
import {propose,type ModelRequest} from '../server/model'
import {RUNTIME_CONTRACT,RUNTIME_HEADER,RELEASE_ID} from '../src/runtime-contract'
// Runtime capability; players opt in separately through an explicit live envelope.
export const ONLINE_NARRATION_AVAILABLE=true
// User approved this bounded new-journey capability trial on 2026-09-10.
export const PRODUCTION_WRITES_ENABLED=true
interface Namespace{ idFromName(name:string):unknown;get(id:unknown):{fetch(request:Request):Promise<Response>} }
interface Environment{CARRIAGE_JOURNEYS?:Namespace}
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT}})
async function body(request:Request){
 const reader=request.body?.getReader();if(!reader)return {}
 let size=0;const chunks:Uint8Array[]=[]
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>6000){await reader.cancel();throw new LabError('BODY_TOO_LARGE',413)}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();return value}catch{throw new LabError('INVALID_JSON')}
}
const failure=(e:unknown)=>json({error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'},e instanceof LabError?e.status:503)
export function createHandler(writesEnabled:boolean,imageEnabled=JOURNAL_IMAGE_RELEASED,originalEnabled=false){return async(request:Request,env:Environment)=>{
 const path=new URL(request.url).pathname
 const original=path===ORIGINAL_API_PATH||path.startsWith(ORIGINAL_API_PATH+'/'),reply=original?originalJson:json
 if(original&&!originalEnabled)return reply({error:'NOT_FOUND'},404)
 if(original&&path===ORIGINAL_API_PATH+'/health'&&request.method==='GET')return reply({ok:true,production:false,identityMode:'anonymous-capability-v1',runtimeContract:ORIGINAL_RUNTIME_CONTRACT,liveModelAvailable:false})
 if((path==='/api/health'||path==='/api/lab/health')&&request.method==='GET')return reply({ok:true,storage:'durable-object-sqlite',identity_mode:writesEnabled?'anonymous-capability-v1':'not-enabled',runtime:'durable-object-sqlite',production:writesEnabled,identityMode:writesEnabled?'anonymous-capability-v1':'not-enabled',liveModelAvailable:ONLINE_NARRATION_AVAILABLE,narrationMode:'opt-in',release:RELEASE_ID,runtimeContract:RUNTIME_CONTRACT})
 if(!original&&!path.startsWith('/api/lab/'))return reply({error:'NOT_FOUND'},404)
 if(!imageEnabled&&/^\/api\/lab\/sessions\/[^/]+\/image(?:\/file)?$/.test(path))return reply({error:'NOT_FOUND'},404)
 if(!writesEnabled)return reply({error:'PRODUCTION_IDENTITY_NOT_ENABLED'},503)
 if(!env.CARRIAGE_JOURNEYS)return reply({error:'AUTHORITY_UNAVAILABLE'},503)
 const token=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1]
 if(!token)return reply({error:'AUTH_REQUIRED'},401)
 // Decode/re-encode uniqueness: a 32-byte base64url capability has a constrained tail.
 if(!/[AEIMQUYcgkosw048]$/.test(token))return reply({error:'AUTH_REQUIRED'},401)
 if(request.headers.get(RUNTIME_HEADER)!==RUNTIME_CONTRACT||original&&request.headers.get(ORIGINAL_RUNTIME_HEADER)!==ORIGINAL_RUNTIME_CONTRACT)return reply({error:'RUNTIME_VERSION_MISMATCH'},409)
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)),owner=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')
 try{
  const payload=request.method==='GET'?undefined:JSON.stringify(await body(request))
  const forwarded=new Request(request.url,{method:request.method,headers:{'Content-Type':'application/json','X-Authority-Owner':owner,[RUNTIME_HEADER]:RUNTIME_CONTRACT,...(original?{[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT}:{})},body:payload})
  return await env.CARRIAGE_JOURNEYS.get(env.CARRIAGE_JOURNEYS.idFromName(original?'original-v8:'+owner:owner)).fetch(forwarded)
 }catch(e){return reply({error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'},e instanceof LabError?e.status:503)}
}}
export const handleApi=createHandler(PRODUCTION_WRITES_ENABLED)
interface DurableContext{waitUntil?:(promise:Promise<unknown>)=>void;storage:{sql:{exec(query:string,...bindings:any[]):{toArray():any[]}};transactionSync<T>(work:()=>T):T}}
export class CarriageJourneyAuthority{
 private authority:ProductionAuthority
 private original?:OriginalTrainAuthority
 private db:AuthorityStorage
 private originalGate:OriginalPresentationGate
 private produceImage:ImageProducer
 private background:(promise:Promise<unknown>)=>void
 constructor(ctx:DurableContext,_env?:Environment,modelRequest?:ModelRequest,imageProducer?:ImageProducer,originalGate:OriginalPresentationGate=originalPresentationUnavailable,private originalInterpreter?:OriginalActionInterpreter,private originalDialogue?:OriginalDialogueGenerator){
  this.produceImage=imageProducer??createJournalImageProducer()
  this.background=p=>{if(ctx.waitUntil)ctx.waitUntil(p);else void p.catch(()=>{})}
  const db:AuthorityStorage={all:(sql,...values)=>ctx.storage.sql.exec(sql,...values).toArray(),run:(sql,...values)=>{ctx.storage.sql.exec(sql,...values)},transaction:work=>ctx.storage.transactionSync(work)}
  this.db=db;this.originalGate=originalGate
  this.authority=new ProductionAuthority(db,(input,save,target,live)=>propose(input,save,target,live&&ONLINE_NARRATION_AVAILABLE,modelRequest))
 }
 async fetch(request:Request){try{
  const owner=request.headers.get('X-Authority-Owner');if(!owner||!/^[a-f0-9]{64}$/.test(owner))throw new LabError('AUTH_REQUIRED',401)
  if(request.headers.get(RUNTIME_HEADER)!==RUNTIME_CONTRACT)throw new LabError('RUNTIME_VERSION_MISMATCH',409)
  const url=new URL(request.url)
  if(url.pathname.startsWith(ORIGINAL_API_PATH+'/')){
   this.original??=new OriginalTrainAuthority(this.db,this.originalGate,undefined,undefined,this.originalInterpreter,this.originalDialogue)
   return handleOriginalSession(request,owner,this.original,body)
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
