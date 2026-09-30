import {RecoverableSessionClient,type SessionLock} from './recoverable-session-client'
import {assertOldStreetPresentationHead as assertOldStreetHead,type OldStreetPresentationHead as OldStreetHead} from './old-street-workshop'
import {getGameApiBase} from './game-id'
import {cloudTransport} from './cloud-session'
import {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from './old-street-runtime-contract'
import {oldStreetAiRefusals} from './old-street-ai-notice'
const sessionPolicy={scene:(h:OldStreetHead)=>h.sceneId,assertHead:assertOldStreetHead,terminalErrors:['OUT_OF_REACH','DYNAMIC_NOT_ADOPTED','NATIVE_ACTION_IN_DYNAMIC_ROOM','INVALID_DYNAMIC_ACTION','OLD_STREET_JOURNEY_COMPLETE','OLD_STREET_MAP_ROUTE_UNAVAILABLE','OLD_STREET_NEGATIVE_REQUIRED','OLD_STREET_TARGET_TOO_FAR','CAMPAIGN_READING_AID_REQUIRED','CAMPAIGN_RACK_SPACE_REQUIRED','CAMPAIGN_PAPERS_REQUIRED','CAMPAIGN_ALREADY_RESOLVED','CAMPAIGN_ARCHIVE_EVIDENCE_REQUIRED','CAMPAIGN_ARCHIVE_ORDER_MISMATCH','CAMPAIGN_ACTION_UNAVAILABLE','CAMPAIGN_ALREADY_PREPARED','CAMPAIGN_GENERATOR_UNAVAILABLE','CAMPAIGN_TRACE_REQUIRED','CAMPAIGN_NOT_PREPARED','CAMPAIGN_OBSERVATION_REQUIRED','CAMPAIGN_RECORD_MISMATCH','CAMPAIGN_UNFINISHED','CAMPAIGN_PLAN_REJECTED','OLD_STREET_MODEL_UNAVAILABLE','NARRATION_RATE_LIMIT','OLD_STREET_EXPANSION_UNAVAILABLE','OLD_STREET_EXPANSION_ALREADY_REQUESTED','OLD_STREET_CLOCK_INSPECTION_REQUIRED','OLD_STREET_DIALOGUE_NOT_READY','OLD_STREET_DIALOGUE_REJECTED','OLD_STREET_DIALOGUE_TIMEOUT','OLD_STREET_DIALOGUE_TARGET_REQUIRED','OLD_STREET_DIALOGUE_INTRODUCTION_REQUIRED','OLD_STREET_PHOTO_ALIGNMENT_REQUIRED','OLD_STREET_INPUT_UNSUPPORTED','OLD_STREET_ACTION_UNAVAILABLE','OLD_STREET_JOURNEY_COMPLETE','OLD_STREET_INTERPRETER_NOT_READY']}
/** Production transport uses the existing private-capability handshake and UUID-scoped storage.
 * Explicit apiBase overrides are for tests; no production host or old UUID is embedded here. */
export function oldStreetSessionHttp(storage:Storage,lock:SessionLock,request:typeof fetch=fetch,apiBase=getGameApiBase()){
 // This release starts a new registered backend world. User explicitly waived
 // migration of old records; never retry an old DO journey against PostgreSQL.
 const prefix='oldstreet-shared-workshop-1:'
 const api=cloudTransport(storage,prefix,apiBase+OLD_STREET_API_PATH,lock,request,{header:OLD_STREET_RUNTIME_HEADER,version:OLD_STREET_RUNTIME_CONTRACT})
 return {client:new RecoverableSessionClient<OldStreetHead>(storage,prefix,api,{...sessionPolicy,terminalErrors:[...sessionPolicy.terminalErrors,...oldStreetAiRefusals]},lock),api}
}
export function oldStreetSession(storage:Storage,lock:SessionLock,request:typeof fetch=fetch){
 const api=async(path:string,body?:unknown)=>{
  const response=await request(getGameApiBase()+'/api/oldstreet-dev'+path,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',signal:AbortSignal.timeout(30000),headers:body===undefined?{}:{'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)})
  const value=response.ok&&response.headers.get('Content-Type')?.startsWith('image/png')?new Uint8Array(await response.arrayBuffer()):await response.json();if(!response.ok)throw Error(value.error??'SESSION_REQUEST_FAILED');return value
 }
 const client=new RecoverableSessionClient<OldStreetHead>(storage,'oldstreet-dev-1:',api,sessionPolicy,lock)
 return {client,api}
}
