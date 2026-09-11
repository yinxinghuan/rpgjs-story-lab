import type {AuthorityStorage} from './session-authority'
import {LabError} from '../src/journey-runtime'
import {inspectSpritePng} from '../src/sprite-draft'
import {spritePartBytes} from '../src/sprite-archive-contract'
import {assertLayerManifest,layerManifestSignature,LAYER_ARCHIVE_LIMIT,LAYER_ARCHIVE_PART,assertLayerReview,assertPublishedLayer,type LayerRecord,type LayerFile,type PublishedLayer,type LayerReview} from '../src/layered-archive-contract'
/** Private immutable source archive. Byte validation is not visual admission. */
export class CreatorLayerArchive{
 constructor(private db:AuthorityStorage,private now=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS creator_layers(owner TEXT NOT NULL,id TEXT NOT NULL,manifest TEXT NOT NULL,state TEXT NOT NULL,created_at INTEGER NOT NULL,PRIMARY KEY(owner,id))')
  db.run('CREATE TABLE IF NOT EXISTS creator_layer_parts(owner TEXT NOT NULL,id TEXT NOT NULL,role TEXT NOT NULL,part INTEGER NOT NULL,data BLOB NOT NULL,PRIMARY KEY(owner,id,role,part))')
  db.run('CREATE TABLE IF NOT EXISTS creator_layer_reviews(owner TEXT NOT NULL,id TEXT NOT NULL,review TEXT NOT NULL,PRIMARY KEY(owner,id))')
  db.run('CREATE TABLE IF NOT EXISTS creator_layer_releases(owner TEXT NOT NULL,id TEXT NOT NULL,release TEXT NOT NULL,PRIMARY KEY(owner,id))')
 }
 list(owner:string):LayerRecord[]{return this.db.all<{manifest:string;state:'uploading'|'ready';created_at:number}>('SELECT manifest,state,created_at FROM creator_layers WHERE owner=? ORDER BY created_at DESC',owner).map(r=>({manifest:JSON.parse(r.manifest),state:r.state,createdAt:r.created_at}))}
 get(owner:string,id:string){const r=this.list(owner).find(r=>r.manifest.id===id);if(!r)throw new LabError('LAYER_ARCHIVE_NOT_FOUND',404);return r}
 progress(owner:string,id:string){this.get(owner,id);return {id,parts:this.db.all<{role:string;part:number}>('SELECT role,part FROM creator_layer_parts WHERE owner=? AND id=? ORDER BY role,part',owner,id)}}
 begin(owner:string,value:unknown){
  try{assertLayerManifest(value)}catch{throw new LabError('LAYER_ARCHIVE_INVALID')}
  const manifest=structuredClone(value)
  return this.db.transaction(()=>{
   const old=this.list(owner).find(r=>r.manifest.id===manifest.id)
   if(old){if(layerManifestSignature(old.manifest)!==layerManifestSignature(manifest))throw new LabError('LAYER_ARCHIVE_CONFLICT',409);return old}
   if(this.list(owner).length>=LAYER_ARCHIVE_LIMIT)throw new LabError('LAYER_ARCHIVE_LIMIT',429)
   const createdAt=this.now();this.db.run('INSERT INTO creator_layers VALUES(?,?,?,?,?)',owner,manifest.id,JSON.stringify(manifest),'uploading',createdAt)
   return {manifest,state:'uploading' as const,createdAt}
  })
 }
 part(owner:string,id:string,value:any){
  const record=this.get(owner,id),f=record.manifest.files.find(f=>f.role===value?.role)
  if(!value||Object.keys(value).sort().join(',')!=='data,part,role'||!f||!Number.isInteger(value.part)||value.part<0||value.part>=Math.ceil(f.bytes/LAYER_ARCHIVE_PART))throw new LabError('LAYER_ARCHIVE_PART_INVALID')
  let bytes:Uint8Array;try{bytes=spritePartBytes(value.data)}catch{throw new LabError('LAYER_ARCHIVE_PART_INVALID')}
  if(bytes.length!==Math.min(LAYER_ARCHIVE_PART,f.bytes-value.part*LAYER_ARCHIVE_PART))throw new LabError('LAYER_ARCHIVE_PART_INVALID')
  return this.db.transaction(()=>{
   const current=this.get(owner,id)
   if(layerManifestSignature(current.manifest)!==layerManifestSignature(record.manifest))throw new LabError('LAYER_ARCHIVE_CONFLICT',409)
   const old=this.db.all<{data:ArrayBuffer|Uint8Array}>('SELECT data FROM creator_layer_parts WHERE owner=? AND id=? AND role=? AND part=?',owner,id,f.role,value.part)[0]
   if(old){const previous=new Uint8Array(old.data);if(previous.length!==bytes.length||!previous.every((v,i)=>v===bytes[i]))throw new LabError('LAYER_ARCHIVE_PART_CONFLICT',409)}
   else{if(current.state!=='uploading')throw new LabError('LAYER_ARCHIVE_ALREADY_READY',409);this.db.run('INSERT INTO creator_layer_parts VALUES(?,?,?,?,?)',owner,id,f.role,value.part,new Uint8Array(bytes).buffer)}
   return {id,role:f.role,part:value.part,bytes:bytes.length}
  })
 }
 private chunks(owner:string,id:string,role:string){return this.db.all<{part:number;data:ArrayBuffer|Uint8Array}>('SELECT part,data FROM creator_layer_parts WHERE owner=? AND id=? AND role=? ORDER BY part',owner,id,role)}
 private read(owner:string,id:string,f:LayerFile){
  const rows=this.chunks(owner,id,f.role),bytes=new Uint8Array(f.bytes);let offset=0
  for(let i=0;i<rows.length;i++){const b=new Uint8Array(rows[i].data);if(rows[i].part!==i||b.length!==Math.min(LAYER_ARCHIVE_PART,f.bytes-offset))throw new LabError('LAYER_ARCHIVE_INCOMPLETE',409);bytes.set(b,offset);offset+=b.length}
  if(offset!==bytes.length)throw new LabError('LAYER_ARCHIVE_INCOMPLETE',409);return bytes
 }
 private async checked(owner:string,id:string,f:LayerFile){
  const bytes=this.read(owner,id,f)
  try{const p=await inspectSpritePng(bytes);if(p.sha256!==f.sha256||p.width!==f.width||p.height!==f.height)throw Error()}catch{throw new LabError('LAYER_ARCHIVE_CORRUPT',409)}
  return bytes
 }
 async finish(owner:string,id:string){
  const record=this.get(owner,id),files=new Map<string,Uint8Array>()
  for(const f of record.manifest.files)files.set(f.role,await this.checked(owner,id,f))
  return this.db.transaction(()=>{
   const current=this.get(owner,id)
   if(layerManifestSignature(current.manifest)!==layerManifestSignature(record.manifest))throw new LabError('LAYER_ARCHIVE_CONFLICT',409)
   // A cancel/restart during async digest work cannot mark replacement chunks ready.
   for(const f of record.manifest.files){const expected=files.get(f.role)!,rows=this.chunks(owner,id,f.role);let offset=0;for(let i=0;i<rows.length;i++){const b=new Uint8Array(rows[i].data);if(rows[i].part!==i||b.length!==Math.min(LAYER_ARCHIVE_PART,expected.length-offset)||!b.every((v,j)=>v===expected[offset+j]))throw new LabError('LAYER_ARCHIVE_CONFLICT',409);offset+=b.length}if(offset!==expected.length)throw new LabError('LAYER_ARCHIVE_INCOMPLETE',409)}
   this.db.run("UPDATE creator_layers SET state='ready' WHERE owner=? AND id=?",owner,id)
   return {...current,state:'ready' as const}
  })
 }
 async file(owner:string,id:string,role:string){const r=this.get(owner,id),f=r.manifest.files.find(f=>f.role===role);if(r.state!=='ready'||!f)throw new LabError('LAYER_ARCHIVE_NOT_READY',409);return this.checked(owner,id,f)}
 cancel(owner:string,id:string){return this.db.transaction(()=>{const r=this.get(owner,id);if(r.state!=='uploading')throw new LabError('LAYER_ARCHIVE_ALREADY_READY',409);this.db.run('DELETE FROM creator_layer_parts WHERE owner=? AND id=?',owner,id);this.db.run('DELETE FROM creator_layers WHERE owner=? AND id=?',owner,id);return {id,cancelled:true}})}

 review(owner:string,id:string):LayerReview|null{this.get(owner,id);const row=this.db.all<{review:string}>('SELECT review FROM creator_layer_reviews WHERE owner=? AND id=?',owner,id)[0];return row?JSON.parse(row.review):null}
 async saveReview(owner:string,id:string,value:any){const input=structuredClone(value),record=this.get(owner,id);if(record.state!=='ready')throw new LabError('LAYER_NOT_READY',409);try{if(!input||Object.keys(input).join(',')!=='review')throw Error();await assertLayerReview(input.review,record.manifest)}catch{throw new LabError('LAYER_REVIEW_REQUIRED',409)}return this.db.transaction(()=>{const old=this.review(owner,id);if(old){if(JSON.stringify(old)!==JSON.stringify(input.review))throw new LabError('LAYER_REVIEW_CHANGED',409);return old}this.db.run('INSERT INTO creator_layer_reviews VALUES(?,?,?)',owner,id,JSON.stringify(input.review));return input.review as LayerReview})}
 publication(owner:string,id:string):PublishedLayer|null{const row=this.db.all<{release:string}>('SELECT release FROM creator_layer_releases WHERE owner=? AND id=?',owner,id)[0];if(!row)return null;const r=JSON.parse(row.release);assertPublishedLayer(r);return r}
 async publish(owner:string,id:string,value:any){
  value=structuredClone(value);const record=this.get(owner,id);if(record.state!=='ready')throw new LabError('LAYER_NOT_READY',409)
  try{if(!value||Object.keys(value).join(',')!=='review')throw Error();await assertLayerReview(value.review,record.manifest);if(JSON.stringify(this.review(owner,id))!==JSON.stringify(value.review))throw Error()}catch{throw new LabError('LAYER_REVIEW_REQUIRED',409)}
  await this.file(owner,id,'housing');await this.file(owner,id,'rotor')
  const m=record.manifest,release:PublishedLayer={version:1,id:owner+'.'+id,slot:'tunnel-fan',sourceSha256:m.files[0].sha256,sourceWidth:m.files[0].width,sourceHeight:m.files[0].height,spec:structuredClone(m.spec),housing:structuredClone(m.files[1]),rotor:structuredClone(m.files[2]),review:structuredClone(value.review)};assertPublishedLayer(release)
  return this.db.transaction(()=>{const old=this.publication(owner,id);if(old){if(JSON.stringify(old)!==JSON.stringify(release))throw new LabError('LAYER_RELEASE_CONFLICT',409);return old}this.db.run('INSERT INTO creator_layer_releases VALUES(?,?,?)',owner,id,JSON.stringify(release));return release})
}
}
