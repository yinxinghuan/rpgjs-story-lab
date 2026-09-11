import {artDraftDatabaseName} from './art-draft'
import type {PixelRaster, PreparedSprite, SpritePreparationSpec} from './sprite-preparation'
import {composeRepairFrames} from './sprite-composition'
import type {DeviceReview} from './device-publication'
import type {SpriteGenerationSource} from './sprite-generation-recipe'
import type {ActorSheetReview} from './actor-sheet-review'
export type SpritePng = {bytes: Uint8Array; sha256: string; width: number; height: number}
export type SpriteCompositionInput={source:SpritePng;sourceName:string;columns:number;column:number;generation?:SpriteGenerationSource}
export type SpriteDraft = {
  version: 'sprite-draft-1'; id: string; revision: number; parentId?: string; createdAt: number;
  source: SpritePng; sourceName: string; sourceKind?: 'actor'|'states'; spec?: SpritePreparationSpec;
  deviceStateSet?: 'repair'; composition?: {version:1;inputs:SpriteCompositionInput[]};
  deviceReview?: DeviceReview;
  actorReview?: ActorSheetReview;
  generation?: SpriteGenerationSource;
  state: 'source'|'processing'|'candidate'|'failed'; error?: string;
  result?: {png: SpritePng; frames: PreparedSprite['frames']; metrics: PreparedSprite['metrics']; algorithm: PreparedSprite['algorithm']}
}
export interface SpriteDraftRepository {
  get(id?: string): Promise<SpriteDraft|undefined>
  save(draft: SpriteDraft, expected: SpriteDraft|undefined): Promise<void>
  list(): Promise<SpriteDraft[]>
}
export function spriteDatabaseName(url: string) {return artDraftDatabaseName(url).replace('creator-art-drafts-v1','creator-sprite-drafts-v1')}
export async function inspectSpritePng(raw: Uint8Array): Promise<SpritePng> {
  const bytes = new Uint8Array(raw)
  if (bytes.length < 45 || bytes.length > 8*1024*1024 || ![137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v)) throw Error('SPRITE_INVALID_PNG')
  const view = new DataView(bytes.buffer)
  const width=view.getUint32(16),height=view.getUint32(20)
  if(view.getUint32(8)!==13 || String.fromCharCode(...bytes.subarray(12,16))!=='IHDR' || !width || !height || width>1536 || height>1536 || width*height>1572864) throw Error('SPRITE_INVALID_SIZE')
  const sha256=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),v=>v.toString(16).padStart(2,'0')).join('')
  return {bytes,sha256,width,height}
}
export async function verifySpritePng(png: SpritePng) {
  const checked=await inspectSpritePng(png.bytes)
  if(checked.sha256!==png.sha256 || checked.width!==png.width || checked.height!==png.height) throw Error('SPRITE_CORRUPT')
  return checked
}
export function newSpriteSource(source: SpritePng, sourceName: string,sourceKind:'actor'|'states'='actor'): SpriteDraft {
  return {version:'sprite-draft-1',id:crypto.randomUUID(),revision:0,createdAt:Date.now(),source,sourceName:sourceName.slice(0,100),sourceKind,state:'source'}
}
export async function verifySpriteComposition(draft:SpriteDraft,decode:(png:SpritePng)=>Promise<PixelRaster>,decoded?:PixelRaster){
 if(!draft.composition)return
 const c=draft.composition
 if(c.version!==1||!Array.isArray(c.inputs)||c.inputs.length!==2||draft.sourceKind!=='states'||draft.deviceStateSet!=='repair')throw Error('SPRITE_COMPOSITION_INVALID')
 const frames=[]
 for(const i of c.inputs){await verifySpritePng(i.source);const raster=await decode(i.source);if(raster.width!==i.source.width||raster.height!==i.source.height)throw Error('SPRITE_DECODE');frames.push({raster,columns:i.columns,column:i.column})}
 const expected=composeRepairFrames(frames),actual=decoded??await decode(draft.source)
 if(expected.width!==actual.width||expected.height!==actual.height||expected.rgba.length!==actual.rgba.length||!expected.rgba.every((v,i)=>v===actual.rgba[i]))throw Error('SPRITE_COMPOSITION_MISMATCH')
}
export class BrowserSpriteDrafts implements SpriteDraftRepository {
  private db: Promise<IDBDatabase>
  constructor(name: string,factory: IDBFactory=globalThis.indexedDB) {
    this.db=new Promise((resolve,reject)=>{const r=factory.open(name,1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)};r.onerror=()=>reject(r.error);r.onblocked=()=>reject(Error('SPRITE_STORAGE_BLOCKED'))})
  }
  private async read<T>(work:(s:IDBObjectStore)=>IDBRequest<T>):Promise<T> {
    const db=await this.db
    return new Promise((resolve,reject)=>{const tx=db.transaction('drafts','readonly'),r=work(tx.objectStore('drafts'));tx.oncomplete=()=>resolve(r.result);tx.onabort=()=>reject(tx.error??Error('SPRITE_STORAGE_FAILED'));tx.onerror=()=>{}})
  }
  async get(id?:string) {
    const value=await this.read(s=>s.get(id??'current')) as SpriteDraft|undefined
    if(value && value.version!=='sprite-draft-1') throw Error('SPRITE_VERSION_UNSUPPORTED')
    return value
  }
  async list() {
    const values=await this.read(s=>s.getAll()) as SpriteDraft[]
    const unique=new Map<string,SpriteDraft>()
    for(const v of values){if(v.version!=='sprite-draft-1')throw Error('SPRITE_VERSION_UNSUPPORTED');unique.set(v.id,v)}
    return [...unique.values()].sort((a,b)=>b.createdAt-a.createdAt)
  }
  async save(draft:SpriteDraft,expected:SpriteDraft|undefined) {
    const db=await this.db
    await new Promise<void>((resolve,reject)=>{
      const tx=db.transaction('drafts','readwrite'),store=tx.objectStore('drafts'),read=store.get('current');let conflict=false
      read.onsuccess=()=>{
        const actual=read.result as SpriteDraft|undefined
        if(actual?.id!==expected?.id || actual?.revision!==expected?.revision){conflict=true;tx.abort();return}
        store.put(draft,draft.id);store.put(draft,'current')
      }
      tx.oncomplete=()=>resolve();tx.onabort=()=>reject(Error(conflict?'SPRITE_DRAFT_REPLACED':'SPRITE_STORAGE_FAILED'));tx.onerror=()=>{}
    })
  }
  async close(){(await this.db).close()}
}
export type SpriteProcessor=(input:PixelRaster,spec:SpritePreparationSpec,signal?:AbortSignal)=>Promise<PreparedSprite>
export async function runSpriteDraft(repo:SpriteDraftRepository,source:SpriteDraft,spec:SpritePreparationSpec,io:{decode:(png:SpritePng)=>Promise<PixelRaster>;encode:(raster:PixelRaster)=>Promise<SpritePng>;process:SpriteProcessor},signal?:AbortSignal,notify:(draft:SpriteDraft)=>void=()=>{}) {
  if(signal?.aborted)throw Error('SPRITE_PREPARATION_ABORTED')
  const current=await repo.get()
  if(current?.id!==source.id || current.revision!==source.revision)throw Error('SPRITE_DRAFT_REPLACED')
  // New attempts preserve all earlier source/candidate records, even after failure.
  let draft:SpriteDraft={...structuredClone(source),id:crypto.randomUUID(),parentId:source.id,revision:0,createdAt:Date.now(),spec:structuredClone(spec),state:'processing'}
  delete draft.result;delete draft.error;delete draft.deviceReview;delete draft.actorReview
  await repo.save(draft,current);notify(draft)
  try {
    await verifySpritePng(draft.source)
    const input=await io.decode(draft.source)
    if(input.width!==draft.source.width || input.height!==draft.source.height)throw Error('SPRITE_DECODE')
    await verifySpriteComposition(draft,io.decode,input)
    if(signal?.aborted)throw Error('SPRITE_PREPARATION_ABORTED')
    const prepared=await io.process(input,draft.spec!,signal)
    if(signal?.aborted)throw Error('SPRITE_PREPARATION_ABORTED')
    const png=await io.encode(prepared.raster);await verifySpritePng(png)
    if(png.width!==draft.spec!.columns*draft.spec!.cellWidth || png.height!==draft.spec!.rows*draft.spec!.cellHeight)throw Error('SPRITE_ENCODE')
    if(signal?.aborted)throw Error('SPRITE_PREPARATION_ABORTED')
    const next:SpriteDraft={...draft,revision:1,state:'candidate',result:{png,frames:prepared.frames,metrics:prepared.metrics,algorithm:prepared.algorithm}}
    await repo.save(next,draft);draft=next;notify(draft)
  } catch(e) {
    const latest=await repo.get()
    if(latest?.id!==draft.id || latest.revision!==draft.revision)throw Error('SPRITE_DRAFT_REPLACED')
    const error=e instanceof Error&&/^SPRITE_[A-Z_]+$/.test(e.message)?e.message:'SPRITE_PREPARATION_FAILED'
    const next:SpriteDraft={...draft,revision:draft.revision+1,state:'failed',error}
    await repo.save(next,draft);draft=next;notify(draft)
  }
  return draft
}
