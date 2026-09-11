import type {AuthorityStorage} from './session-authority'
import {LabError} from '../src/journey-runtime'
import {assertDeviceReview,assertPublishedDevice,type PublishedDevice} from '../src/device-publication'
import {inspectSpritePng} from '../src/sprite-draft'
import {assertSpriteManifest,spriteManifestSignature,spritePartBytes,SPRITE_ARCHIVE_LIMIT,SPRITE_ARCHIVE_PART,type SpriteArchiveRecord,type SpriteFile} from '../src/sprite-archive-contract'

/** Private immutable source archive. Byte validation is not visual admission. */
export class CreatorSpriteArchive{
 constructor(private db:AuthorityStorage,private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS creator_sprites(owner TEXT NOT NULL,id TEXT NOT NULL,manifest TEXT NOT NULL,state TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(owner,id))')
  db.run('CREATE TABLE IF NOT EXISTS creator_sprite_parts(owner TEXT NOT NULL,id TEXT NOT NULL,role TEXT NOT NULL,part INTEGER NOT NULL,data BLOB NOT NULL,PRIMARY KEY(owner,id,role,part))')
  db.run('CREATE TABLE IF NOT EXISTS creator_sprite_releases(owner TEXT NOT NULL,id TEXT NOT NULL,release TEXT NOT NULL,PRIMARY KEY(owner,id))')
 }
 list(owner:string):SpriteArchiveRecord[]{return this.db.all<{manifest:string;state:'uploading'|'ready';created_at:number}>('SELECT manifest,state,created_at FROM creator_sprites WHERE owner=? ORDER BY created_at DESC',owner).map(r=>({manifest:JSON.parse(r.manifest),state:r.state,createdAt:r.created_at}))}
 get(owner:string,id:string){const r=this.list(owner).find(r=>r.manifest.id===id);if(!r)throw new LabError('SPRITE_ARCHIVE_NOT_FOUND',404);return r}
 progress(owner:string,id:string){this.get(owner,id);return {id,parts:this.db.all<{role:string;part:number}>('SELECT role,part FROM creator_sprite_parts WHERE owner=? AND id=? ORDER BY role,part',owner,id)}}
 begin(owner:string,value:unknown){
  try{assertSpriteManifest(value)}catch{throw new LabError('SPRITE_ARCHIVE_INVALID')}
  const manifest=structuredClone(value)
  return this.db.transaction(()=>{
   const old=this.list(owner).find(r=>r.manifest.id===manifest.id)
   if(old){if(spriteManifestSignature(old.manifest)!==spriteManifestSignature(manifest))throw new LabError('SPRITE_ARCHIVE_CONFLICT',409);return old}
   if(this.list(owner).length>=SPRITE_ARCHIVE_LIMIT)throw new LabError('SPRITE_ARCHIVE_LIMIT',429)
   const createdAt=this.now();this.db.run('INSERT INTO creator_sprites VALUES(?,?,?,?,?)',owner,manifest.id,JSON.stringify(manifest),'uploading',createdAt)
   return {manifest,state:'uploading' as const,createdAt}
  })
 }
 part(owner:string,id:string,value:any){
  const record=this.get(owner,id),f=record.manifest.files.find(f=>f.role===value?.role)
  if(!value||Object.keys(value).sort().join(',')!=='data,part,role'||!f||!Number.isInteger(value.part)||value.part<0||value.part>=Math.ceil(f.bytes/SPRITE_ARCHIVE_PART))throw new LabError('SPRITE_ARCHIVE_PART_INVALID')
  let bytes:Uint8Array;try{bytes=spritePartBytes(value.data)}catch{throw new LabError('SPRITE_ARCHIVE_PART_INVALID')}
  if(bytes.length!==Math.min(SPRITE_ARCHIVE_PART,f.bytes-value.part*SPRITE_ARCHIVE_PART))throw new LabError('SPRITE_ARCHIVE_PART_INVALID')
  return this.db.transaction(()=>{
   const current=this.get(owner,id)
   if(spriteManifestSignature(current.manifest)!==spriteManifestSignature(record.manifest))throw new LabError('SPRITE_ARCHIVE_CONFLICT',409)
   const old=this.db.all<{data:ArrayBuffer|Uint8Array}>('SELECT data FROM creator_sprite_parts WHERE owner=? AND id=? AND role=? AND part=?',owner,id,f.role,value.part)[0]
   if(old){const previous=new Uint8Array(old.data);if(previous.length!==bytes.length||!previous.every((v,i)=>v===bytes[i]))throw new LabError('SPRITE_ARCHIVE_PART_CONFLICT',409)}
   else{if(current.state!=='uploading')throw new LabError('SPRITE_ARCHIVE_ALREADY_READY',409);this.db.run('INSERT INTO creator_sprite_parts VALUES(?,?,?,?,?)',owner,id,f.role,value.part,new Uint8Array(bytes).buffer)}
   return {id,role:f.role,part:value.part,bytes:bytes.length}
  })
 }
 private chunks(owner:string,id:string,role:string){return this.db.all<{part:number;data:ArrayBuffer|Uint8Array}>('SELECT part,data FROM creator_sprite_parts WHERE owner=? AND id=? AND role=? ORDER BY part',owner,id,role)}
 private read(owner:string,id:string,f:SpriteFile){
  const rows=this.chunks(owner,id,f.role),bytes=new Uint8Array(f.bytes);let offset=0
  for(let i=0;i<rows.length;i++){const b=new Uint8Array(rows[i].data);if(rows[i].part!==i||b.length!==Math.min(SPRITE_ARCHIVE_PART,f.bytes-offset))throw new LabError('SPRITE_ARCHIVE_INCOMPLETE',409);bytes.set(b,offset);offset+=b.length}
  if(offset!==bytes.length)throw new LabError('SPRITE_ARCHIVE_INCOMPLETE',409);return bytes
 }
 private async checked(owner:string,id:string,f:SpriteFile){
  const bytes=this.read(owner,id,f)
  try{const p=await inspectSpritePng(bytes);if(p.sha256!==f.sha256||p.width!==f.width||p.height!==f.height)throw Error()}catch{throw new LabError('SPRITE_ARCHIVE_CORRUPT',409)}
  return bytes
 }
 async finish(owner:string,id:string){
  const record=this.get(owner,id),files=new Map<string,Uint8Array>()
  for(const f of record.manifest.files)files.set(f.role,await this.checked(owner,id,f))
  return this.db.transaction(()=>{
   const current=this.get(owner,id)
   if(spriteManifestSignature(current.manifest)!==spriteManifestSignature(record.manifest))throw new LabError('SPRITE_ARCHIVE_CONFLICT',409)
   // A cancel/restart during async digest work cannot mark replacement chunks ready.
   for(const f of record.manifest.files){const expected=files.get(f.role)!,rows=this.chunks(owner,id,f.role);let offset=0;for(let i=0;i<rows.length;i++){const b=new Uint8Array(rows[i].data);if(rows[i].part!==i||b.length!==Math.min(SPRITE_ARCHIVE_PART,expected.length-offset)||!b.every((v,j)=>v===expected[offset+j]))throw new LabError('SPRITE_ARCHIVE_CONFLICT',409);offset+=b.length}if(offset!==expected.length)throw new LabError('SPRITE_ARCHIVE_INCOMPLETE',409)}
   this.db.run("UPDATE creator_sprites SET state='ready' WHERE owner=? AND id=?",owner,id)
   return {...current,state:'ready' as const}
  })
 }
 async file(owner:string,id:string,role:string){const r=this.get(owner,id),f=r.manifest.files.find(f=>f.role===role);if(r.state!=='ready'||!f)throw new LabError('SPRITE_ARCHIVE_NOT_READY',409);return this.checked(owner,id,f)}
 cancel(owner:string,id:string){return this.db.transaction(()=>{const r=this.get(owner,id);if(r.state!=='uploading')throw new LabError('SPRITE_ARCHIVE_ALREADY_READY',409);this.db.run('DELETE FROM creator_sprite_parts WHERE owner=? AND id=?',owner,id);this.db.run('DELETE FROM creator_sprites WHERE owner=? AND id=?',owner,id);return {id,cancelled:true}})}
 publication(owner:string,id:string):PublishedDevice|null{const row=this.db.all<{release:string}>('SELECT release FROM creator_sprite_releases WHERE owner=? AND id=?',owner,id)[0];if(!row)return null;const r=JSON.parse(row.release);assertPublishedDevice(r);return r}
 async publish(owner:string,id:string,value:any){
  const record=this.get(owner,id),d=record.manifest.draft,f=record.manifest.files.find(f=>f.role==='candidate')!
  if(record.state!=='ready'||d.deviceStateSet!=='repair'||d.spec.kind!=='states')throw new LabError('DEVICE_NOT_READY',409)
  try{if(!value||Object.keys(value).join(',')!=='review')throw Error();assertDeviceReview(value.review,f.sha256);const g=value.review.geometry;if(g.cellWidth!==d.spec.cellWidth||g.cellHeight!==d.spec.cellHeight||g.foot.x!==d.spec.foot.x||g.foot.y!==d.spec.foot.y)throw Error()}catch{throw new LabError('DEVICE_REVIEW_REQUIRED',409)}
  await this.file(owner,id,'candidate')
  const release:PublishedDevice={version:1,id:owner+'.'+id,slot:'starter',sha256:f.sha256,bytes:f.bytes,width:f.width,height:f.height,review:structuredClone(value.review)}
  assertPublishedDevice(release)
  return this.db.transaction(()=>{const old=this.publication(owner,id);if(old){if(JSON.stringify(old)!==JSON.stringify(release))throw new LabError('DEVICE_RELEASE_CONFLICT',409);return old}this.db.run('INSERT INTO creator_sprite_releases VALUES(?,?,?)',owner,id,JSON.stringify(release));return release})
 }
}
