import {generateImageMedia,waitForMediaTask,MediaServiceError,type MediaTask,type GenerateImageMediaRequest} from './vendor/media/client'
import {GAME_ID} from './game-id'
import type {BackgroundReview} from './background-publication'
export const ART_DRAFT_VERSION='north-cape-background-1'
export const ART_REFERENCE='https://raw.githubusercontent.com/yinxinghuan/rpgjs-story-lab/cfd4cbaf271766eb1d982b2d7bc8c427986d5f2c/doc/original-train-candidates/20260911/north-cape-v2.png'
export type ArtLighting='cool'|'warm'
export type ArtCandidate={bytes:Uint8Array;sha256:string;width:number;height:number}
export type ArtDraft={version:typeof ART_DRAFT_VERSION;id:string;lighting:ArtLighting;request:GenerateImageMediaRequest & {requestId:string};state:'prepared'|'generating'|'failed'|'candidate';source?:'library';taskId?:string;candidate?:ArtCandidate;review?:BackgroundReview;error?:string;retryable:boolean;nextAt:number}
export interface ArtDraftRepository {get(id?:string):Promise<ArtDraft|undefined>;put(draft:ArtDraft):Promise<void>}
export function planArtDraft(lighting:ArtLighting,sessionId=GAME_ID):ArtDraft{
 if(!['cool','warm'].includes(lighting))throw Error('INVALID_LIGHTING')
 const id=crypto.randomUUID()
 return {version:ART_DRAFT_VERSION,id,lighting,state:'prepared',retryable:true,nextAt:0,request:{requestId:id,sessionId,mode:'edit',referenceUrls:[ART_REFERENCE],size:{width:1024,height:1536},prompt:'Use this reference as a fixed orthographic RPG map. Preserve precisely the overhead camera, locomotive outline and length, tracks, pavement, shed, all boundaries and object placement. No new objects, people, words or perspective convergence. Preserve the fine textured pixel-art material detail and strong readable edge contrast. Keep the ground and locomotive at least as bright and readable as in the reference; do not darken shadows or flatten surfaces. Change only the lighting accents: '+(lighting==='cool'?'subtle cool blue dawn reflections while keeping warm lamps.':'subtle warm amber lamp reflections with neutral readable blue-gray pavement.')+' Output the same full 1024x1536 composition.'}}
}
export function artDraftDatabaseName(url:string){const u=new URL(url),first=u.pathname.split('/')[1];const scope=u.hostname==='game.aiwaves.tech'&&/^[a-f0-9-]{36}$/i.test(first)?first:GAME_ID;return `alteru:${scope}:creator-art-drafts-v1`}
export function draftSessionId(url:string){return artDraftDatabaseName(url).split(':')[1]}
/** Browser-only candidate storage, independent of every player journey. */
export class BrowserArtDrafts implements ArtDraftRepository{
 private db:Promise<IDBDatabase>
 constructor(name:string,factory:IDBFactory=globalThis.indexedDB){this.db=new Promise((resolve,reject)=>{const r=factory.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('STORAGE_BLOCKED'))})}
 private async transaction<T>(work:(s:IDBObjectStore)=>IDBRequest<T>,mode:IDBTransactionMode):Promise<T>{const db=await this.db;return new Promise((resolve,reject)=>{const tx=db.transaction('drafts',mode),r=work(tx.objectStore('drafts'));tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(tx.error??Error('STORAGE_ABORTED'));tx.onerror=()=>{}})}
 async get(id?:string){const value=await this.transaction(s=>s.get(id??'north-cape'),'readonly') as ArtDraft|undefined;if(value&&value.version!==ART_DRAFT_VERSION)throw Error('DRAFT_VERSION_UNSUPPORTED');return value}
 async put(draft:ArtDraft){const old=await this.get();await this.transaction(s=>{if(old)s.put(old,old.id);s.put(draft,draft.id);return s.put(draft,'north-cape')},'readwrite')}
 async close(){(await this.db).close()}
}
const uuid=/^[a-f0-9-]{36}$/i
/** Caller holds a Web Lock covering prepare and run, including across tabs. */
export async function runArtDraft(repo:ArtDraftRepository,produce:(draft:ArtDraft,onTask:(taskId:string)=>Promise<void>)=>Promise<ArtCandidate>,notify:(draft:ArtDraft)=>void=()=>{},now=Date.now){
 const draft=await repo.get();if(!draft||draft.version!==ART_DRAFT_VERSION||!uuid.test(draft.id)||draft.request.requestId!==draft.id)throw Error('INVALID_DRAFT')
 if(draft.state==='candidate'||!draft.retryable||draft.nextAt>now())return draft
 const save=async()=>{const current=await repo.get();if(current?.id!==draft.id)throw Error('DRAFT_REPLACED');await repo.put(draft);notify(structuredClone(draft))}
 draft.state='generating';delete draft.error;await save()
 try{
  const asset=await produce(draft,async id=>{draft.taskId=id;await save()})
  if(asset.width!==1024||asset.height!==1536||asset.bytes.length>8*1024*1024||asset.bytes.length<45||!/^[a-f0-9]{64}$/.test(asset.sha256))throw Error('ART_INVALID')
  draft.candidate=asset;draft.state='candidate';draft.retryable=false;await save()
 }catch(error){
  if((await repo.get())?.id!==draft.id)return
  const media=error instanceof MediaServiceError
  draft.state='failed';draft.error=media?error.code:error instanceof Error&&['ART_INVALID','ART_DECODE','ART_DOWNLOAD'].includes(error.message)?error.message:'ART_UNAVAILABLE'
  draft.retryable=!(media&&!error.retryable&&error.status>0)&&draft.error!=='ART_INVALID'&&draft.error!=='ART_DECODE'
  draft.nextAt=now()+Math.max(8000,media?(error.retryAfterSeconds??0)*1000:0);await save()
 }
 return draft
}
export async function inspectArtCandidate(bytes:Uint8Array){
 if(bytes.length<45||bytes.length>8*1024*1024||![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v))throw Error('ART_INVALID')
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength)
 if(view.getUint32(8)!==13||String.fromCharCode(...bytes.subarray(12,16))!=='IHDR'||view.getUint32(16)!==1024||view.getUint32(20)!==1536)throw Error('ART_INVALID')
 const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))].map(v=>v.toString(16).padStart(2,'0')).join('')
 return {bytes,sha256,width:1024,height:1536}
}
export async function decodeArtCandidate(candidate:ArtCandidate){
 const checked=await inspectArtCandidate(candidate.bytes);if(checked.sha256!==candidate.sha256)throw Error('ART_INVALID')
 const url=URL.createObjectURL(new Blob([new Uint8Array(candidate.bytes)],{type:'image/png'}))
 try{const img=new Image();img.src=url;await img.decode();if(img.naturalWidth!==1024||img.naturalHeight!==1536)throw Error('ART_DECODE');return url}catch{URL.revokeObjectURL(url);throw Error('ART_DECODE')}
}
export function createArtProducer(fetcher:typeof fetch=fetch,decode:typeof decodeArtCandidate=decodeArtCandidate){return async(draft:ArtDraft,onTask:(id:string)=>Promise<void>)=>{
 const signal=AbortSignal.timeout(180000)
 const options={signal,pollIntervalMs:8000,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{const r=await fetcher(input,init);if(r.ok){const task=await r.clone().json() as MediaTask;if(task.request_id!==draft.id||typeof task.task_id!=='string')throw Error('ART_INVALID');await onTask(task.task_id)}return r}}
 const task=draft.taskId?await waitForMediaTask(draft.taskId,options):await generateImageMedia(draft.request,options)
 if(task.request_id!==draft.id||task.status!=='succeeded'||task.media?.type!=='image'||task.media.format!=='png'||task.media.width!==1024||task.media.height!==1536)throw Error('ART_INVALID')
 const url=new URL(task.media.url)
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['cdn.aiwaves.tech','images.aiwaves.tech','game.aiwaves.tech'].includes(url.hostname))throw Error('ART_INVALID')
 const response=await fetcher(url,{signal,credentials:'omit',redirect:'error'});if(!response.ok||!response.body)throw Error('ART_DOWNLOAD')
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>8*1024*1024){await reader.cancel();throw Error('ART_INVALID')}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 const candidate=await inspectArtCandidate(bytes),preview=await decode(candidate);URL.revokeObjectURL(preview);return candidate
}}
