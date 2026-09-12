import {layerReleaseId} from './layered-archive-contract'
import type {OriginalActionPlan} from './original-action-plan'
import {cloudTransport} from './cloud-session'
import {OriginalSessionClient} from './original-session-client'
import {getGameApiBase} from './game-id'
import {ORIGINAL_API_PATH,ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from './original-runtime-contract'
import type {SessionLock} from './recoverable-session-client'
import {actorReleaseId} from './actor-publication'
import {deviceReleaseId} from './device-publication'
import {backgroundReleaseId} from './background-publication'
/** Caller supplies the existing UUID-scoped storage adapter and Web Locks.
 * apiBase is only overridden for tests; a published background gets separate
 * pending/continuation keys while sharing this game’s original identity. */
export function originalSessionHttp(storage:Storage,lock:SessionLock,request:typeof fetch=fetch,apiBase=getGameApiBase(),prepareScene?:(plan:OriginalActionPlan)=>Promise<void>,backgroundRelease?:string,deviceRelease?:string,actorRelease?:string,fanRelease?:string,heroRelease?:string){
 const prefix='original-story-1-'
 const transport=cloudTransport(storage,prefix,apiBase+ORIGINAL_API_PATH,lock,request,{header:ORIGINAL_RUNTIME_HEADER,version:ORIGINAL_RUNTIME_CONTRACT})
 const api:typeof transport=(path,body)=>{
  if(backgroundRelease!==undefined&&!backgroundReleaseId(backgroundRelease))return Promise.reject(Error('BACKGROUND_RELEASE_INVALID'))
  if(deviceRelease!==undefined&&!deviceReleaseId(deviceRelease))return Promise.reject(Error('DEVICE_RELEASE_INVALID'))
  if(actorRelease!==undefined&&!actorReleaseId(actorRelease))return Promise.reject(Error('ACTOR_RELEASE_INVALID'))
  if(heroRelease!==undefined&&!actorReleaseId(heroRelease))return Promise.reject(Error('ACTOR_RELEASE_INVALID'))
  if(fanRelease!==undefined&&!layerReleaseId(fanRelease))return Promise.reject(Error('LAYER_RELEASE_INVALID'))
  return transport(path,path==='/sessions'&&body?{...body as object,...(backgroundRelease?{backgroundRelease}:{}),...(deviceRelease?{deviceRelease}:{}),...(actorRelease?{actorRelease}:{}),...(fanRelease?{fanRelease}:{}),...(heroRelease?{heroRelease}:{})}:body)
 }
 const baseContinuation=actorRelease?prefix+'actor:'+actorRelease+':device:'+(deviceRelease??'default')+':background:'+(backgroundRelease??'default')+':':deviceRelease?prefix+'device:'+deviceRelease+':background:'+(backgroundRelease??'default')+':':backgroundRelease?prefix+'background:'+backgroundRelease+':':prefix
 const withFan=fanRelease?baseContinuation+'fan:'+fanRelease+':':baseContinuation
 const continuation=heroRelease?withFan+'hero:'+heroRelease+':':withFan
 return {client:new OriginalSessionClient(storage,continuation,api,lock,prepareScene),api}
}
