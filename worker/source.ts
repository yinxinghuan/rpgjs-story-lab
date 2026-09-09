import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {LabError} from '../src/journey-runtime'
import {localReply} from '../src/contract'
// User approved this bounded new-journey capability trial on 2026-09-10.
export const PRODUCTION_WRITES_ENABLED=true
interface Namespace{ idFromName(name:string):unknown;get(id:unknown):{fetch(request:Request):Promise<Response>} }
interface Environment{CARRIAGE_JOURNEYS?:Namespace}
const json=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}})
async function body(request:Request){
 const reader=request.body?.getReader();if(!reader)return {}
 let size=0;const chunks:Uint8Array[]=[]
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>6000){await reader.cancel();throw new LabError('BODY_TOO_LARGE',413)}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}
 try{const value=JSON.parse(new TextDecoder().decode(bytes));if(!value||typeof value!=='object'||Array.isArray(value))throw new Error();return value}catch{throw new LabError('INVALID_JSON')}
}
const failure=(e:unknown)=>json({error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'},e instanceof LabError?e.status:503)
export function createHandler(writesEnabled:boolean){return async(request:Request,env:Environment)=>{
 const path=new URL(request.url).pathname
 if(path==='/api/lab/health'&&request.method==='GET')return json({ok:true,runtime:'durable-object-sqlite',production:writesEnabled,identityMode:writesEnabled?'anonymous-capability-v1':'not-enabled',liveModelAvailable:false,release:'carriage-cloud-trial-20260910-1'})
 if(!path.startsWith('/api/lab/'))return json({error:'NOT_FOUND'},404)
 if(!writesEnabled)return json({error:'PRODUCTION_IDENTITY_NOT_ENABLED'},503)
 if(!env.CARRIAGE_JOURNEYS)return json({error:'AUTHORITY_UNAVAILABLE'},503)
 const token=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{43})$/)?.[1]
 if(!token)return json({error:'AUTH_REQUIRED'},401)
 // Decode/re-encode uniqueness: a 32-byte base64url capability has a constrained tail.
 if(!/[AEIMQUYcgkosw048]$/.test(token))return json({error:'AUTH_REQUIRED'},401)
 const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)),owner=Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('')
 try{
  const payload=request.method==='GET'?undefined:JSON.stringify(await body(request))
  const forwarded=new Request(request.url,{method:request.method,headers:{'Content-Type':'application/json','X-Authority-Owner':owner},body:payload})
  return await env.CARRIAGE_JOURNEYS.get(env.CARRIAGE_JOURNEYS.idFromName(owner)).fetch(forwarded)
 }catch(e){return failure(e)}
}}
export const handleApi=createHandler(PRODUCTION_WRITES_ENABLED)
interface DurableContext{storage:{sql:{exec(query:string,...bindings:any[]):{toArray():any[]}};transactionSync<T>(work:()=>T):T}}
export class CarriageJourneyAuthority{
 private authority:ProductionAuthority
 constructor(ctx:DurableContext){
  const db:AuthorityStorage={all:(sql,...values)=>ctx.storage.sql.exec(sql,...values).toArray(),run:(sql,...values)=>{ctx.storage.sql.exec(sql,...values)},transaction:work=>ctx.storage.transactionSync(work)}
  this.authority=new ProductionAuthority(db,async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'local',attempts:0,fallback:false}}))
 }
 async fetch(request:Request){try{
  const owner=request.headers.get('X-Authority-Owner');if(!owner||!/^[a-f0-9]{64}$/.test(owner))throw new LabError('AUTH_REQUIRED',401)
  const url=new URL(request.url),path=url.pathname.slice('/api/lab'.length)
  if(path==='/sessions'&&request.method==='GET')return json({sessions:this.authority.directory(owner)})
  if(path==='/sessions'&&request.method==='POST'){const b=await body(request);return json(this.authority.create(owner,b.enrollment_id,b.locale==='en'?'en':'zh'))}
  const m=path.match(/^\/sessions\/([a-zA-Z0-9-]{16,80})(?:\/(actions|position|events))?$/);if(!m)throw new LabError('NOT_FOUND',404)
  if(request.method==='GET'&&!m[2])return json(this.authority.get(owner,m[1]))
  if(request.method==='GET'&&m[2]==='events')return json({events:this.authority.events(owner,m[1],Number(url.searchParams.get('after')??0))})
  if(request.method==='POST'&&m[2]==='actions')return json(await this.authority.action(owner,m[1],await body(request)))
  if(request.method==='POST'&&m[2]==='position')return json(this.authority.checkpoint(owner,m[1],await body(request)))
  throw new LabError('METHOD_NOT_ALLOWED',405)
 }catch(e){return failure(e)}}
}
