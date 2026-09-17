import type {AuthorityStorage} from './session-authority'
import type {OldStreetHead} from '../src/old-street-head'
import type {ExpansionPlan} from '../src/old-street-expansion-plan'
import {LabError} from '../src/journey-runtime'
import {GAME_ID} from '../src/game-id'
import {allowedImageUrl,inspectSizedPng} from './journal-image'
import {generateImageMedia,waitForMediaTask,MediaServiceError} from '../src/vendor/media/client'

const size={width:768,height:576} as const
type Asset={sha256:string;bytes:number;width:number;height:number}
const inspectPhoto=(bytes:Uint8Array)=>inspectSizedPng(bytes,size)
export type ExpansionPhotoJob={id:string;requestId:string;prompt:string;attempt:number;state:'preparing'|'failed'|'candidate';recoverable:boolean;nextAt:number;lease?:string;leaseUntil:number;taskId?:string;asset?:Asset;error?:'PHOTO_UNAVAILABLE'|'PHOTO_INVALID'}
export type ExpansionPhotoProducer=(job:ExpansionPhotoJob,onTask:(id:string)=>void)=>Promise<Uint8Array>
/** A photo belongs to the saved expansion intent, not to the player's current room. */
export class OldStreetExpansionMedia{
 constructor(private db:AuthorityStorage,private head:(owner:string,id:string)=>OldStreetHead,private plan:(head:OldStreetHead)=>ExpansionPlan|undefined,private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_expansion_media(owner TEXT NOT NULL,journey TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,id))')
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_expansion_media_history(owner TEXT NOT NULL,journey TEXT NOT NULL,id TEXT NOT NULL,attempt INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,id,attempt))')
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_expansion_media_history_parts(owner TEXT NOT NULL,journey TEXT NOT NULL,id TEXT NOT NULL,attempt INTEGER NOT NULL,part INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,id,attempt,part))')
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_expansion_media_parts(owner TEXT NOT NULL,journey TEXT NOT NULL,id TEXT NOT NULL,part INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,id,part))')
 }
 candidateFor(h:OldStreetHead){const id=h.expansions?.[0]?.id;if(!id)return;const rows=this.db.all<{data:string}>('SELECT data FROM oldstreet_expansion_media WHERE journey=? AND id=?',h.id,id);if(rows.length!==1)return;const j=JSON.parse(rows[0].data) as ExpansionPhotoJob;return j.state==='candidate'?j.asset?.sha256:undefined}
 private key(owner:string,journey:string){const h=this.head(owner,journey),id=h.expansions?.[0]?.id;if(!id)throw new LabError('EXPANSION_NOT_REQUESTED',409);return {h,id}}
 private read(owner:string,journey:string,id:string):ExpansionPhotoJob|undefined{const row=this.db.all<{data:string}>('SELECT data FROM oldstreet_expansion_media WHERE owner=? AND journey=? AND id=?',owner,journey,id)[0];return row?JSON.parse(row.data):undefined}
 private put(owner:string,journey:string,j:ExpansionPhotoJob){this.db.run('INSERT OR REPLACE INTO oldstreet_expansion_media VALUES(?,?,?,?)',owner,journey,j.id,JSON.stringify(j))}
 get(owner:string,journey:string){const {id}=this.key(owner,journey),j=this.read(owner,journey,id);if(!j)return null;return {id:j.id,state:j.state,attempt:j.attempt,recoverable:j.recoverable,nextAt:j.nextAt,asset:j.asset,error:j.error}}
 start(owner:string,journey:string,retry=false){
  const {h,id}=this.key(owner,journey)
  this.db.transaction(()=>{
   const old=this.read(owner,journey,id)
   if(h.save.facts['darkroom-photo-matched'])return
   if(old&&(!retry||old.recoverable))return
   if(old&&old.nextAt>this.now())throw new LabError('PHOTO_RETRY_LATER',429)
   const p=this.plan(h)
   if(!p||p.requestId!==id||!h.save.facts['darkroom-ready']||h.save.facts.departed)throw new LabError('PHOTO_NOT_ELIGIBLE',409)
   if(old){this.db.run('INSERT INTO oldstreet_expansion_media_history VALUES(?,?,?,?,?)',owner,journey,id,old.attempt,JSON.stringify(old));this.db.run('INSERT INTO oldstreet_expansion_media_history_parts SELECT owner,journey,id,?,part,data FROM oldstreet_expansion_media_parts WHERE owner=? AND journey=? AND id=?',old.attempt,owner,journey,id)}
   this.put(owner,journey,{id,requestId:crypto.randomUUID(),prompt:('PIXEL ART GAME ILLUSTRATION. Draw an old street as hand-placed 2D RPG pixel art, using crisp square pixel clusters, stepped silhouette edges, simplified textured surfaces and a strictly monochrome palette of black, charcoal, neutral gray and white. Work visually at 256 by 192 logical pixels enlarged exactly threefold; preserve detailed readable buildings without photographic microtexture. This is an illustrated collectible inside a pixel-art game, not a camera photograph. Scene subject: '+p.content.photograph.split(/(?<=[.!?])\s+/).filter(sentence=>!/puzzle|two-half|halves|panels|divider/i.test(sentence)).join(' ').replace(/a black and white photograph showing/ig,'').replace(/photograph/ig,'illustration')+' One uninterrupted landscape composition with asymmetrical buildings. Slight fading at the edges only. No color, no tinted highlights. No film grain, photographic noise, realistic rendering, airbrush gradients, sepia filter, borders, writing or dividing lines.'),attempt:(old?.attempt??0)+1,state:'preparing',recoverable:true,nextAt:0,leaseUntil:0})
  })
  return this.get(owner,journey)
 }
 async run(owner:string,journey:string,produce:ExpansionPhotoProducer){
  const {id}=this.key(owner,journey)
  const job=this.db.transaction(()=>{const j=this.read(owner,journey,id);if(!j?.recoverable||j.nextAt>this.now()||j.leaseUntil>this.now())return;j.state='preparing';j.lease=crypto.randomUUID();j.leaseUntil=this.now()+120000;delete j.error;this.put(owner,journey,j);return structuredClone(j)})
  if(!job)return
  const update=(change:(j:ExpansionPhotoJob)=>void)=>this.db.transaction(()=>{const j=this.read(owner,journey,id);if(j?.requestId===job.requestId&&j.lease===job.lease){change(j);this.put(owner,journey,j)}})
  try{
   const bytes=await produce(job,taskId=>{if(!/^[A-Za-z0-9_-]{1,160}$/.test(taskId))throw Error('PHOTO_INVALID');update(j=>{if(j.taskId&&j.taskId!==taskId)throw Error('PHOTO_INVALID');j.taskId=taskId})})
   if(bytes.length>8*1024*1024)throw Error('PHOTO_INVALID')
   const asset=await inspectPhoto(bytes)
   update(j=>{
    this.db.run('DELETE FROM oldstreet_expansion_media_parts WHERE owner=? AND journey=? AND id=?',owner,journey,id)
    for(let n=0;n<bytes.length;n+=24000)this.db.run('INSERT INTO oldstreet_expansion_media_parts VALUES(?,?,?,?,?)',owner,journey,id,n/24000,btoa(String.fromCharCode(...bytes.subarray(n,n+24000))))
    j.asset=asset;j.state='candidate';j.recoverable=false;j.leaseUntil=0;delete j.lease
   })
  }catch(e){update(j=>{const invalid=e instanceof Error&&['PHOTO_INVALID','IMAGE_INVALID'].includes(e.message);j.state='failed';j.error=invalid?'PHOTO_INVALID':'PHOTO_UNAVAILABLE';j.recoverable=!invalid&&!(e instanceof MediaServiceError&&!e.retryable&&e.status>0);j.nextAt=this.now()+Math.max(8000,(e instanceof MediaServiceError?e.retryAfterSeconds??0:0)*1000);j.leaseUntil=0;delete j.lease})}
 }
 async file(owner:string,journey:string){
  const {id}=this.key(owner,journey),j=this.read(owner,journey,id)
  if(j?.state!=='candidate'||!j.asset)throw new LabError('PHOTO_NOT_READY',409)
  const rows=this.db.all<{part:number;data:string}>('SELECT part,data FROM oldstreet_expansion_media_parts WHERE owner=? AND journey=? AND id=? ORDER BY part',owner,journey,id),bytes=new Uint8Array(j.asset.bytes);let at=0
  rows.forEach((r,i)=>{if(r.part!==i)throw Error('PHOTO_INVALID');const b=Uint8Array.from(atob(r.data),c=>c.charCodeAt(0));bytes.set(b,at);at+=b.length})
  if(at!==bytes.length||(await inspectPhoto(bytes)).sha256!==j.asset.sha256)throw Error('PHOTO_INVALID')
  return bytes
 }
}

export const expansionPhotoProducer=(request:typeof fetch=fetch):ExpansionPhotoProducer=>imageMediaProducer(size,request)
/** Same durable platform transport for square backpack art and landscape photographs. */
export const imageMediaProducer=(size:{width:number;height:number},request:typeof fetch=fetch):ExpansionPhotoProducer=>async(job,onTask)=>{
 const signal=AbortSignal.timeout(90000)
 const options={signal,pollIntervalMs:8000,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{
  const r=await request(input,init)
  if(r.ok){const t=await r.clone().json();if(t.request_id!==job.requestId||job.taskId&&t.task_id!==job.taskId)throw Error('PHOTO_INVALID');onTask(t.task_id)}
  return r
 }}
 const task=job.taskId?await waitForMediaTask(job.taskId,options):await generateImageMedia({sessionId:GAME_ID,requestId:job.requestId,mode:'text',prompt:job.prompt,size},options)
 if(task.request_id!==job.requestId||task.status!=='succeeded'||task.media?.type!=='image'||task.media.format!=='png'||task.media.width!==size.width||task.media.height!==size.height||!allowedImageUrl(task.media.url))throw Error('PHOTO_INVALID')
 const response=await request(task.media.url,{signal,redirect:'error'})
 if(!response.ok||!response.body)throw Error('PHOTO_UNAVAILABLE')
 const reader=response.body.getReader(),chunks:Uint8Array[]=[];let length=0
 for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>8*1024*1024){await reader.cancel();throw Error('PHOTO_INVALID')}chunks.push(value)}
 const bytes=new Uint8Array(length);let at=0;for(const c of chunks){bytes.set(c,at);at+=c.length}return bytes
}
