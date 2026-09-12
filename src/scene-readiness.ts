import {abortableArtLoad} from './abortable-art-load'
export type SceneResource={path:string;kind:'background'|'map';sha256:string;bytes:number;width?:number;height?:number}
export type SceneResourceManifest={version:string;scenes:Record<string,{version:string;assets:SceneResource[]}>}
export type PreparedScene={version:string;background:string}
export type PreparationState='proposed'|'preparing'|'validated'|'active'|'failed'
// The budget includes both downloads, SHA verification and image decoding.
// Mobile WebViews may need more than 12 seconds for a cold multi-megabyte scene.
export const SCENE_PREPARATION_TIMEOUT_MS=30000
const resourceFailures=new Set(['RESOURCE_HTTP','RESOURCE_SIZE','RESOURCE_VERSION','RESOURCE_DECODE'])
export class ScenePreparationError extends Error{constructor(public scene:string,public reason:string){super('SCENE_NOT_READY:'+reason)}}
type Entry={state:PreparationState;attempts:number;value?:PreparedScene;pending?:Promise<PreparedScene>;reason?:string}
export type ResourceStage='download'|'body'|'hash'|'decode'|'ready'
export type SceneResourceLoader=(resource:SceneResource,signal:AbortSignal,report?:(stage:ResourceStage)=>void)=>Promise<string|undefined>
export class ResourceLoadError extends Error{constructor(code:string,public status?:number){super(code)}}
/** Cache lifetime is this immutable build. Failed entries retry only explicitly. */
export class SceneReadiness{
 private entries=new Map<string,Entry>()
 constructor(private manifest:SceneResourceManifest,private load:SceneResourceLoader,private timeoutMs=SCENE_PREPARATION_TIMEOUT_MS){}
 status(id:string){const e=this.entries.get(id);return {state:e?.state??'proposed',attempts:e?.attempts??0,reason:e?.reason,version:this.manifest.scenes[id]?.version}}
 background(id:string){return this.entries.get(id)?.value?.background}
 activate(id:string){const e=this.entries.get(id);if(!e?.value||!['validated','active'].includes(e.state))throw new ScenePreparationError(id,'NOT_VALIDATED');e.state='active'}
 prepare(id:string,retry=false):Promise<PreparedScene>{
  const spec=this.manifest.scenes[id];if(!spec)return Promise.reject(new ScenePreparationError(id,'UNREGISTERED_SCENE'))
  const old=this.entries.get(id);if(old?.value)return Promise.resolve(old.value);if(old?.pending)return old.pending
  if(old?.state==='failed'&&!retry)return Promise.reject(new ScenePreparationError(id,old.reason??'FAILED'))
  const entry:Entry={state:'preparing',attempts:(old?.attempts??0)+1};this.entries.set(id,entry)
  const abort=new AbortController();let timer:ReturnType<typeof setTimeout>
  const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{abort.abort();reject(new ScenePreparationError(id,'TIMEOUT'))},this.timeoutMs)})
  const work=async()=>{if(spec.assets.filter(r=>r.kind==='background').length!==1)throw new ScenePreparationError(id,'INVALID_BACKGROUND_COUNT');let background='';for(const resource of [...spec.assets].sort((a,b)=>Number(a.kind==='background')-Number(b.kind==='background'))){const result=await this.load(resource,abort.signal);if(abort.signal.aborted)throw new ScenePreparationError(id,'ABORTED');if(resource.kind==='background')background=result??''}if(!background)throw new ScenePreparationError(id,'NO_BACKGROUND');return {version:spec.version,background}}
  entry.pending=Promise.race([work(),deadline]).then(value=>{entry.value=value;entry.state='validated';return value},error=>{entry.state='failed';entry.reason=error instanceof ScenePreparationError?error.reason:error instanceof Error&&resourceFailures.has(error.message)?error.message:'RESOURCE_UNAVAILABLE';throw new ScenePreparationError(id,entry.reason)}).finally(()=>{clearTimeout(timer);entry.pending=undefined;abort.abort()})
  return entry.pending
 }
}
declare const __SCENE_RESOURCES__:SceneResourceManifest
export async function loadBrowserSceneResource(resource:SceneResource,signal:AbortSignal,baseUrl:string|((stage:ResourceStage)=>void)=document.baseURI,fetcher:typeof fetch=fetch,report?:(stage:ResourceStage)=>void){
 if(typeof baseUrl==='function'){report=baseUrl;baseUrl=document.baseURI}
 const url=new URL(resource.path,baseUrl);url.searchParams.set('scene_asset',resource.sha256)
 report?.('download')
 let response:Response;try{response=await fetcher(url,{signal,credentials:'omit'})}catch{throw new ResourceLoadError('RESOURCE_NETWORK')}
 if(!response.ok)throw new ResourceLoadError('RESOURCE_HTTP',response.status)
 report?.('body')
 let bytes:ArrayBuffer;try{bytes=await response.arrayBuffer()}catch{throw new ResourceLoadError('RESOURCE_BODY')}
 if(bytes.byteLength!==resource.bytes)throw new Error('RESOURCE_SIZE')
 report?.('hash')
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
 if(digest!==resource.sha256)throw new Error('RESOURCE_VERSION')
 if(resource.kind==='map'){report?.('ready');return}
 report?.('decode')
 const blobUrl=URL.createObjectURL(new Blob([bytes],{type:'image/png'}))
 const img=new Image()
 try{img.src=blobUrl;await abortableArtLoad(()=>img.decode(),signal);if(signal.aborted||img.naturalWidth!==resource.width||img.naturalHeight!==resource.height)throw Error('RESOURCE_DECODE');report?.('ready');return blobUrl}catch{img.src='';URL.revokeObjectURL(blobUrl);throw new ResourceLoadError('RESOURCE_DECODE')}
}
export const loadTrackedBrowserSceneResource:SceneResourceLoader=(resource,signal,report)=>loadBrowserSceneResource(resource,signal,undefined,undefined,report)
export function createBrowserSceneReadiness(){return new SceneReadiness(__SCENE_RESOURCES__,loadBrowserSceneResource)}
