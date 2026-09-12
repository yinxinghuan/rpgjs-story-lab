import type {AuthorityStorage} from './session-authority'
import {LabError} from '../src/journey-runtime'
import {getMediaTask} from '../src/vendor/media/client'
import {inspectArtCandidate} from '../src/art-draft'
import {allowedImageUrl} from './journal-image'
import {assertCloudArtInput,CREATOR_BACKGROUND_RECORD_VERSION,CREATOR_DRAFT_LIMIT,type CloudArtInput,type CloudArtRecord} from '../src/creator-contract'
import {assertBackgroundReview,assertPublishedBackground,type PublishedBackground} from '../src/background-publication'

export type ArtArchiveSource=(input:CloudArtInput)=>Promise<Uint8Array>
const signature=(i:CloudArtInput)=>JSON.stringify([i.id,i.taskId,i.sha256,i.lighting,i.request.requestId,i.request.sessionId,i.request.mode,i.request.prompt,i.request.referenceUrls,i.request.size.width,i.request.size.height])
/** Read an already completed task. This path never starts or retries generation,
 * and never accepts a client-supplied download URL. */
export function platformArtArchiveSource(request:typeof fetch=fetch):ArtArchiveSource{return async input=>{
 const signal=AbortSignal.timeout(22000)
 const task=await getMediaTask(input.taskId,{signal,fetchImpl:request})
 if(task.task_id!==input.taskId||task.request_id!==input.id||task.type!=='image'||task.status!=='succeeded'||task.media?.type!=='image'||task.media.format!=='png'||task.media.width!==1024||task.media.height!==1536||!allowedImageUrl(task.media.url))throw new LabError('ART_SOURCE_MISMATCH',409)
 const r=await request(task.media.url,{signal,redirect:'error'})
 if(!r.ok||!r.body)throw new LabError('ART_SOURCE_UNAVAILABLE',503)
 const reader=r.body.getReader(),chunks:Uint8Array[]=[];let size=0
 for(;;){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>8*1024*1024){await reader.cancel();throw new LabError('ART_TOO_LARGE',413)}chunks.push(value)}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}return bytes
}}
export class CreatorArtArchive{
 private pending=new Map<string,{signature:string;promise:Promise<CloudArtRecord>}>()
 constructor(private db:AuthorityStorage,private source:ArtArchiveSource=platformArtArchiveSource(),private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS creator_art(owner TEXT NOT NULL,id TEXT NOT NULL,metadata TEXT NOT NULL,PRIMARY KEY(owner,id))')
  db.run('CREATE TABLE IF NOT EXISTS creator_art_bytes(owner TEXT NOT NULL,id TEXT NOT NULL,part INTEGER NOT NULL,data BLOB NOT NULL,PRIMARY KEY(owner,id,part))')
  db.run('CREATE TABLE IF NOT EXISTS creator_art_publications(owner TEXT NOT NULL,id TEXT NOT NULL,release TEXT NOT NULL,PRIMARY KEY(owner,id))')
 }
 list(owner:string):CloudArtRecord[]{return this.db.all<{metadata:string}>('SELECT metadata FROM creator_art WHERE owner=? ORDER BY rowid DESC',owner).map(r=>JSON.parse(r.metadata))}
 get(owner:string,id:string):CloudArtRecord{const r=this.db.all<{metadata:string}>('SELECT metadata FROM creator_art WHERE owner=? AND id=?',owner,id)[0];if(!r)throw new LabError('ART_DRAFT_NOT_FOUND',404);return JSON.parse(r.metadata)}
 private replay(owner:string,input:CloudArtInput){
  const r=this.list(owner).find(r=>r.id===input.id);if(!r)return
  if(signature(r)!==signature(input))throw new LabError('ART_DRAFT_CONFLICT',409)
  return r
 }
 async save(owner:string,value:unknown){
  try{assertCloudArtInput(value)}catch{throw new LabError('INVALID_ART_DRAFT')}
  const input:CloudArtInput=structuredClone(value),old=this.replay(owner,input);if(old)return old
  const key=JSON.stringify([owner,input.id]),sig=signature(input),pending=this.pending.get(key)
  if(pending){if(pending.signature!==sig)throw new LabError('ART_DRAFT_CONFLICT',409);return pending.promise}
  if(this.list(owner).length+[...this.pending.keys()].filter(k=>JSON.parse(k)[0]===owner).length>=CREATOR_DRAFT_LIMIT)throw new LabError('ART_DRAFT_LIMIT',429)
  const promise=(async()=>{
   const bytes=await this.source(input)
   let candidate;try{candidate=await inspectArtCandidate(bytes)}catch{throw new LabError('ART_INVALID',409)}
   if(candidate.sha256!==input.sha256)throw new LabError('ART_SOURCE_MISMATCH',409)
   const record:CloudArtRecord={...input,version:CREATOR_BACKGROUND_RECORD_VERSION,width:1024,height:1536,bytes:bytes.length,createdAt:this.now()}
   return this.db.transaction(()=>{
    const raced=this.replay(owner,input);if(raced)return raced
    if(this.list(owner).length>=CREATOR_DRAFT_LIMIT)throw new LabError('ART_DRAFT_LIMIT',429)
    this.db.run('INSERT INTO creator_art VALUES(?,?,?)',owner,input.id,JSON.stringify(record))
    // Keep every SQLite value below the Durable Object per-value ceiling.
    for(let offset=0,part=0;offset<bytes.length;offset+=65536,part++)this.db.run('INSERT INTO creator_art_bytes VALUES(?,?,?,?)',owner,input.id,part,new Uint8Array(bytes.slice(offset,offset+65536)).buffer)
    return record
   })
  })()
  this.pending.set(key,{signature:sig,promise});try{return await promise}finally{if(this.pending.get(key)?.promise===promise)this.pending.delete(key)}
 }
 async file(owner:string,id:string){
  const record=this.get(owner,id),rows=this.db.all<{part:number;data:Uint8Array|ArrayBuffer}>('SELECT part,data FROM creator_art_bytes WHERE owner=? AND id=? ORDER BY part',owner,id)
  const bytes=new Uint8Array(record.bytes);let offset=0
  for(let i=0;i<rows.length;i++){const chunk=new Uint8Array(rows[i].data);if(rows[i].part!==i||chunk.length!==Math.min(65536,bytes.length-offset))throw new LabError('ART_STORAGE_INVALID',503);bytes.set(chunk,offset);offset+=chunk.length}
  if(offset!==bytes.length||(await inspectArtCandidate(bytes)).sha256!==record.sha256)throw new LabError('ART_STORAGE_INVALID',503)
  return bytes
 }
 async publish(owner:string,id:string,value:any){
  const record=this.get(owner,id)
  if(!value||Object.keys(value).sort().join(',')!=='review,sha256'||value.sha256!==record.sha256)throw new LabError('ART_SOURCE_MISMATCH',409)
  try{assertBackgroundReview(value.review,record.sha256)}catch{throw new LabError('BACKGROUND_REVIEW_REQUIRED',409)}
  await this.file(owner,id)
  return this.db.transaction(()=>{
   const old=this.db.all<{release:string}>('SELECT release FROM creator_art_publications WHERE owner=? AND id=?',owner,id)[0];if(old)return JSON.parse(old.release) as PublishedBackground
   const release:PublishedBackground={version:1,id:owner+'.'+id,scene:'train-at-dead-station',sha256:record.sha256,bytes:record.bytes,width:1024,height:1536,review:structuredClone(value.review)}
   this.db.run('INSERT INTO creator_art_publications VALUES(?,?,?)',owner,id,JSON.stringify(release));return release
  })
 }
 published(owner:string,id:string):PublishedBackground{
  const r=this.db.all<{release:string}>('SELECT release FROM creator_art_publications WHERE owner=? AND id=?',owner,id)[0]
  if(!r)throw new LabError('BACKGROUND_NOT_PUBLISHED',404)
  const release=JSON.parse(r.release);assertPublishedBackground(release);return release
 }
}
