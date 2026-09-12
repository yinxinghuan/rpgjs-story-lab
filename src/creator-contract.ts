import {ART_REFERENCE,type ArtDraft} from './art-draft'
export const CREATOR_API_PATH='/api/creator'
export const CREATOR_RUNTIME_HEADER='X-Creator-Runtime'
// Transport evolves independently of immutable stored background records.
export const CREATOR_RUNTIME_CONTRACT='creator-runtime-2'
export const CREATOR_BACKGROUND_RECORD_VERSION='creator-background-1'
export const CREATOR_DRAFT_LIMIT=6
export type CloudArtInput={id:string;taskId:string;sha256:string;lighting:'cool'|'warm';request:ArtDraft['request']}
export type CloudArtRecord=CloudArtInput & {version:typeof CREATOR_BACKGROUND_RECORD_VERSION;bytes:number;width:1024;height:1536;createdAt:number}
export function assertCloudArtInput(value:any):asserts value is CloudArtInput{
 if(!value||typeof value!=='object'||Object.keys(value).sort().join(',')!=='id,lighting,request,sha256,taskId'||!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value.id)||!/^mt_[a-f0-9]{32}$/.test(value.taskId)||!/^[a-f0-9]{64}$/.test(value.sha256)||!['cool','warm'].includes(value.lighting))throw Error('INVALID_ART_DRAFT')
 const r=value.request
 if(!r||Object.keys(r).sort().join(',')!=='mode,prompt,referenceUrls,requestId,sessionId,size'||r.requestId!==value.id||!/^[a-f0-9-]{36}$/.test(r.sessionId)||r.mode!=='edit'||typeof r.prompt!=='string'||!r.prompt.trim()||r.prompt.length>2400||!Array.isArray(r.referenceUrls)||r.referenceUrls.length!==1||r.referenceUrls[0]!==ART_REFERENCE||r.size?.width!==1024||r.size?.height!==1536||Object.keys(r.size).sort().join(',')!=='height,width')throw Error('INVALID_ART_DRAFT')
}
export function assertCloudArtRecord(value:any):asserts value is CloudArtRecord{
 if(!value)throw Error('INVALID_ART_RECORD')
 assertCloudArtInput({id:value.id,taskId:value.taskId,sha256:value.sha256,lighting:value.lighting,request:value.request})
 if(value.version!==CREATOR_BACKGROUND_RECORD_VERSION||value.width!==1024||value.height!==1536||!Number.isSafeInteger(value.bytes)||value.bytes<45||value.bytes>8*1024*1024||!Number.isSafeInteger(value.createdAt)||value.createdAt<0)throw Error('INVALID_ART_RECORD')
}
