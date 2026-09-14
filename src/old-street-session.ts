import {RecoverableSessionClient,type SessionLock} from './recoverable-session-client'
import {assertOldStreetHead,type OldStreetHead} from './old-street-head'
import {getGameApiBase} from './game-id'
export function oldStreetSession(storage:Storage,lock:SessionLock,request:typeof fetch=fetch){
 const api=async(path:string,body?:unknown)=>{
  const response=await request(getGameApiBase()+'/api/oldstreet-dev'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
  const value=await response.json();if(!response.ok)throw Error(value.error??'SESSION_REQUEST_FAILED');return value
 }
 const client=new RecoverableSessionClient<OldStreetHead>(storage,'oldstreet-dev-1:',api,{scene:h=>h.sceneId,assertHead:assertOldStreetHead,terminalErrors:['OLD_STREET_PHOTO_ALIGNMENT_REQUIRED','OLD_STREET_INPUT_UNSUPPORTED','OLD_STREET_ACTION_UNAVAILABLE','OLD_STREET_JOURNEY_COMPLETE','OLD_STREET_INTERPRETER_NOT_READY']},lock)
 return {client,api}
}
