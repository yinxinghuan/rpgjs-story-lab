import type {PublishedLayer} from '../src/layered-archive-contract'
import type {OriginalTrainAuthority} from './original-train-runtime'
import {LabError} from '../src/journey-runtime'
import {ORIGINAL_API_PATH,ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from '../src/original-runtime-contract'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
import type {PublishedDevice} from '../src/device-publication'
import type {PublishedBackground} from '../src/background-publication'
import type {PublishedActor} from '../src/actor-publication'
import type {OriginalIllustrations,IllustrationProducer} from './original-illustration'
export const originalJson=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT}})
/** Runs behind the existing capability boundary, in an original-only object. */
export async function handleOriginalSession(request:Request,owner:string,authority:OriginalTrainAuthority,readBody:(request:Request)=>Promise<any>,resolveBackground?:(id:string)=>Promise<PublishedBackground>,resolveDevice?:(id:string)=>Promise<PublishedDevice>,resolveActor?:(id:string)=>Promise<PublishedActor>,resolveFan?:(id:string)=>Promise<PublishedLayer>,illustrations?:{store:OriginalIllustrations;produce:IllustrationProducer}){
 try{
  if(request.headers.get(ORIGINAL_RUNTIME_HEADER)!==ORIGINAL_RUNTIME_CONTRACT)throw new LabError('RUNTIME_VERSION_MISMATCH',409)
  const url=new URL(request.url),path=url.pathname.slice(ORIGINAL_API_PATH.length)
  const image=path.match(/^\/sessions\/([a-zA-Z0-9-]{16,80})\/illustrations(?:\/([a-z0-9-]+)\/file)?$/)
  if(image){
   if(!illustrations)throw new LabError('ILLUSTRATION_NOT_RELEASED',404)
   const {store,produce}=illustrations
   if(request.method==='GET'&&image[2])return new Response(new Uint8Array(await store.file(owner,image[1],image[2])),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT}})
   if(request.method==='GET')return originalJson({illustrations:store.list(owner,image[1])})
   if(request.method==='POST'&&!image[2]){const job=store.start(owner,image[1],await readBody(request));await store.run(owner,image[1],job.scene,produce);return originalJson({illustrations:store.list(owner,image[1])})}
   throw new LabError('METHOD_NOT_ALLOWED',405)
  }
  if(path==='/sessions'&&request.method==='GET')return originalJson({sessions:authority.directory(owner)})
  if(path==='/sessions'&&request.method==='POST'){
   const b=await readBody(request)
   if(Object.keys(b).some(k=>!['enrollment_id','locale','backgroundRelease','deviceRelease','actorRelease','fanRelease'].includes(k))||!['zh','en'].includes(b.locale))throw new LabError('INVALID_ENROLLMENT')
   let release:PublishedBackground|undefined
   if(b.backgroundRelease!==undefined){if(typeof b.backgroundRelease!=='string'||!resolveBackground)throw new LabError('BACKGROUND_NOT_PUBLISHED',404);release=await resolveBackground(b.backgroundRelease)}
   let device:PublishedDevice|undefined
   if(b.deviceRelease!==undefined){if(typeof b.deviceRelease!=='string'||!resolveDevice)throw new LabError('DEVICE_NOT_PUBLISHED',404);device=await resolveDevice(b.deviceRelease)}
   let actor:PublishedActor|undefined
   if(b.actorRelease!==undefined){if(typeof b.actorRelease!=='string'||!resolveActor)throw new LabError('ACTOR_NOT_PUBLISHED',404);actor=await resolveActor(b.actorRelease)}
   let fan:PublishedLayer|undefined
   if(b.fanRelease!==undefined){if(typeof b.fanRelease!=='string'||!resolveFan)throw new LabError('LAYER_NOT_PUBLISHED',404);fan=await resolveFan(b.fanRelease)}
   return originalJson(authority.create(owner,b.enrollment_id,b.locale,device||actor||fan?{...(fan?{fan}:{}),...(device?{starter:device}:{}),...(actor?{actor}:{}),...(release?{background:release}:{})}:release))
  }
  if(path==='/sessions')throw new LabError('METHOD_NOT_ALLOWED',405)
  const m=path.match(/^\/sessions\/([a-zA-Z0-9-]{16,80})(?:\/(actions|position|events|ending|prepare-action|commit-action))?$/)
  if(!m)throw new LabError('NOT_FOUND',404)
  if(request.method==='GET'&&!m[2])return originalJson(authority.get(owner,m[1]))
  if(request.method==='GET'&&m[2]==='events')return originalJson({events:authority.events(owner,m[1],Number(url.searchParams.get('after')??0))})
  if(request.method==='POST'&&m[2]==='prepare-action'){
   const b=await readBody(request)
   if(b.type!=='free-input')throw new LabError('INVALID_ACTION_TYPE')
   const prepared=await authority.prepareAction(owner,m[1],b),r=prepared.result
   return originalJson({status:prepared.status,sessionId:m[1],action_id:b.action_id,expected_version:b.expected_version,sceneId:b.sceneId,destinationScene:r.head.sceneId,mapVersion:r.head.mapVersion,resolvedActionId:r.actionId,assets:r.head.assets})
  }
  if(request.method==='POST'&&m[2]==='commit-action')return originalJson(await authority.commitPreparedAction(owner,m[1],await readBody(request)))
  if(request.method==='POST'&&m[2]==='actions')return originalJson(await authority.action(owner,m[1],await readBody(request)))
  if(request.method==='POST'&&m[2]==='ending')return originalJson(await authority.ending(owner,m[1],await readBody(request)))
  if(request.method==='POST'&&m[2]==='position')return originalJson(authority.checkpoint(owner,m[1],await readBody(request)))
  throw new LabError('METHOD_NOT_ALLOWED',405)
 }catch(e){return originalJson({error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'},e instanceof LabError?e.status:503)}
}
