export type SceneResource={path:string;kind:'background'|'map';sha256:string;bytes:number;width?:number;height?:number}
export type SceneResourceManifest={version:string;scenes:Record<string,{version:string;assets:SceneResource[]}>}
export type PreparedScene={version:string;background:string}
export type PreparationState='proposed'|'preparing'|'validated'|'active'|'failed'
export class ScenePreparationError extends Error{constructor(public scene:string,public reason:string){super('SCENE_NOT_READY:'+reason)}}
type Entry={state:PreparationState;attempts:number;value?:PreparedScene;pending?:Promise<PreparedScene>;reason?:string}
export type SceneResourceLoader=(resource:SceneResource,signal:AbortSignal)=>Promise<string|undefined>
/** Cache lifetime is this immutable build. Failed entries retry only explicitly. */
export class SceneReadiness{
 private entries=new Map<string,Entry>()
 constructor(private manifest:SceneResourceManifest,private load:SceneResourceLoader,private timeoutMs=12000){}
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
  entry.pending=Promise.race([work(),deadline]).then(value=>{entry.value=value;entry.state='validated';return value},error=>{entry.state='failed';entry.reason=error instanceof ScenePreparationError?error.reason:'RESOURCE_UNAVAILABLE';throw new ScenePreparationError(id,entry.reason)}).finally(()=>{clearTimeout(timer);entry.pending=undefined;abort.abort()})
  return entry.pending
 }
}
declare const __SCENE_RESOURCES__:SceneResourceManifest
export async function loadBrowserSceneResource(resource:SceneResource,signal:AbortSignal,baseUrl=document.baseURI,fetcher:typeof fetch=fetch){
 const url=new URL(resource.path,baseUrl);url.searchParams.set('scene_asset',resource.sha256)
 const response=await fetcher(url,{signal,credentials:'omit'});if(!response.ok)throw new Error('RESOURCE_HTTP')
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==resource.bytes)throw new Error('RESOURCE_SIZE')
 const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
 if(digest!==resource.sha256)throw new Error('RESOURCE_VERSION')
 if(resource.kind==='map')return
 const blobUrl=URL.createObjectURL(new Blob([bytes],{type:'image/png'}))
 try{const img=new Image();img.src=blobUrl;await img.decode();if(signal.aborted||img.naturalWidth!==resource.width||img.naturalHeight!==resource.height)throw Error('RESOURCE_DECODE');return blobUrl}catch(e){URL.revokeObjectURL(blobUrl);throw e}
}
export function createBrowserSceneReadiness(){return new SceneReadiness(__SCENE_RESOURCES__,loadBrowserSceneResource)}
