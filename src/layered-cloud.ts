import type {Transport} from './recoverable-session-client'
import {verifySpritePng} from './sprite-draft'
import type {LayeredDraft} from './layered-draft'
import {spritePartText} from './sprite-archive-contract'
import {layerManifest,assertLayerRecord,layerManifestSignature,assertLayerReview,LAYER_ARCHIVE_PART,LAYER_ARCHIVE_LIMIT,restoreLayerManifest,assertPublishedLayer,type LayerRecord,type PublishedLayer} from './layered-archive-contract'
export class LayeredCloudArchive{
 constructor(private api:Transport){}
 async list(){const r=await this.api('/layers');if(!r||Object.keys(r).join(',')!=='layers'||!Array.isArray(r.layers)||r.layers.length>LAYER_ARCHIVE_LIMIT)throw Error('LAYER_ARCHIVE_INVALID');r.layers.forEach(assertLayerRecord);if(new Set(r.layers.map((r:LayerRecord)=>r.manifest.id)).size!==r.layers.length)throw Error('LAYER_ARCHIVE_INVALID');return r.layers as LayerRecord[]}
 async save(d:LayeredDraft,notify:(n:number,total:number)=>void=()=>{}){
  const snapshot=structuredClone(d),{manifest,payload}=layerManifest(snapshot);for(const png of payload.values())await verifySpritePng(png)
  const record=await this.api('/layers',manifest);assertLayerRecord(record);if(layerManifestSignature(record.manifest)!==layerManifestSignature(manifest))throw Error('LAYER_ARCHIVE_CONFLICT')
  if(record.state!=='ready'){
   const progress=await this.api('/layers/'+manifest.id+'/parts');if(progress?.id!==manifest.id||!Array.isArray(progress.parts)||progress.parts.length>600)throw Error('LAYER_ARCHIVE_INVALID')
   const existing=new Set<string>();for(const p of progress.parts){const f=manifest.files.find(f=>f.role===p?.role);if(!f||!Number.isInteger(p.part)||p.part<0||p.part>=Math.ceil(f.bytes/LAYER_ARCHIVE_PART)||existing.has(p.role+':'+p.part))throw Error('LAYER_ARCHIVE_INVALID');existing.add(p.role+':'+p.part)}
   const total=manifest.files.reduce((n,f)=>n+Math.ceil(f.bytes/LAYER_ARCHIVE_PART),0);let done=0
   for(const f of manifest.files){const png=payload.get(f.role)!;for(let part=0,offset=0;offset<png.bytes.length;part++,offset+=LAYER_ARCHIVE_PART){const bytes=png.bytes.subarray(offset,offset+LAYER_ARCHIVE_PART);if(!existing.has(f.role+':'+part)){const r=await this.api('/layers/'+manifest.id+'/parts',{role:f.role,part,data:spritePartText(bytes)});if(r?.id!==manifest.id||r.role!==f.role||r.part!==part||r.bytes!==bytes.length)throw Error('LAYER_ARCHIVE_CONFLICT')}notify(++done,total)}}
   const ready=await this.api('/layers/'+manifest.id+'/finish',{});assertLayerRecord(ready);if(ready.state!=='ready'||layerManifestSignature(ready.manifest)!==layerManifestSignature(manifest))throw Error('LAYER_ARCHIVE_CONFLICT')
  }
  if(snapshot.review){await assertLayerReview(snapshot.review,manifest);const r=await this.api('/layers/'+manifest.id+'/review',{review:snapshot.review});await assertLayerReview(r,manifest);if(JSON.stringify(r)!==JSON.stringify(snapshot.review))throw Error('LAYER_REVIEW_CHANGED')}
 }
 async restore(record:LayerRecord){assertLayerRecord(record);const r=await this.api('/layers/'+record.manifest.id);assertLayerRecord(r);if(r.state!=='ready'||layerManifestSignature(r.manifest)!==layerManifestSignature(record.manifest))throw Error('LAYER_ARCHIVE_CONFLICT');const d=await restoreLayerManifest(r.manifest,async f=>{const bytes=await this.api('/layers/'+r.manifest.id+'/file/'+f.role);if(!(bytes instanceof Uint8Array))throw Error('LAYER_ARCHIVE_CORRUPT');return bytes});const review=await this.api('/layers/'+r.manifest.id+'/review');if(!review||Object.keys(review).join(',')!=='review')throw Error('LAYER_ARCHIVE_INVALID');if(review.review!==null){await assertLayerReview(review.review,r.manifest);d.review=structuredClone(review.review)}return d}
 async cancel(r:LayerRecord){assertLayerRecord(r);if(r.state!=='uploading')throw Error('LAYER_ARCHIVE_ALREADY_READY');const v=await this.api('/layers/'+r.manifest.id+'/cancel',{});if(v?.id!==r.manifest.id||v.cancelled!==true)throw Error('LAYER_ARCHIVE_CONFLICT')}
 async publication(id:string):Promise<PublishedLayer|null>{const r=await this.api('/layers/'+id+'/release');if(r?.release===null)return null;assertPublishedLayer(r?.release);if(r.release.id.split('.')[1]!==id)throw Error('LAYER_RELEASE_INVALID');return r.release}
 async publish(d:LayeredDraft){const snapshot=structuredClone(d),{manifest}=layerManifest(snapshot);await assertLayerReview(snapshot.review,manifest);await this.save(snapshot);const r=await this.api('/layers/'+snapshot.id+'/publish',{review:snapshot.review});assertPublishedLayer(r);if(r.id.split('.')[1]!==snapshot.id||r.sourceSha256!==snapshot.source.sha256||JSON.stringify(r.spec)!==JSON.stringify(snapshot.spec)||r.housing.sha256!==snapshot.result!.housing.sha256||r.rotor.sha256!==snapshot.result!.rotor.sha256||r.review.signature!==snapshot.review!.signature)throw Error('LAYER_RELEASE_INVALID');return r}
}
