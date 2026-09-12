import {generateImageMedia,waitForMediaTask,MediaServiceError,type MediaTask} from './vendor/media/client'
import {spriteDatabaseName,inspectSpritePng,verifySpritePng,newSpriteSource,type SpritePng,type SpriteDraftRepository} from './sprite-draft'
import {spritePreviewUrl} from './sprite-browser-io'
import {spriteGenerationRequest,spriteRecipeAvailable,type SpriteRecipe} from './sprite-generation-recipe'
export type SpriteGeneration={version:1;id:string;recipe:SpriteRecipe;sessionId:string;createdAt:number;state:'prepared'|'generating'|'failed'|'ready';taskId?:string;png?:SpritePng;error?:string;retryable:boolean;nextAt:number}
export interface SpriteGenerations{get(id?:string):Promise<SpriteGeneration|undefined>;put(d:SpriteGeneration):Promise<void>;list():Promise<SpriteGeneration[]>}
export const spriteGenerationDatabase=(url:string)=>spriteDatabaseName(url).replace('sprite-drafts','sprite-generations')
export const pendingSpriteGeneration=(d?:SpriteGeneration)=>Boolean(d&&(d.state==='prepared'||d.state==='generating'||d.state==='failed'&&d.retryable))
export function planSpriteGeneration(recipe:SpriteRecipe,sessionId:string):SpriteGeneration{
 const id=crypto.randomUUID();spriteGenerationRequest(recipe,id,sessionId)
 if(!spriteRecipeAvailable(recipe))throw Error('SPRITE_RECIPE_NOT_RELEASED')
 return {version:1,id,recipe,sessionId,createdAt:Date.now(),state:'prepared',retryable:true,nextAt:0}
}
export class BrowserSpriteGenerations implements SpriteGenerations{
 private db:Promise<IDBDatabase>
 constructor(name:string,factory:IDBFactory=globalThis.indexedDB){this.db=new Promise((resolve,reject)=>{const r=factory.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('records');r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('SPRITE_STORAGE_FAILED'))})}
 private async tx<T>(mode:IDBTransactionMode,work:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await this.db;return new Promise((resolve,reject)=>{const tx=db.transaction('records',mode),r=work(tx.objectStore('records'));tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(Error('SPRITE_STORAGE_FAILED'));tx.onerror=()=>{}})}
 async get(id?:string){const d=await this.tx('readonly',s=>s.get(id??'current')) as SpriteGeneration|undefined;if(d){if(d.version!==1)throw Error('SPRITE_GENERATION_INVALID');spriteGenerationRequest(d.recipe,d.id,d.sessionId)}return d}
 async put(d:SpriteGeneration){await this.tx('readwrite',s=>{s.put(d,d.id);return s.put(d,'current')})}
 async list(){const all=await this.tx('readonly',s=>s.getAll()) as SpriteGeneration[];return [...new Map(all.map(d=>[d.id,d])).values()].sort((a,b)=>b.createdAt-a.createdAt)}
 async close(){(await this.db).close()}
}
export type SpriteProducer=(d:SpriteGeneration,onTask:(id:string)=>Promise<void>)=>Promise<SpritePng>
export function createSpriteProducer(fetcher:typeof fetch=fetch,decode:typeof spritePreviewUrl=spritePreviewUrl):SpriteProducer{return async(d,onTask)=>{
 const request=spriteGenerationRequest(d.recipe,d.id,d.sessionId),signal=AbortSignal.timeout(180000)
 const options={signal,pollIntervalMs:8000,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{const r=await fetcher(input,init);if(r.ok){const task=await r.clone().json() as MediaTask;if(task.request_id!==d.id||typeof task.task_id!=='string'||!/^[A-Za-z0-9_-]{1,160}$/.test(task.task_id)||d.taskId&&task.task_id!==d.taskId)throw Error('SPRITE_GENERATION_INVALID');await onTask(task.task_id)}return r}}
 const task=d.taskId?await waitForMediaTask(d.taskId,options):await generateImageMedia(request,options)
 if(task.request_id!==d.id||task.status!=='succeeded'||task.media?.type!=='image'||task.media.format!=='png'||task.media.width!==request.size.width||task.media.height!==request.size.height)throw Error('SPRITE_GENERATION_INVALID')
 const url=new URL(task.media.url)
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['cdn.aiwaves.tech','images.aiwaves.tech','game.aiwaves.tech'].includes(url.hostname))throw Error('SPRITE_GENERATION_INVALID')
 const response=await fetcher(url,{signal,credentials:'omit',redirect:'error'});if(!response.ok||!response.body)throw Error('SPRITE_DOWNLOAD')
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let size=0
 for(;;){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>8*1024*1024){await reader.cancel();throw Error('SPRITE_INVALID_PNG')}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 const png=await inspectSpritePng(bytes);if(png.width!==request.size.width||png.height!==request.size.height)throw Error('SPRITE_GENERATION_INVALID')
 const preview=await decode(png);URL.revokeObjectURL(preview);return png
}}
/** Caller holds the sprite Web Lock from intent creation through persistence. */
export async function runSpriteGeneration(repo:SpriteGenerations,produce:SpriteProducer,notify:(d:SpriteGeneration)=>void=()=>{},now=Date.now){
 const d=await repo.get();if(!d)throw Error('SPRITE_GENERATION_INVALID');spriteGenerationRequest(d.recipe,d.id,d.sessionId)
 if(!d.retryable||d.state==='ready'||d.nextAt>now())return d
 const save=async()=>{if((await repo.get())?.id!==d.id)throw Error('SPRITE_DRAFT_REPLACED');await repo.put(d);notify(structuredClone(d))}
 d.state='generating';delete d.error;await save()
 try{const png=await produce(d,async id=>{d.taskId=id;await save()});await verifySpritePng(png);const size=spriteGenerationRequest(d.recipe,d.id,d.sessionId).size;if(!d.taskId||png.width!==size.width||png.height!==size.height)throw Error('SPRITE_GENERATION_INVALID');d.png=png;d.state='ready';d.retryable=false;await save()}
 catch(e){if((await repo.get())?.id!==d.id)throw Error('SPRITE_DRAFT_REPLACED');const media=e instanceof MediaServiceError;d.error=media?e.code:e instanceof Error&&/^SPRITE_/.test(e.message)?e.message:'SPRITE_GENERATION_UNAVAILABLE';d.state='failed';d.retryable=media?e.retryable:['SPRITE_DOWNLOAD','SPRITE_GENERATION_UNAVAILABLE'].includes(d.error);d.nextAt=now()+Math.max(8000,media?(e.retryAfterSeconds??0)*1000:0);await save()}
 return d
}
/** Explicit adoption only. A completed task never changes the active source automatically. */
export async function adoptSpriteGeneration(d:SpriteGeneration,repo:SpriteDraftRepository){
 if(d.state!=='ready'||!d.png||!d.taskId)throw Error('SPRITE_GENERATION_INVALID')
 await verifySpritePng(d.png)
 const current=await repo.get(),existing=await repo.get(d.id)
 if(existing){if(existing.source.sha256!==d.png.sha256)throw Error('SPRITE_CORRUPT');await repo.save(existing,current);return existing}
 const next=newSpriteSource(d.png,d.recipe,d.recipe==='ada-walk-v1'?'actor':'states')
 next.id=d.id;next.generation={version:1,recipe:d.recipe,sessionId:d.sessionId,requestId:d.id,taskId:d.taskId}
 await repo.save(next,current);return next
}
