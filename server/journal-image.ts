import {GAME_ID} from '../src/game-id'
import {artDirection} from '../src/art-catalog'
import type {JournalImage} from '../src/journal-image'
import {LabError,type Head} from '../src/journey-runtime'
import {generateImageMedia,getMediaTask,waitForMediaTask,MediaServiceError,type MediaTask} from '../src/vendor/media/client'
export const IMAGE_SIZE={width:768,height:1024} as const
export const IMAGE_PROMPT='Create an atmospheric illustrated journal page of the completed railway rescue. Use the reference as the exact environment and overhead orthogonal viewing direction: a narrow wooden walkway within railings, warm lamps, railway tracks on both sides, fixed call point at its far end. Preserve the narrow proportions and parallel geometry. Night after rain, steady warm lighting, calm relief. Environment only: absolutely no people, faces, letters, text, new doors, extra rooms, fantasy objects or vehicles. This is a memory illustration of a safe arrival, not a new event. Compose a complete 3:4 frame.'
const reference='https://raw.githubusercontent.com/yinxinghuan/rpgjs-story-lab/c063c798aa2b3be91300dc3d950b28a283dd0ee7/public/art/rescue-walkway.png'
const referenceSha256='f96e5ba15ed9e0c6603ea5bda66da31506b7e397ed97e4af9e9a10656809dd0c'
export interface ImageJobStore{get():Head;update(change:(head:Head)=>void):void}
export type ImageProducer=(job:JournalImage,onTask:(taskId:string)=>void)=>Promise<JournalImage['asset']>
const safeCodes=new Set(['RATE_LIMITED','QUEUE_BUSY','TIMEOUT','INVALID_REQUEST','REFERENCE_UNAVAILABLE','PROVIDER_REJECTED','PROVIDER_TASK_LOST','NOT_FOUND','ORIGIN_NOT_ALLOWED','INVALID_RESPONSE','IMAGE_INVALID','IMAGE_UNAVAILABLE'])
export function startJournalImage(store:ImageJobStore,retry=false,now=Date.now()):JournalImage{
 let result!:JournalImage
 store.update(head=>{
  if(!head.save.facts.journey_complete)throw new LabError('IMAGE_NOT_ELIGIBLE',409)
  const old=head.journalImage
  if(old&&!(retry&&old.state==='failed'&&!old.recoverable)){result=old;return}
  if(old&&now<old.nextAt)throw new LabError('IMAGE_RETRY_LATER',429)
  if(old&&old.attempt>=2)throw new LabError('IMAGE_ATTEMPT_LIMIT',429)
  result={version:1,state:'preparing',requestId:crypto.randomUUID(),attempt:(old?.attempt??0)+1,leaseUntil:0,nextAt:0,recoverable:true,plan:{version:1,scene:'walkway',artVersion:artDirection.referenceVersion,sourceVersion:head.version,referenceSha256,request:{sessionId:GAME_ID,mode:'edit',prompt:IMAGE_PROMPT,referenceUrls:[reference],size:{...IMAGE_SIZE}}}}
  head.journalImage=result
 })
 return result
}
/** A persisted lease fences late completions. Restart/resume keeps the media request ID. */
export async function runJournalImage(store:ImageJobStore,produce:ImageProducer,now:()=>number=Date.now){
 let claimed:JournalImage|undefined
 store.update(head=>{
  const j=head.journalImage,t=now()
  if(!j||j.state==='active'||!j.recoverable||j.nextAt>t||j.leaseUntil>t)return
  j.state='preparing';j.lease=crypto.randomUUID();j.leaseUntil=t+120000;delete j.error
  claimed=structuredClone(j)
 })
 if(!claimed)return
 const job=claimed
 const update=(change:(j:JournalImage)=>void)=>store.update(head=>{
  const j=head.journalImage
  if(j?.requestId===job.requestId&&j.lease===job.lease)change(j)
 })
 try{
  const asset=await produce(job,taskId=>{if(typeof taskId==='string'&&taskId.length<=160)update(j=>{j.taskId=taskId})})
  if(!asset||!allowedImageUrl(asset.url)||asset.width!==768||asset.height!==1024||!Number.isInteger(asset.bytes)||asset.bytes<45||asset.bytes>8*1024*1024||!/^[a-f0-9]{64}$/.test(asset.sha256))throw Error('IMAGE_INVALID')
  update(j=>{j.asset=asset;j.state='active';j.recoverable=false;j.leaseUntil=0;delete j.lease;delete j.error})
 }catch(error){
  const code=error instanceof MediaServiceError?error.code:error instanceof Error?error.message:'IMAGE_UNAVAILABLE'
  // Only a structured terminal response establishes that a new generation is safe.
  const recoverable=code!=='IMAGE_INVALID'&&!(error instanceof MediaServiceError&&!error.retryable&&error.status>0)
  update(j=>{j.state='failed';j.recoverable=recoverable;j.leaseUntil=0;delete j.lease;j.error=safeCodes.has(code)?code:'IMAGE_UNAVAILABLE';j.nextAt=now()+Math.max(8000,(error instanceof MediaServiceError?error.retryAfterSeconds??0:0)*1000)})
 }
}
export function publicImageJob(job?:JournalImage){
 if(!job)return null
 const {lease,leaseUntil,requestId,asset,plan,taskId,...publicJob}=job
 return {...publicJob,asset:asset?{sha256:asset.sha256,bytes:asset.bytes,width:asset.width,height:asset.height}:undefined}
}
export function allowedImageUrl(value:string){
 try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password&&!u.port&&['cdn.aiwaves.tech','images.aiwaves.tech','game.aiwaves.tech'].includes(u.hostname)}catch{return false}
}
async function download(url:string,request:typeof fetch,signal:AbortSignal){
 if(!allowedImageUrl(url))throw Error('IMAGE_INVALID')
 const r=await request(url,{signal,redirect:'error'})
 if(!r.ok||!r.body)throw Error('IMAGE_UNAVAILABLE')
 const chunks:Uint8Array[]=[],reader=r.body.getReader();let length=0
 for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8*1024*1024){await reader.cancel();throw Error('IMAGE_INVALID')}chunks.push(value)}
 const bytes=new Uint8Array(length);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length}
 return bytes
}
export async function inspectJournalPng(bytes:Uint8Array){
 const view=new DataView(bytes.buffer,bytes.byteOffset,bytes.byteLength)
 if(bytes.length<45||!bytes.subarray(0,8).every((v,i)=>v===[137,80,78,71,13,10,26,10][i])||view.getUint32(8)!==13||String.fromCharCode(...bytes.subarray(12,16))!=='IHDR'||view.getUint32(16)!==768||view.getUint32(20)!==1024)throw Error('IMAGE_INVALID')
 let offset=8,sawData=false,sawEnd=false
 while(offset+12<=bytes.length){
  const size=view.getUint32(offset),end=offset+12+size
  if(end>bytes.length)throw Error('IMAGE_INVALID')
  const kind=String.fromCharCode(...bytes.subarray(offset+4,offset+8))
  if(kind==='IDAT'&&size>0)sawData=true
  if(kind==='IEND'){if(size!==0||end!==bytes.length)throw Error('IMAGE_INVALID');sawEnd=true}
  offset=end
 }
 if(offset!==bytes.length||!sawData||!sawEnd)throw Error('IMAGE_INVALID')
 // Actual decode remains a separate browser gate; metadata is not perceptual QA.
 const sha256=[...new Uint8Array(await crypto.subtle.digest('SHA-256',new Uint8Array(bytes)))].map(b=>b.toString(16).padStart(2,'0')).join('')
 return {sha256,bytes:bytes.length,...IMAGE_SIZE}
}
export function createJournalImageProducer(request:typeof fetch=fetch):ImageProducer{
 return async(job,onTask)=>{
  const signal=AbortSignal.timeout(90000)
  const options={signal,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{
   const response=await request(input,init)
   if(response.ok){try{const task=await response.clone().json() as MediaTask;if(task.request_id===job.requestId&&typeof task.task_id==='string')onTask(task.task_id)}catch{}}
   return response
  }}
  const task=job.taskId?await waitForMediaTask(await getMediaTask(job.taskId,options),options):await generateImageMedia({...job.plan.request,requestId:job.requestId},options)
  if(task.request_id!==job.requestId||task.status!=='succeeded'||task.media?.type!=='image'||task.media.width!==768||task.media.height!==1024||task.media.format!=='png')throw new MediaServiceError('INVALID_RESPONSE','Image mismatch',200,false)
  const bytes=await download(task.media.url,request,signal)
  return {url:task.media.url,...await inspectJournalPng(bytes)}
 }
}
export async function readJournalImageAsset(job:JournalImage,request:typeof fetch=fetch){
 if(job.state!=='active'||!job.asset)throw new LabError('IMAGE_NOT_READY',409)
 const bytes=await download(job.asset.url,request,AbortSignal.timeout(20000)),info=await inspectJournalPng(bytes)
 if(info.sha256!==job.asset.sha256||info.bytes!==job.asset.bytes)throw new LabError('IMAGE_VERSION_CHANGED',409)
 return bytes
}
