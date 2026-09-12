import type {AuthorityStorage} from './session-authority'
import type {OriginalHead} from './original-train-runtime'
import {originalBackgroundReleases,originalSceneBackgroundVersion,originalBaseAssets,ORIGINAL_BACKGROUND_BASELINE,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
import {backgroundReleasePath} from '../src/background-publication'
import {originalBackgroundSourcePaths} from '../src/original-background-sources'
import {GAME_ID} from '../src/game-id'
import {LabError} from '../src/journey-runtime'
import {generateImageMedia,waitForMediaTask,MediaServiceError,type GenerateImageMediaRequest} from '../src/vendor/media/client'
import {inspectJournalPng} from './journal-image'

export const ORIGINAL_ILLUSTRATION_RELEASED=false
const COMMIT='8c4ebb1d42397286d91a7d511fc0d41d1f7a144a'
const size={width:768,height:1024} as const
export type IllustrationPlan={version:1|2;scene:string;sourceVersion:number;referenceVersion:string;referenceSha256:string;request:GenerateImageMediaRequest}
export type IllustrationJob={id:string;plan:IllustrationPlan;requestId:string;attempt:number;state:'preparing'|'failed'|'active';recoverable:boolean;nextAt:number;lease?:string;leaseUntil:number;taskId?:string;error?:string;asset?:{sha256:string;bytes:number;width:768;height:1024}}
export type IllustrationProducer=(job:IllustrationJob,onTask:(id:string)=>void)=>Promise<Uint8Array>
/** Source selection is authoritative; no player text, identity or save is sent. */
export function originalIllustrationPlan(head:OriginalHead):IllustrationPlan{
 const id=originalSceneBackgroundVersion(head.assets,head.sceneId)
 if(!id)throw new LabError('ILLUSTRATION_BACKGROUND_UNAVAILABLE',409)
 const base=originalBaseAssets(head.assets),background=base?.version===3?base.background:base
 const published=background?.version===2&&head.sceneId==='train-at-dead-station'?background.published:undefined
 const source=published??originalBackgroundReleases[id]
 if(!source)throw new LabError('ILLUSTRATION_BACKGROUND_UNAVAILABLE',409)
 if(!published&&!originalBackgroundSourcePaths[id])throw new LabError('ILLUSTRATION_BACKGROUND_UNAVAILABLE',409)
 const reference=published?`https://game.aiwaves.tech/${GAME_ID}${backgroundReleasePath(published.id)}/file`:`https://raw.githubusercontent.com/yinxinghuan/rpgjs-story-lab/${COMMIT}/${originalBackgroundSourcePaths[id]}`
 const night=[ORIGINAL_BACKGROUND_BASELINE,ORIGINAL_BACKGROUND_PLATFORM].includes(id)?' This exact scene is a DARK RAINY NIGHT, not daytime or dusk. Preserve the deep blue-black shadows, dark teal wet pavement, small isolated amber lamp pools and almost-black foliage. Keep most of the image dark. No global gray fill light, bright concrete or daylight.':''
 return {version:2,scene:head.sceneId,sourceVersion:head.version,referenceVersion:id,referenceSha256:source.sha256,request:{sessionId:GAME_ID,mode:'edit',referenceUrls:[reference],size:{...size},prompt:'Produce a faithful pixel-painted image of this exact railway environment for a travel journal. Copy the source palette, illumination and textured pixel detail; do not simplify it into a line drawing, comic, vector graphic or flat poster.'+night+' Preserve the reference location, narrow paths, tracks, architectural proportions, strong overhead orthographic view, time of day, weather and visible structures. Environment only: no people, faces, animals, writing, labels, new doors, new buildings, extra vehicles or objects. Do not depict a rescue, victory, repair or any new event. This is a visual memory of a visited place, not a playable map or a change to the world. Compose the complete reference location within a 3:4 portrait frame without stretching geometry.'}}
}
const safeCodes=new Set(['RATE_LIMITED','QUEUE_BUSY','TIMEOUT','PROVIDER_REJECTED','REFERENCE_UNAVAILABLE','ORIGIN_NOT_ALLOWED','IMAGE_INVALID','ILLUSTRATION_TASK_MISMATCH'])
const publicJob=(j:IllustrationJob)=>({id:j.id,scene:j.plan.scene,sourceVersion:j.plan.sourceVersion,referenceVersion:j.plan.referenceVersion,state:j.state,attempt:j.attempt,recoverable:j.recoverable,nextAt:j.nextAt,...(j.error?{error:j.error}:{}),...(j.asset?{asset:j.asset}:{})})
/** Separate rows in the existing authority DB: asynchronous media never writes
 * a StorySave, action receipt, position, resource counter or scene binding. */
export class OriginalIllustrations{
 constructor(private db:AuthorityStorage,private head:(owner:string,id:string)=>OriginalHead,private now:()=>number=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS original_illustrations(owner TEXT NOT NULL, session TEXT NOT NULL, scene TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,session,scene))')
  db.run('CREATE TABLE IF NOT EXISTS original_illustration_parts(owner TEXT NOT NULL, session TEXT NOT NULL, scene TEXT NOT NULL, part INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,session,scene,part))')
  db.run('CREATE TABLE IF NOT EXISTS original_illustration_usage(owner TEXT NOT NULL, day INTEGER NOT NULL, uses INTEGER NOT NULL, PRIMARY KEY(owner,day))')
 }
 private get(owner:string,id:string,scene:string){const r=this.db.all<{data:string}>('SELECT data FROM original_illustrations WHERE owner=? AND session=? AND scene=?',owner,id,scene)[0];return r?JSON.parse(r.data) as IllustrationJob:undefined}
 private put(owner:string,id:string,j:IllustrationJob){this.db.run('INSERT INTO original_illustrations VALUES(?,?,?,?) ON CONFLICT(owner,session,scene) DO UPDATE SET data=excluded.data',owner,id,j.plan.scene,JSON.stringify(j))}
 list(owner:string,id:string){this.head(owner,id);return this.db.all<{data:string}>('SELECT data FROM original_illustrations WHERE owner=? AND session=? ORDER BY scene',owner,id).map(r=>publicJob(JSON.parse(r.data)))}
 start(owner:string,id:string,body:any){const h=this.head(owner,id);return this.db.transaction(()=>{
  if(!body||Object.keys(body).sort().join(',')!=='expected_version,retry,scene'||typeof body.retry!=='boolean'||!Number.isSafeInteger(body.expected_version)||typeof body.scene!=='string')throw new LabError('INVALID_ILLUSTRATION_REQUEST')
  const old=this.get(owner,id,body.scene)
  // A retry after a lost reply can recover the old job even after walking away.
  if(old&&(!body.retry||old.recoverable||old.state==='active'))return publicJob(old)
  if(h.sceneId!==body.scene||h.version!==body.expected_version)throw new LabError('ILLUSTRATION_SCENE_CHANGED',409)
  if(old&&old.nextAt>this.now())throw new LabError('ILLUSTRATION_RETRY_LATER',429)
  if(old&&old.attempt>=2)throw new LabError('ILLUSTRATION_ATTEMPT_LIMIT',429)
  const plan=originalIllustrationPlan(h),day=Math.floor(this.now()/86400000)
  const uses=this.db.all<{uses:number}>('SELECT uses FROM original_illustration_usage WHERE owner=? AND day=?',owner,day)[0]?.uses??0
  if(uses>=18)throw new LabError('ILLUSTRATION_DAILY_LIMIT',429)
  this.db.run('INSERT INTO original_illustration_usage VALUES(?,?,?) ON CONFLICT(owner,day) DO UPDATE SET uses=excluded.uses',owner,day,uses+1)
  const job:IllustrationJob={id:old?.id??crypto.randomUUID(),plan,requestId:crypto.randomUUID(),attempt:(old?.attempt??0)+1,state:'preparing',recoverable:true,nextAt:0,leaseUntil:0}
  this.put(owner,id,job);return publicJob(job)
 })}
 async run(owner:string,id:string,scene:string,produce:IllustrationProducer){
  this.head(owner,id)
  const claimed=this.db.transaction(()=>{const j=this.get(owner,id,scene);if(!j||!j.recoverable||j.nextAt>this.now()||j.leaseUntil>this.now())return;j.state='preparing';j.lease=crypto.randomUUID();j.leaseUntil=this.now()+120000;delete j.error;this.put(owner,id,j);return structuredClone(j)})
  if(!claimed)return
  const update=(work:(j:IllustrationJob)=>void)=>this.db.transaction(()=>{const j=this.get(owner,id,scene);if(j?.requestId!==claimed.requestId||j.lease!==claimed.lease)return;work(j);this.put(owner,id,j)})
  try{
   const bytes=await produce(claimed,taskId=>{if(!/^[A-Za-z0-9_-]{1,160}$/.test(taskId))throw Error('ILLUSTRATION_TASK_MISMATCH');update(j=>{if(j.taskId&&j.taskId!==taskId)throw Error('ILLUSTRATION_TASK_MISMATCH');j.taskId=taskId})})
   if(bytes.length>8*1024*1024)throw Error('IMAGE_INVALID')
   const asset=await inspectJournalPng(bytes)
   update(j=>{
    this.db.run('DELETE FROM original_illustration_parts WHERE owner=? AND session=? AND scene=?',owner,id,scene)
    for(let n=0;n<bytes.length;n+=24000)this.db.run('INSERT INTO original_illustration_parts VALUES(?,?,?,?,?)',owner,id,scene,n/24000,btoa(String.fromCharCode(...bytes.subarray(n,n+24000))))
    j.asset=asset;j.state='active';j.recoverable=false;j.leaseUntil=0;delete j.lease;delete j.error
   })
  }catch(e){const code=e instanceof MediaServiceError?e.code:e instanceof Error?e.message:'';update(j=>{j.state='failed';j.error=safeCodes.has(code)?code:'ILLUSTRATION_UNAVAILABLE';j.recoverable=!['IMAGE_INVALID','ILLUSTRATION_TASK_MISMATCH'].includes(code)&&!(e instanceof MediaServiceError&&!e.retryable&&e.status>0);j.nextAt=this.now()+Math.max(8000,(e instanceof MediaServiceError?e.retryAfterSeconds??0:0)*1000);j.leaseUntil=0;delete j.lease})}
 }
 async file(owner:string,id:string,scene:string){
  this.head(owner,id);const j=this.get(owner,id,scene);if(j?.state!=='active'||!j.asset)throw new LabError('ILLUSTRATION_NOT_READY',409)
  const rows=this.db.all<{part:number;data:string}>('SELECT part,data FROM original_illustration_parts WHERE owner=? AND session=? AND scene=? ORDER BY part',owner,id,scene),out=new Uint8Array(j.asset.bytes);let at=0
  rows.forEach((r,i)=>{if(r.part!==i)throw Error('IMAGE_INVALID');const b=Uint8Array.from(atob(r.data),c=>c.charCodeAt(0));out.set(b,at);at+=b.length})
  if(at!==out.length||(await inspectJournalPng(out)).sha256!==j.asset.sha256)throw new LabError('ILLUSTRATION_ASSET_CHANGED',409)
  return out
 }
}
/** Stable platform client only; retained bytes remove future CDN dependence. */
export const originalIllustrationProducer=(request:typeof fetch=fetch):IllustrationProducer=>async(job,onTask)=>{
 const signal=AbortSignal.timeout(90000)
 const options={signal,pollIntervalMs:8000,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{
  const r=await request(input,init)
  if(r.ok){const t=await r.clone().json();if(t.request_id!==job.requestId||job.taskId&&t.task_id!==job.taskId)throw Error('ILLUSTRATION_TASK_MISMATCH');onTask(t.task_id)}
  return r
 }}
 const task=job.taskId?await waitForMediaTask(job.taskId,options):await generateImageMedia({...job.plan.request,requestId:job.requestId},options)
 if(task.request_id!==job.requestId||task.status!=='succeeded'||task.media?.type!=='image'||task.media.format!=='png'||task.media.width!==768||task.media.height!==1024)throw Error('IMAGE_INVALID')
 const u=new URL(task.media.url)
 if(u.protocol!=='https:'||u.username||u.password||u.port||!['cdn.aiwaves.tech','images.aiwaves.tech','game.aiwaves.tech'].includes(u.hostname))throw Error('IMAGE_INVALID')
 const r=await request(u,{signal,credentials:'omit',redirect:'error'})
 if(!r.ok||!r.body)throw Error('ILLUSTRATION_UNAVAILABLE')
 const reader=r.body.getReader(),chunks:Uint8Array[]=[];let n=0
 for(;;){const {done,value}=await reader.read();if(done)break;n+=value.length;if(n>8*1024*1024){await reader.cancel();throw Error('IMAGE_INVALID')}chunks.push(value)}
 const bytes=new Uint8Array(n);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length}await inspectJournalPng(bytes);return bytes
}
