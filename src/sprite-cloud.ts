import type {Transport} from './recoverable-session-client'
import {assertDeviceReview,assertPublishedDevice,type PublishedDevice} from './device-publication'
import {verifySpritePng,type SpriteDraft} from './sprite-draft'
import {assertActorSheetReview} from './actor-sheet-review'
import {ACTOR_REVIEW_LIMIT,actorReviewId,actorReviewTarget,assertArchivedActorReview,type ArchivedActorReview} from './actor-review-archive'
import {assertSpriteArchiveRecord,restoreSpriteManifest,spriteManifest,spriteManifestSignature,spritePartText,SPRITE_ARCHIVE_LIMIT,SPRITE_ARCHIVE_PART,type SpriteArchiveRecord} from './sprite-archive-contract'
export class SpriteCloudArchive{
 constructor(private api:Transport){}
 async saveWithReview(draft:SpriteDraft,notify:(done:number,total:number)=>void=()=>{}){
  const localReview=draft.actorReview?structuredClone(draft.actorReview):undefined
  if(localReview)assertActorSheetReview(localReview,draft)
  const record=await this.save(draft,notify)
  if(localReview){try{
   const id=await actorReviewId(localReview),review=await this.api('/sprites/'+draft.id+'/actor-reviews',{id,review:localReview})
   await assertArchivedActorReview(review,draft);if(review.id!==id)throw Error('SPRITE_ACTOR_REVIEW_ARCHIVE_INVALID')
  }catch(e){throw Error(e instanceof Error&&e.message==='SPRITE_ACTOR_REVIEW_LIMIT'?'SPRITE_ACTOR_REVIEW_LIMIT':'SPRITE_ACTOR_REVIEW_SAVE_FAILED',{cause:e})}}
  return record
 }
 async reviews(record:SpriteArchiveRecord){
  assertSpriteArchiveRecord(record);const target=actorReviewTarget(record.manifest),r=await this.api('/sprites/'+record.manifest.id+'/actor-reviews')
  if(!r||Object.keys(r).join(',')!=='reviews'||!Array.isArray(r.reviews)||r.reviews.length>ACTOR_REVIEW_LIMIT)throw Error('SPRITE_ACTOR_REVIEW_ARCHIVE_INVALID')
  for(let i=0;i<r.reviews.length;i++){await assertArchivedActorReview(r.reviews[i],target);if(r.reviews[i].revision!==r.reviews.length-i)throw Error('SPRITE_ACTOR_REVIEW_ARCHIVE_INVALID')}
  if(new Set(r.reviews.map((v:ArchivedActorReview)=>v.id)).size!==r.reviews.length)throw Error('SPRITE_ACTOR_REVIEW_ARCHIVE_INVALID')
  return r.reviews as ArchivedActorReview[]
 }
 async list(){const r=await this.api('/sprites');if(!Array.isArray(r?.sprites)||r.sprites.length>SPRITE_ARCHIVE_LIMIT)throw Error('SPRITE_ARCHIVE_INVALID');r.sprites.forEach(assertSpriteArchiveRecord);return r.sprites as SpriteArchiveRecord[]}
 async save(draft:SpriteDraft,notify:(done:number,total:number)=>void=()=>{}){
  const {manifest,payload}=spriteManifest(draft);for(const png of payload.values())await verifySpritePng(png)
  const record=await this.api('/sprites',manifest);assertSpriteArchiveRecord(record)
  if(spriteManifestSignature(record.manifest)!==spriteManifestSignature(manifest))throw Error('SPRITE_ARCHIVE_CONFLICT')
  if(record.state==='ready')return record
  const progress=await this.api('/sprites/'+manifest.id+'/parts')
  if(progress?.id!==manifest.id||!Array.isArray(progress.parts)||progress.parts.length>700)throw Error('SPRITE_ARCHIVE_INVALID')
  const existing=new Set<string>()
  for(const p of progress.parts){const file=manifest.files.find(f=>f.role===p?.role);if(!file||!Number.isInteger(p.part)||p.part<0||p.part>=Math.ceil(file.bytes/SPRITE_ARCHIVE_PART))throw Error('SPRITE_ARCHIVE_INVALID');existing.add(p.role+':'+p.part)}
  const total=manifest.files.reduce((n,f)=>n+Math.ceil(f.bytes/SPRITE_ARCHIVE_PART),0);let done=0
  for(const f of manifest.files){const png=payload.get(f.role)!;for(let offset=0,part=0;offset<png.bytes.length;offset+=SPRITE_ARCHIVE_PART,part++){
   if(!existing.has(f.role+':'+part)){const bytes=png.bytes.subarray(offset,offset+SPRITE_ARCHIVE_PART),r=await this.api('/sprites/'+manifest.id+'/parts',{role:f.role,part,data:spritePartText(bytes)});if(r?.id!==manifest.id||r.role!==f.role||r.part!==part||r.bytes!==bytes.length)throw Error('SPRITE_ARCHIVE_CONFLICT')}
   notify(++done,total)
  }}
  const ready=await this.api('/sprites/'+manifest.id+'/finish',{});assertSpriteArchiveRecord(ready)
  if(ready.state!=='ready'||spriteManifestSignature(ready.manifest)!==spriteManifestSignature(manifest))throw Error('SPRITE_ARCHIVE_CONFLICT')
  return ready
 }
 async restore(record:SpriteArchiveRecord){
  assertSpriteArchiveRecord(record);if(record.state!=='ready')throw Error('SPRITE_ARCHIVE_NOT_READY')
  const r=await this.api('/sprites/'+record.manifest.id);assertSpriteArchiveRecord(r)
  if(r.state!=='ready'||spriteManifestSignature(r.manifest)!==spriteManifestSignature(record.manifest))throw Error('SPRITE_ARCHIVE_CONFLICT')
  const restored=await restoreSpriteManifest(r.manifest,async f=>{const bytes=await this.api('/sprites/'+r.manifest.id+'/file/'+f.role);if(!(bytes instanceof Uint8Array))throw Error('SPRITE_ARCHIVE_CORRUPT');return bytes})
  if(restored.spec?.kind==='actor'){const latest=(await this.reviews(r))[0];if(latest)restored.actorReview=structuredClone(latest.review)}
  return restored
 }
 async cancel(record:SpriteArchiveRecord){assertSpriteArchiveRecord(record);if(record.state!=='uploading')throw Error('SPRITE_ARCHIVE_ALREADY_READY');const r=await this.api('/sprites/'+record.manifest.id+'/cancel',{});if(r?.id!==record.manifest.id||r.cancelled!==true)throw Error('SPRITE_ARCHIVE_CONFLICT')}
 async publication(id:string){const r=await this.api('/sprites/'+id+'/release');if(r?.release===null)return null;assertPublishedDevice(r?.release);if(r.release.id.split('.')[1]!==id)throw Error('DEVICE_RELEASE_INVALID');return r.release as PublishedDevice}
 async publish(draft:SpriteDraft){
  if(!draft.result)throw Error('DEVICE_NOT_READY');assertDeviceReview(draft.deviceReview,draft.result.png.sha256)
  await this.save(draft);const r=await this.api('/sprites/'+draft.id+'/publish',{review:draft.deviceReview});assertPublishedDevice(r)
  if(r.id.split('.')[1]!==draft.id||r.sha256!==draft.result.png.sha256||r.bytes!==draft.result.png.bytes.length)throw Error('DEVICE_RELEASE_INVALID');return r
 }
}
