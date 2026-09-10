import {cloudTransport} from './cloud-session'
import {OriginalSessionClient} from './original-session-client'
import {getGameApiBase} from './game-id'
import {ORIGINAL_API_PATH,ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from './original-runtime-contract'
import type {SessionLock} from './recoverable-session-client'
/** Caller supplies the existing UUID-scoped storage adapter and Web Locks.
 * The final argument is only a test transport base, never a deployed old UUID. */
export function originalSessionHttp(storage:Storage,lock:SessionLock,request:typeof fetch=fetch,apiBase=getGameApiBase()){
 const prefix='original-story-1-'
 const api=cloudTransport(storage,prefix,apiBase+ORIGINAL_API_PATH,lock,request,{header:ORIGINAL_RUNTIME_HEADER,version:ORIGINAL_RUNTIME_CONTRACT})
 return {client:new OriginalSessionClient(storage,prefix,api,lock),api}
}
