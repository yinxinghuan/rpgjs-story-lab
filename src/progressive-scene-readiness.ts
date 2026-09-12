import {ScenePreparationError,SCENE_PREPARATION_TIMEOUT_MS,type SceneResourceManifest,type SceneResourceLoader,type SceneResource,type ResourceStage,ResourceLoadError} from './scene-readiness'

type Job={state:'loading'|'ready'|'failed';pending?:Promise<string|undefined>;value?:string;abort:AbortController;started:number;finished?:number;stage:ResourceStage;reason?:string;status?:number}
/** Original-game presentation only: verified collision maps remain mandatory.
 * Background failure cannot invalidate a committed, playable map. */
export class ProgressiveSceneReadiness{
 private jobs=new Map<string,Job>()
 private disposed=false
 constructor(private manifest:SceneResourceManifest,private load:SceneResourceLoader,private changed:()=>void=()=>{},private timeout=SCENE_PREPARATION_TIMEOUT_MS){}
 private spec(id:string){const s=this.manifest.scenes[id];if(!s)throw new ScenePreparationError(id,'UNREGISTERED_SCENE');if(s.assets.filter(r=>r.kind==='background').length!==1||!s.assets.some(r=>r.kind==='map'))throw new ScenePreparationError(id,'INVALID_SCENE_RESOURCES');return s}
 private key(id:string,r:SceneResource){return id+':'+r.kind+':'+r.sha256}
 private request(id:string,r:SceneResource,retry=false):Promise<string|undefined>{
  if(this.disposed)return Promise.reject(new ScenePreparationError(id,'DISPOSED'))
  const key=this.key(id,r),old=this.jobs.get(key)
  if(old?.state==='ready')return Promise.resolve(old.value)
  if(old?.pending)return old.pending
  if(old?.state==='failed'&&!retry)return Promise.reject(new ScenePreparationError(id,'RESOURCE_UNAVAILABLE'))
  const job:Job={state:'loading',abort:new AbortController(),started:performance.now(),stage:'download'};this.jobs.set(key,job)
  let timer:ReturnType<typeof setTimeout>
  const deadline=new Promise<never>((_,reject)=>{timer=setTimeout(()=>{job.abort.abort();reject(new ScenePreparationError(id,'TIMEOUT'))},this.timeout)})
  const work=Promise.resolve().then(()=>this.load(r,job.abort.signal,stage=>{if(!job.abort.signal.aborted)job.stage=stage})).then(value=>{
   if(job.abort.signal.aborted||this.disposed){if(value)URL.revokeObjectURL(value);throw new ScenePreparationError(id,'ABORTED')}
   if(r.kind==='background'&&!value)throw new ScenePreparationError(id,'NO_BACKGROUND')
   return value
  })
  job.pending=Promise.race([work,deadline]).then(value=>{job.value=value;job.state='ready';return value},error=>{job.state='failed';const code=error instanceof ScenePreparationError?error.reason:error instanceof Error?error.message:'';job.reason=['TIMEOUT','ABORTED','NO_BACKGROUND','RESOURCE_HTTP','RESOURCE_NETWORK','RESOURCE_BODY','RESOURCE_SIZE','RESOURCE_VERSION','RESOURCE_DECODE'].includes(code)?code:'RESOURCE_UNAVAILABLE';if(error instanceof ResourceLoadError&&Number.isInteger(error.status)&&error.status!>=100&&error.status!<=599)job.status=error.status;throw new ScenePreparationError(id,'RESOURCE_UNAVAILABLE')}).finally(()=>{job.finished=performance.now();clearTimeout(timer);job.pending=undefined;job.abort.abort();if(!this.disposed)this.changed()})
  return job.pending
 }
 async prepare(id:string,retry=false){
  const spec=this.spec(id)
  await Promise.all(spec.assets.filter(r=>r.kind==='map').map(r=>this.request(id,r,retry)))
  // Handle rejection here: a decorative download is deliberately non-blocking.
  void this.prepareBackground(id).catch(()=>{})
  return {version:spec.version,background:this.background(id)??''}
 }
 prepareBackground(id:string,retry=false){const r=this.spec(id).assets.find(r=>r.kind==='background')!;const pending=this.request(id,r,retry);this.changed();return pending}
 background(id:string){const r=this.spec(id).assets.find(r=>r.kind==='background')!;return this.jobs.get(this.key(id,r))?.value}
 backgroundState(id:string){const r=this.spec(id).assets.find(r=>r.kind==='background')!;return this.jobs.get(this.key(id,r))?.state??'loading'}
 diagnostics(id:string){return this.spec(id).assets.map(r=>{const j=this.jobs.get(this.key(id,r));return{kind:r.kind,bytes:r.bytes,state:j?.state??'not-started',stage:j?.stage??null,elapsedMs:j?Math.max(0,Math.round((j.finished??performance.now())-j.started)):0,reason:j?.reason??null,status:j?.status??null}})}
 activate(id:string){if(!this.spec(id).assets.filter(r=>r.kind==='map').every(r=>this.jobs.get(this.key(id,r))?.state==='ready'))throw new ScenePreparationError(id,'NOT_VALIDATED')}
 dispose(){this.disposed=true;for(const job of this.jobs.values()){job.abort.abort();if(job.value)URL.revokeObjectURL(job.value)}this.jobs.clear()}
}
