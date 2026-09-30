import {randomId} from './random-id'
import type {RecoverableSessionClient,SessionLock,Transport} from './recoverable-session-client'
import type {OldStreetPresentationHead} from './old-street-workshop'
export type WorkshopJob={id:string;state:'queued'|'running'|'ready'|'failed'|'stale';label?:string;detail?:string;artifact_hash?:string;error?:string}
type Envelope={session_id:string;expected_version:number;adoption_id:string;artifact_hash:string}
const key='oldstreet-workshop-adoption-1'
const terminal=new Set(['DELTA_STALE','VERSION_CONFLICT','SOURCE_ALREADY_FORKED','ADOPTION_ID_CONFLICT','ARTIFACT_REVOKED','SESSION_NOT_FOUND','DYNAMIC_CHAIN_LIMIT'])
export function createWorkshopClient(storage:Storage,api:Transport,client:RecoverableSessionClient<OldStreetPresentationHead>,lock:SessionLock){
 const read=():Envelope|null=>{
  const raw=storage.getItem(key);if(!raw)return null
  const value=JSON.parse(raw) as Envelope
  if(!value||Object.keys(value).sort().join(',')!=='adoption_id,artifact_hash,expected_version,session_id'||!Number.isSafeInteger(value.expected_version)||value.expected_version<0||!/^[-a-zA-Z0-9]{16,80}$/.test(value.session_id)||!/^[-a-zA-Z0-9]{16,80}$/.test(value.adoption_id)||!/^[a-f0-9]{64}$/.test(value.artifact_hash))throw Error('INVALID_WORKSHOP_RECOVERY')
  return value
 }
 const settle=async(e:Envelope)=>{
  let result
  try{result=await api('/sessions/'+e.session_id+'/restoration-adopt',e)}catch(error){if(error instanceof Error&&terminal.has(error.message))storage.removeItem(key);throw error}
  if(!result?.head?.id||result.head.id===e.session_id)throw Error('WORKSHOP_RESPONSE_INVALID')
  // Follow the idempotent receipt, then read the latest head through the same
  // session client. Never import the receipt as a locally authoritative save.
  const head=await client.selectSession(result.head.id)
  if(storage.getItem(key)===JSON.stringify(e))storage.removeItem(key)
  return head
 }
 return {
  pending:()=>read()!==null,
  recover:()=>lock(key,async()=>{const pending=read();return pending?settle(pending):null}),
  async status(id:string):Promise<{job:WorkshopJob|null}>{return api('/sessions/'+id+'/restoration')},
  async propose(head:OldStreetPresentationHead):Promise<{job:WorkshopJob}>{
   if(read()||client.hasPending())throw Error('PENDING_ACTION')
   const pendingKey='oldstreet-workshop-proposal-1:'+head.id
   let pending=JSON.parse(storage.getItem(pendingKey)??'null')
   if(!pending){pending={proposal_id:randomId(),expected_version:head.version};storage.setItem(pendingKey,JSON.stringify(pending))}
   try{const r=await api('/sessions/'+head.id+'/restoration',pending);storage.removeItem(pendingKey);return r}
   catch(e){if(e instanceof Error&&terminal.has(e.message))storage.removeItem(pendingKey);throw e}
  },
  adopt:(head:OldStreetPresentationHead,artifact:string)=>lock(key,async()=>{
   if(client.hasPending())throw Error('PENDING_ACTION')
   let e=read()
   if(e&&(e.session_id!==head.id||e.artifact_hash!==artifact))throw Error('PENDING_ADOPTION')
   if(!e){e={session_id:head.id,expected_version:head.version,adoption_id:randomId(),artifact_hash:artifact};storage.setItem(key,JSON.stringify(e))}
   return settle(e)
  }),
 }
}
