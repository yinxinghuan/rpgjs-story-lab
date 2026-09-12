import {originalIllustrationEligible} from '../src/original-illustration-admission'
import type {AuthorityStorage} from './session-authority'
import type {OriginalHead} from './original-train-runtime'
import {originalBackgroundReleases,originalSceneBackgroundVersion,originalBaseAssets,ORIGINAL_BACKGROUND_BASELINE,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
import {backgroundReleasePath} from '../src/background-publication'
import {originalBackgroundSourcePaths} from '../src/original-background-sources'
import {GAME_ID} from '../src/game-id'
import {LabError} from '../src/journey-runtime'
import {generateImageMedia,waitForMediaTask,MediaServiceError,type GenerateImageMediaRequest} from '../src/vendor/media/client'
import {inspectJournalPng} from './journal-image'

// New requests remain limited by originalIllustrationEligible.
export const ORIGINAL_ILLUSTRATION_RELEASED=true
const COMMIT='8c4ebb1d42397286d91a7d511fc0d41d1f7a144a'
const size={width:768,height:1024} as const
export type IllustrationPlan={version:1|2|3;scene:string;sourceVersion:number;referenceVersion:string;referenceSha256:string;request:GenerateImageMediaRequest}
export type IllustrationJob={id:string;plan:IllustrationPlan;requestId:string;attempt:number;state:'preparing'|'failed'|'candidate'|'active'|'discarded';recoverable:boolean;nextAt:number;lease?:string;leaseUntil:number;taskId?:string;error?:string;asset?:{sha256:string;bytes:number;width:768;height:1024};decision?:{verdict:'kept'|'discarded';sha256:string;at:number}}
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
 const night=[ORIGINAL_BACKGROUND_BASELINE,ORIGINAL_BACKGROUND_PLATFORM].includes(id)?' It is a rainy night: retain the blue-teal wet ground and warm existing lamps. Night does not mean underexposed: the locomotive roof, platform edges and paving must remain as readable as in the reference. Do not darken the source or add daylight, fog, a gray wash or new lamps.':' Preserve the reference time of day, weather and existing lighting; do not add new light sources or change exposure.'
 return {version:3,scene:head.sceneId,sourceVersion:head.version,referenceVersion:id,referenceSha256:source.sha256,request:{sessionId:GAME_ID,mode:'edit',referenceUrls:[reference],size:{...size},prompt:'Create a faithful travel-journal illustration of the railway environment in the reference. Match the reference exposure, midtone brightness, local contrast, colors and textured pixel detail.'+night+' Preserve every existing structure, track, narrow walkway, vehicle silhouette and its relative position, using the same overhead orthographic camera and proportions. Environment only; no people, faces, animals, writing or labels. No new objects, doors, buildings, vehicles or story events. Fit the full reference location into a 3:4 portrait composition without stretching its geometry. This is a visual memory, not a new map.'}}
}
const safeCodes=new Set(['RATE_LIMITED','QUEUE_BUSY','TIMEOUT','PROVIDER_REJECTED','REFERENCE_UNAVAILABLE','ORIGIN_NOT_ALLOWED','IMAGE_INVALID','ILLUSTRATION_TASK_MISMATCH','ILLUSTRATION_MEDIA_NETWORK','ILLUSTRATION_MEDIA_RESPONSE','ILLUSTRATION_ASSET_NETWORK','ILLUSTRATION_ASSET_STREAM'])
/** Only bounded stage/status codes leave the service; never exception messages or URLs. */
export function originalIllustrationFailureCode(error:unknown){
 const code=error instanceof MediaServiceError?error.code:error instanceof Error?error.message:''
 if(safeCodes.has(code)||/^ILLUSTRATION_ASSET_HTTP_[1-5][0-9]{2}$/.test(code))return code
 if(error instanceof MediaServiceError&&Number.isInteger(error.status)&&error.status>=100&&error.status<=599)return 'ILLUSTRATION_MEDIA_HTTP_'+error.status
 return 'ILLUSTRATION_UNAVAILABLE'
}
const normalize=(j:IllustrationJob):IllustrationJob=>j.state==='active'&&(j.decision?.verdict!=='kept'||j.decision.sha256!==j.asset?.sha256)?{...j,state:'candidate',decision:undefined}:j
const publicJob=(value:IllustrationJob)=>{const j=normalize(value);return {id:j.id,scene:j.plan.scene,sourceVersion:j.plan.sourceVersion,referenceVersion:j.plan.referenceVersion,reference:{url:j.plan.request.referenceUrls![0],sha256:j.plan.referenceSha256},state:j.state,attempt:j.attempt,recoverable:j.recoverable,nextAt:j.nextAt,...(j.error?{error:j.error}:{}),...(j.asset?{asset:j.asset}:{}),...(j.decision?{decision:j.decision}:{})}}
/** Separate rows in the existing authority DB: asynchronous media never writes
 * a StorySave, action receipt, position, resource counter or scene binding. */
export class OriginalIllustrations{
 constructor(private db:AuthorityStorage,private head:(owner:string,id:string)=>OriginalHead,private now:()=>number=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS original_illustrations(owner TEXT NOT NULL, session TEXT NOT NULL, scene TEXT NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,session,scene))')
  db.run('CREATE TABLE IF NOT EXISTS original_illustration_parts(owner TEXT NOT NULL, session TEXT NOT NULL, scene TEXT NOT NULL, part INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,session,scene,part))')
  db.run('CREATE TABLE IF NOT EXISTS original_illustration_usage(owner TEXT NOT NULL, day INTEGER NOT NULL, uses INTEGER NOT NULL, PRIMARY KEY(owner,day))')
  db.run('CREATE TABLE IF NOT EXISTS original_illustration_attempts(owner TEXT NOT NULL, session TEXT NOT NULL, scene TEXT NOT NULL, attempt INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,session,scene,attempt))')
  db.run('CREATE TABLE IF NOT EXISTS original_illustration_attempt_parts(owner TEXT NOT NULL, session TEXT NOT NULL, scene TEXT NOT NULL, attempt INTEGER NOT NULL, part INTEGER NOT NULL, data TEXT NOT NULL, PRIMARY KEY(owner,session,scene,attempt,part))')
 }
 private get(owner:string,id:string,scene:string){const r=this.db.all<{data:string}>('SELECT data FROM original_illustrations WHERE owner=? AND session=? AND scene=?',owner,id,scene)[0];return r?normalize(JSON.parse(r.data)):undefined}
 private archived(owner:string,id:string,scene:string,attempt:number){const row=this.db.all<{data:string}>('SELECT data FROM original_illustration_attempts WHERE owner=? AND session=? AND scene=? AND attempt=?',owner,id,scene,attempt)[0];return row?normalize(JSON.parse(row.data)):undefined}
 private archive(owner:string,id:string,j:IllustrationJob){this.db.run('INSERT INTO original_illustration_attempts VALUES(?,?,?,?,?)',owner,id,j.plan.scene,j.attempt,JSON.stringify(j));if(j.asset)this.db.run('INSERT INTO original_illustration_attempt_parts SELECT owner,session,scene,?,part,data FROM original_illustration_parts WHERE owner=? AND session=? AND scene=?',j.attempt,owner,id,j.plan.scene)}
 private put(owner:string,id:string,j:IllustrationJob){this.db.run('INSERT INTO original_illustrations VALUES(?,?,?,?) ON CONFLICT(owner,session,scene) DO UPDATE SET data=excluded.data',owner,id,j.plan.scene,JSON.stringify(j))}
 list(owner:string,id:string){this.head(owner,id);return this.db.all<{data:string}>('SELECT data FROM original_illustrations WHERE owner=? AND session=? ORDER BY scene',owner,id).map(r=>publicJob(JSON.parse(r.data)))}
 start(owner:string,id:string,body:any){const h=this.head(owner,id);return this.db.transaction(()=>{
  if(!body||Object.keys(body).sort().join(',')!=='expected_version,retry,scene'||typeof body.retry!=='boolean'||!Number.isSafeInteger(body.expected_version)||typeof body.scene!=='string')throw new LabError('INVALID_ILLUSTRATION_REQUEST')
  const old=this.get(owner,id,body.scene)
  // A retry after a lost reply can recover the old job even after walking away.
  if(old&&(!body.retry||old.recoverable||old.state==='active'||old.state==='candidate'))return publicJob(old)
  if((!old&&h.sceneId!==body.scene)||h.version!==body.expected_version)throw new LabError('ILLUSTRATION_SCENE_CHANGED',409)
  if(!old&&!originalIllustrationEligible(h.assets,h.sceneId))throw new LabError('ILLUSTRATION_SCENE_NOT_ADMITTED',409)
  if(old&&old.nextAt>this.now())throw new LabError('ILLUSTRATION_RETRY_LATER',429)
  if(old&&old.attempt>=2)throw new LabError('ILLUSTRATION_ATTEMPT_LIMIT',429)
  // Retrying a visited scene must not require returning along a one-way story
  // route, or accidentally use the player's new location as its reference.
  const plan=old?structuredClone(old.plan):originalIllustrationPlan(h),day=Math.floor(this.now()/86400000)
  const uses=this.db.all<{uses:number}>('SELECT uses FROM original_illustration_usage WHERE owner=? AND day=?',owner,day)[0]?.uses??0
  if(uses>=18)throw new LabError('ILLUSTRATION_DAILY_LIMIT',429)
  this.db.run('INSERT INTO original_illustration_usage VALUES(?,?,?) ON CONFLICT(owner,day) DO UPDATE SET uses=excluded.uses',owner,day,uses+1)
  const job:IllustrationJob={id:old?.id??crypto.randomUUID(),plan,requestId:crypto.randomUUID(),attempt:(old?.attempt??0)+1,state:'preparing',recoverable:true,nextAt:0,leaseUntil:0}
  if(old)this.archive(owner,id,old)
  this.put(owner,id,job);return publicJob(job)
 })}
 decide(owner:string,id:string,body:any){this.head(owner,id);return this.db.transaction(()=>{
  if(!body||Object.keys(body).sort().join(',')!=='attempt,decision,scene,sha256'||typeof body.scene!=='string'||![1,2].includes(body.attempt)||!['keep','discard'].includes(body.decision)||typeof body.sha256!=='string'||!/^[a-f0-9]{64}$/.test(body.sha256))throw new LabError('INVALID_ILLUSTRATION_DECISION')
  const current=this.get(owner,id,body.scene),j=current?.attempt===body.attempt?current:this.archived(owner,id,body.scene,body.attempt),verdict=body.decision==='keep'?'kept':'discarded'
  if(!j?.asset||j.asset.sha256!==body.sha256)throw new LabError('ILLUSTRATION_CANDIDATE_CHANGED',409)
  if(j.decision){if(j.decision.verdict!==verdict)throw new LabError('ILLUSTRATION_DECISION_CONFLICT',409);return publicJob(j)}
  if(j.state!=='candidate'||j.attempt!==current?.attempt)throw new LabError('ILLUSTRATION_NOT_CANDIDATE',409)
  j.decision={verdict,sha256:body.sha256,at:this.now()};j.state=verdict==='kept'?'active':'discarded';j.recoverable=false;j.nextAt=0;delete j.error;this.put(owner,id,j);return publicJob(j)
 })}
 history(owner:string,id:string,scene:string){this.head(owner,id);const old=this.db.all<{data:string}>('SELECT data FROM original_illustration_attempts WHERE owner=? AND session=? AND scene=? ORDER BY attempt',owner,id,scene).map(r=>publicJob(JSON.parse(r.data))),current=this.get(owner,id,scene);return current?[...old,publicJob(current)]:old}
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
    j.asset=asset;j.state='candidate';j.recoverable=false;j.leaseUntil=0;delete j.lease;delete j.error
   })
  }catch(e){const code=e instanceof MediaServiceError?e.code:e instanceof Error?e.message:'';update(j=>{j.state='failed';j.error=originalIllustrationFailureCode(e);j.recoverable=!['IMAGE_INVALID','ILLUSTRATION_TASK_MISMATCH'].includes(code)&&!(e instanceof MediaServiceError&&!e.retryable&&e.status>0);j.nextAt=this.now()+Math.max(8000,(e instanceof MediaServiceError?e.retryAfterSeconds??0:0)*1000);j.leaseUntil=0;delete j.lease})}
 }
 async file(owner:string,id:string,scene:string,attempt?:number){
  this.head(owner,id);const current=this.get(owner,id,scene),archived=attempt!==undefined&&attempt!==current?.attempt,j=archived?this.archived(owner,id,scene,attempt):current
  if(!j?.asset||(!['candidate','active'].includes(j.state)&&!(attempt!==undefined&&j.state==='discarded')))throw new LabError('ILLUSTRATION_NOT_READY',409)
  const rows=archived?this.db.all<{part:number;data:string}>('SELECT part,data FROM original_illustration_attempt_parts WHERE owner=? AND session=? AND scene=? AND attempt=? ORDER BY part',owner,id,scene,attempt):this.db.all<{part:number;data:string}>('SELECT part,data FROM original_illustration_parts WHERE owner=? AND session=? AND scene=? ORDER BY part',owner,id,scene),out=new Uint8Array(j.asset.bytes);let at=0
  rows.forEach((r,i)=>{if(r.part!==i)throw Error('IMAGE_INVALID');const b=Uint8Array.from(atob(r.data),c=>c.charCodeAt(0));out.set(b,at);at+=b.length})
  if(at!==out.length||(await inspectJournalPng(out)).sha256!==j.asset.sha256)throw new LabError('ILLUSTRATION_ASSET_CHANGED',409)
  return out
 }
}
/** Stable platform client only; retained bytes remove future CDN dependence. */
export const originalIllustrationProducer=(request:typeof fetch=fetch):IllustrationProducer=>async(job,onTask)=>{
 const signal=AbortSignal.timeout(90000)
 const options={signal,pollIntervalMs:8000,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{
  let r:Response
  try{r=await request(input,init)}catch{throw Error(signal.aborted?'TIMEOUT':'ILLUSTRATION_MEDIA_NETWORK')}
  if(r.ok){let t:any;try{t=await r.clone().json()}catch{throw Error('ILLUSTRATION_MEDIA_RESPONSE')}if(t?.request_id!==job.requestId||job.taskId&&t?.task_id!==job.taskId)throw Error('ILLUSTRATION_TASK_MISMATCH');onTask(t.task_id)}
  return r
 }}
 const task=job.taskId?await waitForMediaTask(job.taskId,options):await generateImageMedia({...job.plan.request,requestId:job.requestId},options)
 if(task.request_id!==job.requestId||task.status!=='succeeded'||task.media?.type!=='image'||task.media.format!=='png'||task.media.width!==768||task.media.height!==1024)throw Error('IMAGE_INVALID')
 const u=new URL(task.media.url)
 if(u.protocol!=='https:'||u.username||u.password||u.port||!['cdn.aiwaves.tech','images.aiwaves.tech','game.aiwaves.tech'].includes(u.hostname))throw Error('IMAGE_INVALID')
 let r:Response
 try{r=await request(u,{signal,credentials:'omit',redirect:'error'})}catch{throw Error(signal.aborted?'TIMEOUT':'ILLUSTRATION_ASSET_NETWORK')}
 if(!r.ok)throw Error('ILLUSTRATION_ASSET_HTTP_'+r.status)
 if(!r.body)throw Error('ILLUSTRATION_ASSET_STREAM')
 const reader=r.body.getReader(),chunks:Uint8Array[]=[];let n=0
 for(;;){let result:ReadableStreamReadResult<Uint8Array>;try{result=await reader.read()}catch{throw Error(signal.aborted?'TIMEOUT':'ILLUSTRATION_ASSET_STREAM')}const {done,value}=result;if(done)break;n+=value.length;if(n>8*1024*1024){await reader.cancel();throw Error('IMAGE_INVALID')}chunks.push(value)}
 const bytes=new Uint8Array(n);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length}await inspectJournalPng(bytes);return bytes
}
