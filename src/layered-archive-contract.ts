import {inspectSpritePng,type SpritePng} from './sprite-draft'
import {spriteArchiveId} from './sprite-archive-contract'
import {validateLayeredSpec,LAYER_CHECKS,type LayeredSpec} from './layered-device'
import {layerContentSignature,type LayeredDraft} from './layered-draft'
import {getGameApiBase} from './game-id'
export const LAYER_ARCHIVE_LIMIT=6,LAYER_ARCHIVE_PART=49152
export type LayerFile={role:'source'|'housing'|'rotor';sha256:string;bytes:number;width:number;height:number}
export type LayerManifest={version:1;id:string;createdAt:number;sourceName:string;spec:LayeredSpec;files:LayerFile[]}
export type LayerRecord={manifest:LayerManifest;state:'uploading'|'ready';createdAt:number}
export type LayerReview=NonNullable<LayeredDraft['review']>
export type PublishedLayer={version:1;id:string;slot:'tunnel-fan';sourceSha256:string;sourceWidth:number;sourceHeight:number;spec:LayeredSpec;housing:LayerFile;rotor:LayerFile;review:LayerReview}
const bad=()=>{throw Error('LAYER_ARCHIVE_INVALID')}
const integer=(n:any,a:number,b:number)=>Number.isInteger(n)&&n>=a&&n<=b
function assertFile(f:any):asserts f is LayerFile{if(!f||Object.keys(f).sort().join(',')!=='bytes,height,role,sha256,width'||!['source','housing','rotor'].includes(f.role)||typeof f.sha256!=='string'||!/^[a-f0-9]{64}$/.test(f.sha256)||!integer(f.bytes,45,8*1024*1024)||!integer(f.width,16,1536)||!integer(f.height,16,1536)||f.width*f.height>1572864)bad()}
export function assertLayerManifest(m:any):asserts m is LayerManifest{
 if(!m||Object.keys(m).sort().join(',')!=='createdAt,files,id,sourceName,spec,version'||m.version!==1||!spriteArchiveId(m.id)||!integer(m.createdAt,0,Number.MAX_SAFE_INTEGER)||typeof m.sourceName!=='string'||m.sourceName.length>100||!Array.isArray(m.files)||m.files.length!==3||JSON.stringify(m).length>5500)bad()
 m.files.forEach(assertFile);if(m.files.map((f:LayerFile)=>f.role).join(',')!=='source,housing,rotor'||m.files.reduce((n:number,f:LayerFile)=>n+f.bytes,0)>24*1024*1024)bad()
 const [source,housing,rotor]=m.files;validateLayeredSpec(m.spec,source.width,source.height,source.sha256)
 if(housing.width!==source.width/2||rotor.width!==housing.width||housing.height!==source.height||rotor.height!==source.height)bad()
}
export function layerManifest(d:LayeredDraft){if(d.state!=='candidate'||!d.result)throw Error('LAYER_NOT_READY');const files:LayerFile[]=[],payload=new Map<string,SpritePng>();for(const [role,p]of [['source',d.source],['housing',d.result.housing],['rotor',d.result.rotor]]as const){files.push({role,sha256:p.sha256,bytes:p.bytes.length,width:p.width,height:p.height});payload.set(role,p)}const manifest:LayerManifest={version:1,id:d.id,createdAt:d.createdAt,sourceName:d.sourceName,spec:structuredClone(d.spec),files};assertLayerManifest(manifest);return{manifest,payload}}
export function assertLayerRecord(r:any):asserts r is LayerRecord{if(!r||Object.keys(r).sort().join(',')!=='createdAt,manifest,state'||!['uploading','ready'].includes(r.state)||!integer(r.createdAt,0,Number.MAX_SAFE_INTEGER))bad();assertLayerManifest(r.manifest)}
export const layerManifestSignature=(m:LayerManifest)=>JSON.stringify(m)
export const layerManifestContentSignature=(m:LayerManifest)=>layerContentSignature(m.files[0].sha256,m.files[1].sha256,m.files[2].sha256,m.spec)
export function assertLayerReviewShape(r:any):asserts r is LayerReview{if(!r||Object.keys(r).sort().join(',')!=='checks,layout,signature,visualAccepted'||r.layout!=='layered-north-river-1'||r.visualAccepted!==true||typeof r.signature!=='string'||!/^[a-f0-9]{64}$/.test(r.signature)||!Array.isArray(r.checks)||r.checks.join(',')!==LAYER_CHECKS.join(','))throw Error('LAYER_REVIEW_REQUIRED')}
export async function assertLayerReview(r:any,m:LayerManifest){assertLayerReviewShape(r);if(r.signature!==await layerManifestContentSignature(m))throw Error('LAYER_REVIEW_CHANGED')}
export const layerReleaseId=(id:unknown):id is string=>typeof id==='string'&&/^[a-f0-9]{64}\.[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)
export function assertPublishedLayer(r:any):asserts r is PublishedLayer{
 if(!r||Object.keys(r).sort().join(',')!=='housing,id,review,rotor,slot,sourceHeight,sourceSha256,sourceWidth,spec,version'||r.version!==1||!layerReleaseId(r.id)||r.slot!=='tunnel-fan'||typeof r.sourceSha256!=='string'||!/^[a-f0-9]{64}$/.test(r.sourceSha256))throw Error('LAYER_RELEASE_INVALID')
 validateLayeredSpec(r.spec,r.sourceWidth,r.sourceHeight,r.sourceSha256);assertFile(r.housing);assertFile(r.rotor);assertLayerReviewShape(r.review)
 if(r.housing.role!=='housing'||r.rotor.role!=='rotor'||r.housing.width!==r.sourceWidth/2||r.rotor.width!==r.housing.width||r.housing.height!==r.sourceHeight||r.rotor.height!==r.sourceHeight)throw Error('LAYER_RELEASE_INVALID')
}
export const layerReleasePath=(id:string)=>{if(!layerReleaseId(id))throw Error('LAYER_RELEASE_INVALID');return getGameApiBase()+'/api/creator/layer-releases/'+id}
export async function restoreLayerManifest(m:LayerManifest,read:(f:LayerFile)=>Promise<Uint8Array>):Promise<LayeredDraft>{assertLayerManifest(m);const files:SpritePng[]=[];for(const f of m.files){const p=await inspectSpritePng(await read(f));if(p.bytes.length!==f.bytes||p.sha256!==f.sha256||p.width!==f.width||p.height!==f.height)throw Error('LAYER_ARCHIVE_CORRUPT');files.push(p)}return{version:'layered-draft-1',id:m.id,revision:1,createdAt:m.createdAt,sourceName:m.sourceName,source:files[0],spec:structuredClone(m.spec),state:'candidate',result:{housing:files[1],rotor:files[2]}}}
