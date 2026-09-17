import type {AuthorityStorage} from './session-authority'
import type {OldStreetHead} from '../src/old-street-head'
import {journalMediaSubjects,journalMediaPrompt,journalMediaSize,type JournalMediaState} from '../src/old-street-journal-media'
import {LabError} from '../src/journey-runtime'
import {inspectSizedPng} from './journal-image'
import {MediaServiceError} from '../src/vendor/media/client'
import {imageMediaProducer,type ExpansionPhotoJob,type ExpansionPhotoProducer} from './old-street-expansion-media'
export const journalArtProducer=(request:typeof fetch=fetch)=>imageMediaProducer(journalMediaSize,request)
/** Artwork is a durable sidecar, never a second authority for possession or cast. */
export class OldStreetJournalMedia{
 constructor(private db:AuthorityStorage,private head:(owner:string,id:string)=>OldStreetHead,private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_journal_media(owner TEXT NOT NULL,journey TEXT NOT NULL,id TEXT NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,id))')
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_journal_media_parts(owner TEXT NOT NULL,journey TEXT NOT NULL,id TEXT NOT NULL,part INTEGER NOT NULL,data TEXT NOT NULL,PRIMARY KEY(owner,journey,id,part))')
 }
 private read(o:string,h:string,id:string):ExpansionPhotoJob|undefined{const r=this.db.all<{data:string}>('SELECT data FROM oldstreet_journal_media WHERE owner=? AND journey=? AND id=?',o,h,id)[0];return r?JSON.parse(r.data):undefined}
 private put(o:string,h:string,j:ExpansionPhotoJob){this.db.run('INSERT OR REPLACE INTO oldstreet_journal_media VALUES(?,?,?,?)',o,h,j.id,JSON.stringify(j))}
 list(o:string,h:string):JournalMediaState[]{return journalMediaSubjects(this.head(o,h).save).map(s=>this.read(o,h,s.id)).filter((j):j is ExpansionPhotoJob=>!!j).map(j=>({id:j.id,state:j.state==='candidate'?'ready':j.state,recoverable:j.recoverable,nextAt:j.nextAt,asset:j.asset}))}
 sync(o:string,h:string,retryId?:string){
  const subjects=journalMediaSubjects(this.head(o,h).save)
  if(retryId&&!subjects.some(s=>s.id===retryId))throw new LabError('ART_NOT_ELIGIBLE',409)
  this.db.transaction(()=>{for(const s of subjects){
   const old=this.read(o,h,s.id)
   if(old){
    if(old.id!==retryId||old.state!=='failed'||old.recoverable)continue
    if(old.nextAt>this.now())throw new LabError('ART_RETRY_LATER',429)
   }
   this.put(o,h,{id:s.id,requestId:crypto.randomUUID(),prompt:old?.prompt??journalMediaPrompt(s),attempt:(old?.attempt??0)+1,state:'preparing',recoverable:true,nextAt:0,leaseUntil:0})
  }})
  return this.list(o,h)
 }
 async run(o:string,h:string,produce:ExpansionPhotoProducer){
  // Reentry is safe: a persisted lease prevents duplicate live requests.
  for(const {id} of this.list(o,h)){
   const job=this.db.transaction(()=>{const j=this.read(o,h,id);if(!j?.recoverable||j.nextAt>this.now()||j.leaseUntil>this.now())return;j.lease=crypto.randomUUID();j.leaseUntil=this.now()+120000;j.state='preparing';this.put(o,h,j);return structuredClone(j)})
   if(!job)continue
   const update=(change:(j:ExpansionPhotoJob)=>void)=>this.db.transaction(()=>{const j=this.read(o,h,id);if(j&&j.lease===job.lease&&j.requestId===job.requestId){change(j);this.put(o,h,j)}})
   try{
    const bytes=await produce(job,task=>{if(!/^[A-Za-z0-9_-]{1,160}$/.test(task))throw Error('IMAGE_INVALID');update(j=>{if(j.taskId&&j.taskId!==task)throw Error('IMAGE_INVALID');j.taskId=task})})
    if(bytes.length>8*1024*1024)throw Error('IMAGE_INVALID')
    const asset=await inspectSizedPng(bytes,journalMediaSize)
    update(j=>{this.db.run('DELETE FROM oldstreet_journal_media_parts WHERE owner=? AND journey=? AND id=?',o,h,id);for(let n=0;n<bytes.length;n+=24000)this.db.run('INSERT INTO oldstreet_journal_media_parts VALUES(?,?,?,?,?)',o,h,id,n/24000,btoa(String.fromCharCode(...bytes.subarray(n,n+24000))));j.asset=asset;j.state='candidate';j.recoverable=false;j.leaseUntil=0;delete j.lease;delete j.error})
   }catch(e){update(j=>{const invalid=e instanceof Error&&['IMAGE_INVALID','PHOTO_INVALID'].includes(e.message);j.state='failed';j.error=invalid?'PHOTO_INVALID':'PHOTO_UNAVAILABLE';j.recoverable=!invalid&&!(e instanceof MediaServiceError&&!e.retryable&&e.status>0);j.nextAt=this.now()+Math.max(8000,(e instanceof MediaServiceError?e.retryAfterSeconds??0:0)*1000);j.leaseUntil=0;delete j.lease})}
  }
 }
 async file(o:string,h:string,id:string){
  if(!journalMediaSubjects(this.head(o,h).save).some(s=>s.id===id))throw new LabError('ART_NOT_ELIGIBLE',404)
  const j=this.read(o,h,id);if(j?.state!=='candidate'||!j.asset)throw new LabError('ART_NOT_READY',409)
  const rows=this.db.all<{part:number;data:string}>('SELECT part,data FROM oldstreet_journal_media_parts WHERE owner=? AND journey=? AND id=? ORDER BY part',o,h,id),bytes=new Uint8Array(j.asset.bytes);let at=0
  rows.forEach((r,i)=>{if(r.part!==i)throw Error('IMAGE_INVALID');const b=Uint8Array.from(atob(r.data),c=>c.charCodeAt(0));bytes.set(b,at);at+=b.length})
  if(at!==bytes.length||(await inspectSizedPng(bytes,journalMediaSize)).sha256!==j.asset.sha256)throw Error('IMAGE_INVALID')
  return bytes
 }
}
export type JournalArtRuntime={media:OldStreetJournalMedia;produce:ExpansionPhotoProducer;background:(p:Promise<unknown>)=>void}
export function prepareJournalArt(o:string,h:string,runtime?:JournalArtRuntime){if(!runtime)return;runtime.background(Promise.resolve().then(()=>{runtime.media.sync(o,h);return runtime.media.run(o,h,runtime.produce)}))}
export function journalArtOperation(method:string,o:string,h:string,body:unknown,runtime?:JournalArtRuntime){
 if(!runtime)throw new LabError('ART_NOT_AVAILABLE',503)
 if(method==='GET')return {jobs:runtime.media.list(o,h)}
 if(method!=='POST')throw new LabError('METHOD_NOT_ALLOWED',405)
 const b=body as {retryId?:unknown}
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>k!=='retryId')||b.retryId!==undefined&&typeof b.retryId!=='string')throw new LabError('INVALID_ART_REQUEST')
 const jobs=runtime.media.sync(o,h,b.retryId as string|undefined)
 runtime.background(runtime.media.run(o,h,runtime.produce))
 return {jobs}
}
