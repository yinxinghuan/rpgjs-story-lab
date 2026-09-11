import {verifySpritePng,type SpritePng} from './sprite-draft'
import {spriteDatabaseName} from './sprite-draft'
import {prepareLayeredPixels,validateLayeredSpec,LAYER_CHECKS,type LayeredSpec} from './layered-device'
import type {PixelRaster} from './sprite-preparation'
export type LayeredDraft={version:'layered-draft-1';id:string;revision:number;parentId?:string;createdAt:number;sourceName:string;source:SpritePng;spec:LayeredSpec;state:'source'|'processing'|'candidate'|'failed';error?:string;result?:{housing:SpritePng;rotor:SpritePng};review?:{signature:string;layout:'layered-north-river-1';checks:string[];visualAccepted:true}}
export type LayerIO={decode:(png:SpritePng)=>Promise<PixelRaster>;encode:(raster:PixelRaster)=>Promise<SpritePng>}
export const layeredDatabaseName=(url:string)=>spriteDatabaseName(url).replace('creator-sprite-drafts-v1','creator-layered-drafts-v1')
export class BrowserLayeredDrafts{
 private db:Promise<IDBDatabase>
 constructor(name:string,factory:IDBFactory=globalThis.indexedDB){this.db=new Promise((resolve,reject)=>{const r=factory.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('LAYER_STORAGE_FAILED'))})}
 private async read<T>(run:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T>{const db=await this.db;return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),r=run(tx.objectStore('drafts'));tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(Error('LAYER_STORAGE_FAILED'));tx.onerror=()=>{}})}
 async get(id='current'):Promise<LayeredDraft|undefined>{const d=await this.read(s=>s.get(id));if(d&&d.version!=='layered-draft-1')throw Error('LAYER_VERSION');return d}
 async list():Promise<LayeredDraft[]>{const values=await this.read(s=>s.getAll()) as LayeredDraft[];if(values.some(d=>d.version!=='layered-draft-1'))throw Error('LAYER_VERSION');return [...new Map(values.map(d=>[d.id,d])).values()].sort((a,b)=>b.createdAt-a.createdAt)}
 async save(d:LayeredDraft,expected:LayeredDraft|undefined){const db=await this.db;await new Promise<void>((resolve,reject)=>{let conflict=false;const tx=db.transaction('drafts','readwrite'),s=tx.objectStore('drafts'),r=s.get('current');r.onsuccess=()=>{const old=r.result;if(old?.id!==expected?.id||old?.revision!==expected?.revision){conflict=true;tx.abort();return}s.put(d,d.id);s.put(d,'current')};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(Error(conflict?'LAYER_DRAFT_REPLACED':'LAYER_STORAGE_FAILED'));tx.onerror=()=>{}})}
 async close(){(await this.db).close()}
}
export function newLayeredSource(source:SpritePng,name:string,spec:LayeredSpec):LayeredDraft{validateLayeredSpec(spec,source.width,source.height,source.sha256);return{version:'layered-draft-1',id:crypto.randomUUID(),revision:0,createdAt:Date.now(),source,sourceName:name.slice(0,100),spec:structuredClone(spec),state:'source'}}
export async function layerSignature(d:LayeredDraft){if(!d.result)throw Error('LAYER_NOT_READY');return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(JSON.stringify({algorithm:'layer-parts-1',source:d.source.sha256,housing:d.result.housing.sha256,rotor:d.result.rotor.sha256,spec:d.spec})))),v=>v.toString(16).padStart(2,'0')).join('')}
export async function inspectLayeredDraft(d:LayeredDraft,id:string,io:LayerIO){
 if(d.version!=='layered-draft-1'||d.id!==id||d.state!=='candidate'||!d.result)throw Error('LAYER_NOT_READY')
 await verifySpritePng(d.source);validateLayeredSpec(d.spec,d.source.width,d.source.height,d.source.sha256)
 const input=await io.decode(d.source);if(input.width!==d.source.width||input.height!==d.source.height)throw Error('LAYER_CORRUPT')
 const expected=prepareLayeredPixels(input,d.spec,d.source.sha256)
 for(const [i,png] of [d.result.housing,d.result.rotor].entries()){
  await verifySpritePng(png);const p=await io.decode(png),e=await io.decode(await io.encode(expected[i].raster))
  if(png.width!==e.width||png.height!==e.height||p.width!==e.width||p.height!==e.height||p.rgba.length!==e.rgba.length||!e.rgba.every((v,j)=>v===p.rgba[j]))throw Error('LAYER_RESULT_MISMATCH')
 }
 return {draft:d,signature:await layerSignature(d)}
}
export async function prepareLayeredDraft(repo:BrowserLayeredDrafts,source:LayeredDraft,spec:LayeredSpec,io:LayerIO,notify:(d:LayeredDraft)=>void=()=>{}){
 validateLayeredSpec(spec,source.source.width,source.source.height,source.source.sha256)
 const current=await repo.get();if(current?.id!==source.id||current.revision!==source.revision)throw Error('LAYER_DRAFT_REPLACED')
 let d:LayeredDraft={...structuredClone(source),id:crypto.randomUUID(),parentId:source.id,revision:0,createdAt:Date.now(),spec:structuredClone(spec),state:'processing'}
 delete d.result;delete d.review;delete d.error;await repo.save(d,current);notify(d)
 try{
  await verifySpritePng(d.source);const input=await io.decode(d.source)
  if(input.width!==d.source.width||input.height!==d.source.height)throw Error('LAYER_CORRUPT')
  const [housing,rotor]=prepareLayeredPixels(input,d.spec,d.source.sha256)
  const result={housing:await io.encode(housing.raster),rotor:await io.encode(rotor.raster)}
  const next:LayeredDraft={...d,revision:1,state:'candidate',result};await inspectLayeredDraft(next,next.id,io)
  await repo.save(next,d);d=next;notify(d)
 }catch(e){const current=await repo.get();if(current?.id!==d.id||current.revision!==d.revision)throw Error('LAYER_DRAFT_REPLACED');const next:LayeredDraft={...d,revision:d.revision+1,state:'failed',error:e instanceof Error?e.message:'LAYER_PREPARATION_FAILED'};await repo.save(next,d);d=next;notify(d)}
 return d
}
export async function saveLayerReview(repo:BrowserLayeredDrafts,d:LayeredDraft,checks:string[],signature:string,io:LayerIO){
 if(!LAYER_CHECKS.every(c=>checks.includes(c)))throw Error('LAYER_REVIEW_INCOMPLETE')
 const current=await repo.get();if(current?.id!==d.id||current.revision!==d.revision)throw Error('LAYER_DRAFT_REPLACED')
 const verified=await inspectLayeredDraft(current,d.id,io);if(verified.signature!==signature)throw Error('LAYER_REVIEW_CHANGED')
 const next:LayeredDraft={...current,revision:current.revision+1,review:{signature,layout:'layered-north-river-1',checks:[...LAYER_CHECKS],visualAccepted:true}}
 await repo.save(next,current);return next
}
