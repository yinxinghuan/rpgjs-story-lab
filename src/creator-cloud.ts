import {cloudTransport} from './cloud-session'
import {getGameApiBase} from './game-id'
import type {SessionLock,Transport} from './recoverable-session-client'
import {assertCloudArtRecord,CREATOR_API_PATH,CREATOR_RUNTIME_HEADER,CREATOR_RUNTIME_CONTRACT,CREATOR_DRAFT_LIMIT,type CloudArtRecord} from './creator-contract'
import {ART_DRAFT_VERSION,inspectArtCandidate,type ArtDraft} from './art-draft'
export function creatorCloudTransport(storage:Storage,lock:SessionLock,request:typeof fetch=fetch,base=getGameApiBase()){
 return cloudTransport(storage,'creator-art-1-',base+CREATOR_API_PATH,lock,request,{header:CREATOR_RUNTIME_HEADER,version:CREATOR_RUNTIME_CONTRACT})
}
export class CreatorCloudDrafts{
 constructor(private api:Transport){}
 async list(){const result=await this.api('/drafts');if(!Array.isArray(result?.drafts)||result.drafts.length>CREATOR_DRAFT_LIMIT)throw Error('INVALID_ART_RECORD');result.drafts.forEach(assertCloudArtRecord);return result.drafts as CloudArtRecord[]}
 async save(draft:ArtDraft){
  if(draft.state!=='candidate'||!draft.taskId||!draft.candidate)throw Error('ART_NOT_READY')
  const result=await this.api('/drafts',{id:draft.id,taskId:draft.taskId,sha256:draft.candidate.sha256,lighting:draft.lighting,request:draft.request})
  assertCloudArtRecord(result)
  if(result.id!==draft.id||result.taskId!==draft.taskId||result.sha256!==draft.candidate.sha256||result.lighting!==draft.lighting||result.bytes!==draft.candidate.bytes.length)throw Error('ART_SOURCE_MISMATCH')
  return result
 }
 async restore(record:CloudArtRecord):Promise<ArtDraft>{
  assertCloudArtRecord(record)
  const result=await this.api('/drafts/'+record.id);assertCloudArtRecord(result)
  if(result.id!==record.id||result.sha256!==record.sha256||result.taskId!==record.taskId||result.bytes!==record.bytes||result.lighting!==record.lighting)throw Error('ART_SOURCE_MISMATCH')
  const bytes=await this.api('/drafts/'+record.id+'/file')
  if(!(bytes instanceof Uint8Array))throw Error('ART_INVALID')
  const candidate=await inspectArtCandidate(bytes)
  if(candidate.sha256!==record.sha256||bytes.length!==record.bytes)throw Error('ART_SOURCE_MISMATCH')
  return {version:ART_DRAFT_VERSION,lighting:record.lighting,id:record.id,request:structuredClone(record.request),taskId:record.taskId,candidate,state:'candidate',retryable:false,nextAt:0}
 }
}
