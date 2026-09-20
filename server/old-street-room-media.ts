import type {AuthorityStorage} from './session-authority'
import type {OldStreetHead} from '../src/old-street-head'
import {darkroomMediaSlots,darkroomMediaEligible,type DarkroomSlot,type RoomMediaRow} from '../src/old-street-room-media'
import {LabError} from '../src/journey-runtime'
import {inspectSizedPng} from './journal-image'
import {MediaServiceError} from '../src/vendor/media/client'
import {imageMediaProducer,type ExpansionPhotoJob,type ExpansionPhotoProducer} from './old-street-expansion-media'
const size={width:512,height:512}
export const roomArtProducer=(request:typeof fetch=fetch)=>imageMediaProducer(size,request)
export class OldStreetRoomMedia{
 constructor(private db:AuthorityStorage,private head:(owner:string,id:string)=>OldStreetHead,private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_room_media(owner TEXT,journey TEXT,id TEXT,data TEXT,PRIMARY KEY(owner,journey,id))')
  db.run('CREATE TABLE IF NOT EXISTS oldstreet_room_media_parts(owner TEXT,journey TEXT,id TEXT,part INTEGER,data TEXT,PRIMARY KEY(owner,journey,id,part))')
 }
 private eligible(o:string,h:string){if(!darkroomMediaEligible(this.head(o,h)))throw new LabError('ROOM_ART_NOT_ELIGIBLE',409)}
 private read(o:string,h:string,id:string):ExpansionPhotoJob|undefined{const r=this.db.all<{data:string}>('SELECT data FROM oldstreet_room_media WHERE owner=? AND journey=? AND id=?',o,h,id)[0];return r?JSON.parse(r.data):undefined}
 private put(o:string,h:string,j:ExpansionPhotoJob){this.db.run('INSERT OR REPLACE INTO oldstreet_room_media VALUES(?,?,?,?)',o,h,j.id,JSON.stringify(j))}
 list(o:string,h:string):RoomMediaRow[]{this.eligible(o,h);return (Object.keys(darkroomMediaSlots) as DarkroomSlot[]).flatMap(id=>{const j=this.read(o,h,id);return j?[{id,state:j.state==='candidate'?'ready':j.state,recoverable:j.recoverable,nextAt:j.nextAt,asset:j.asset}]:[]})}
 sync(o:string,h:string,retryId?:string){
  this.eligible(o,h)
  if(retryId&&!Object.hasOwn(darkroomMediaSlots,retryId))throw new LabError('INVALID_ROOM_ART_REQUEST')
  this.db.transaction(()=>{for(const s of Object.values(darkroomMediaSlots)){
   const old=this.read(o,h,s.id)
   if(old){if(old.id!==retryId||old.state!=='failed'||old.recoverable)continue;if(old.attempt>=2||old.nextAt>this.now())throw new LabError('ROOM_ART_RETRY_LATER',429)}
   this.put(o,h,{id:s.id,requestId:crypto.randomUUID(),prompt:s.prompt,attempt:(old?.attempt??0)+1,state:'preparing',recoverable:true,nextAt:0,leaseUntil:0})
  }})
  return this.list(o,h)
 }
 async run(o:string,h:string,produce:ExpansionPhotoProducer){
  // Two independent jobs, persisted leases and request IDs; never a room-wide await in gameplay.
  await Promise.all(this.list(o,h).map(async({id})=>{
   const job=this.db.transaction(()=>{const j=this.read(o,h,id);if(!j?.recoverable||j.nextAt>this.now()||j.leaseUntil>this.now())return;j.lease=crypto.randomUUID();j.leaseUntil=this.now()+120000;j.state='preparing';this.put(o,h,j);return structuredClone(j)})
   if(!job)return
   const update=(f:(j:ExpansionPhotoJob)=>void)=>this.db.transaction(()=>{const j=this.read(o,h,id);if(j?.requestId===job.requestId&&j.lease===job.lease){f(j);this.put(o,h,j)}})
   try{
    const bytes=await produce(job,task=>{if(!/^[A-Za-z0-9_-]{1,160}$/.test(task))throw Error('IMAGE_INVALID');update(j=>{if(j.taskId&&j.taskId!==task)throw Error('IMAGE_INVALID');j.taskId=task})})
    if(bytes.length>8*1024*1024)throw Error('IMAGE_INVALID')
    const asset=await inspectSizedPng(bytes,size)
    update(j=>{this.db.run('DELETE FROM oldstreet_room_media_parts WHERE owner=? AND journey=? AND id=?',o,h,id);for(let n=0;n<bytes.length;n+=24000)this.db.run('INSERT INTO oldstreet_room_media_parts VALUES(?,?,?,?,?)',o,h,id,n/24000,btoa(String.fromCharCode(...bytes.subarray(n,n+24000))));j.asset=asset;j.state='candidate';j.recoverable=false;j.leaseUntil=0;delete j.lease;delete j.error})
   }catch(e){update(j=>{const invalid=e instanceof Error&&['IMAGE_INVALID','PHOTO_INVALID'].includes(e.message);j.state='failed';j.recoverable=!invalid&&!(e instanceof MediaServiceError&&!e.retryable&&e.status>0);j.nextAt=this.now()+Math.max(8000,(e instanceof MediaServiceError?e.retryAfterSeconds??0:0)*1000);j.leaseUntil=0;delete j.lease})}
  }))
 }
 async file(o:string,h:string,id:string){
  this.eligible(o,h);if(!Object.hasOwn(darkroomMediaSlots,id))throw new LabError('NOT_FOUND',404)
  const j=this.read(o,h,id);if(j?.state!=='candidate'||!j.asset)throw new LabError('ROOM_ART_NOT_READY',409)
  const bytes=new Uint8Array(j.asset.bytes);let at=0
  const rows=this.db.all<{part:number;data:string}>('SELECT part,data FROM oldstreet_room_media_parts WHERE owner=? AND journey=? AND id=? ORDER BY part',o,h,id)
  rows.forEach((r,i)=>{if(r.part!==i)throw Error('IMAGE_INVALID');const b=Uint8Array.from(atob(r.data),c=>c.charCodeAt(0));bytes.set(b,at);at+=b.length})
  if(at!==bytes.length||(await inspectSizedPng(bytes,size)).sha256!==j.asset.sha256)throw Error('IMAGE_INVALID')
  return bytes
 }
}
export type RoomArtRuntime={media:OldStreetRoomMedia;produce:ExpansionPhotoProducer;background:(p:Promise<unknown>)=>void}
