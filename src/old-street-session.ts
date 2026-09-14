import {RecoverableSessionClient,type SessionLock} from './recoverable-session-client'
import {assertOldStreetHead,type OldStreetHead} from './old-street-head'
import {getGameApiBase} from './game-id'
import {cloudTransport} from './cloud-session'
import {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from './old-street-runtime-contract'
const sessionPolicy={scene:(h:OldStreetHead)=>h.sceneId,assertHead:assertOldStreetHead,terminalErrors:['OLD_STREET_DIALOGUE_TARGET_REQUIRED','OLD_STREET_DIALOGUE_INTRODUCTION_REQUIRED','OLD_STREET_PHOTO_ALIGNMENT_REQUIRED','OLD_STREET_INPUT_UNSUPPORTED','OLD_STREET_ACTION_UNAVAILABLE','OLD_STREET_JOURNEY_COMPLETE','OLD_STREET_INTERPRETER_NOT_READY']}
/** Production transport uses the existing private-capability handshake and UUID-scoped storage.
 * Explicit apiBase overrides are for tests; no production host or old UUID is embedded here. */
export function oldStreetSessionHttp(storage:Storage,lock:SessionLock,request:typeof fetch=fetch,apiBase=getGameApiBase()){
 const prefix='oldstreet-story-1:'
 const api=cloudTransport(storage,prefix,apiBase+OLD_STREET_API_PATH,lock,request,{header:OLD_STREET_RUNTIME_HEADER,version:OLD_STREET_RUNTIME_CONTRACT})
 return {client:new RecoverableSessionClient<OldStreetHead>(storage,prefix,api,sessionPolicy,lock),api}
}
export function oldStreetSession(storage:Storage,lock:SessionLock,request:typeof fetch=fetch){
 const api=async(path:string,body?:unknown)=>{
  const response=await request(getGameApiBase()+'/api/oldstreet-dev'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
  const value=await response.json();if(!response.ok)throw Error(value.error??'SESSION_REQUEST_FAILED');return value
 }
 const client=new RecoverableSessionClient<OldStreetHead>(storage,'oldstreet-dev-1:',api,sessionPolicy,lock)
 return {client,api}
}
