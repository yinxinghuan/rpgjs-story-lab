import {journalArtOperation,prepareJournalArt,type JournalArtRuntime} from './old-street-journal-media'
import {prepareNextStreetContent} from './old-street-prefetch'
import {LabError} from '../src/journey-runtime'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
import {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from '../src/old-street-runtime-contract'
import type {OldStreetAuthority} from './old-street-runtime'
import type {OldStreetExpansionJobs} from './old-street-expansion-jobs'
import type {OldStreetCampaignJobs} from './old-street-campaign-jobs'
import type {OldStreetExpansionMedia,ExpansionPhotoProducer} from './old-street-expansion-media'
import type {RoomArtRuntime} from './old-street-room-media'

export function oldStreetCampaignOperation(method:string,owner:string,id:string,stage:'trace'|'parcel'|'archive'|'field',jobs:OldStreetCampaignJobs|undefined,body:unknown,background:(p:Promise<unknown>)=>void){
 if(!jobs)throw new LabError('CAMPAIGN_NOT_AVAILABLE',503)
 if(method==='GET')return {job:jobs.get(owner,id,stage)}
 if(method!=='POST')throw new LabError('METHOD_NOT_ALLOWED',405)
 const b=body as {retry?:unknown}
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>k!=='retry')||b.retry!==undefined&&typeof b.retry!=='boolean')throw new LabError('INVALID_CAMPAIGN_REQUEST')
 const job=jobs.enqueue(owner,id,stage,b.retry===true)
 if(job.state==='queued')background(jobs.run(owner,id,stage))
 return {job}
}

export function oldStreetExpansionPhotoOperation(method:string,owner:string,id:string,media:OldStreetExpansionMedia|undefined,produce:ExpansionPhotoProducer,body:unknown,background:(p:Promise<unknown>)=>void){
 if(!media)throw new LabError('EXPANSION_MEDIA_NOT_READY',503)
 if(method==='GET')return {job:media.get(owner,id)}
 if(method!=='POST')throw new LabError('METHOD_NOT_ALLOWED',405)
 const b=body as {retry?:unknown}
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>k!=='retry')||b.retry!==undefined&&typeof b.retry!=='boolean')throw new LabError('INVALID_EXPANSION_REQUEST')
 const job=media.start(owner,id,b.retry===true)
 if(job?.recoverable)background(media.run(owner,id,produce))
 return {job}
}

export function oldStreetExpansionOperation(method:string,owner:string,id:string,jobs:OldStreetExpansionJobs|undefined,body:unknown,background:(p:Promise<unknown>)=>void){
 if(!jobs)throw new LabError('EXPANSION_PLANNER_NOT_READY',503)
 if(method==='GET')return {job:jobs.get(owner,id)}
 if(method!=='POST')throw new LabError('METHOD_NOT_ALLOWED',405)
 const b=body as {retry?:unknown}
 if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>k!=='retry')||b.retry!==undefined&&typeof b.retry!=='boolean')throw new LabError('INVALID_EXPANSION_REQUEST')
 const job=jobs.enqueue(owner,id,b.retry===true)
 if(job.state==='queued')background(jobs.run(owner,id))
 return {job}
}

export const oldStreetJson=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT}})
/** Owner is supplied exclusively by the Worker's capability boundary. */
export async function handleOldStreetSession(request:Request,owner:string,authority:OldStreetAuthority,readBody:(request:Request)=>Promise<any>,expansion?:{jobs:OldStreetExpansionJobs;media:OldStreetExpansionMedia;produce:ExpansionPhotoProducer;background:(p:Promise<unknown>)=>void},campaign?:{jobs:OldStreetCampaignJobs;background:(p:Promise<unknown>)=>void},journalArt?:JournalArtRuntime,roomArt?:RoomArtRuntime){
 try{
  if(request.headers.get(OLD_STREET_RUNTIME_HEADER)!==OLD_STREET_RUNTIME_CONTRACT)throw new LabError('RUNTIME_VERSION_MISMATCH',409)
  const url=new URL(request.url),path=url.pathname.slice(OLD_STREET_API_PATH.length)
  if(path==='/sessions'){
   if(request.method==='GET')return oldStreetJson({sessions:authority.directory(owner)})
   if(request.method==='POST'){
    const b=await readBody(request)
    if(!b||Object.keys(b).some(k=>!['enrollment_id','locale','options'].includes(k))||!['zh','en'].includes(b.locale))throw new LabError('INVALID_ENROLLMENT')
    return oldStreetJson(authority.create(owner,b.enrollment_id,b.locale,b.options))
   }
   throw new LabError('METHOD_NOT_ALLOWED',405)
  }
  const m=/^\/sessions\/([a-zA-Z0-9-]{16,80})(?:\/(room-art|room-art-file|journal-art|journal-art-file|actions|position|events|expansion|expansion-photo|expansion-photo-file|expansion-capabilities|campaign-trace|campaign-parcel|campaign-archive|campaign-field))?$/.exec(path)
  if(!m)throw new LabError('NOT_FOUND',404)
  if(m[2]==='room-art'){
   if(!roomArt)throw new LabError('ROOM_ART_NOT_AVAILABLE',503)
   if(request.method==='GET')return oldStreetJson({jobs:roomArt.media.list(owner,m[1])})
   if(request.method!=='POST')throw new LabError('METHOD_NOT_ALLOWED',405)
   const b=await readBody(request)
   if(!b||typeof b!=='object'||Array.isArray(b)||Object.keys(b).some(k=>k!=='retryId')||b.retryId!==undefined&&(typeof b.retryId!=='string'||!['floor','bench'].includes(b.retryId)))throw new LabError('INVALID_ROOM_ART_REQUEST')
   const jobs=roomArt.media.sync(owner,m[1],b.retryId)
   roomArt.background(roomArt.media.run(owner,m[1],roomArt.produce))
   return oldStreetJson({jobs})
  }
  if(m[2]==='room-art-file'&&request.method==='GET'){
   if(!roomArt)throw new LabError('ROOM_ART_NOT_AVAILABLE',503)
   return new Response(new Uint8Array(await roomArt.media.file(owner,m[1],url.searchParams.get('asset')??'')),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT}})
  }
  if(m[2]==='journal-art')return oldStreetJson(journalArtOperation(request.method,owner,m[1],request.method==='POST'?await readBody(request):undefined,journalArt))
  if(m[2]==='journal-art-file'&&request.method==='GET'){
   if(!journalArt)throw new LabError('ART_NOT_AVAILABLE',503)
   return new Response(new Uint8Array(await journalArt.media.file(owner,m[1],url.searchParams.get('asset')??'')),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT}})
  }
  if(m[2]==='expansion-capabilities'&&request.method==='GET'){authority.get(owner,m[1]);return oldStreetJson({planning:!!expansion,media:!!expansion,campaign:!!campaign,roomMedia:!!roomArt})}
  if(m[2]==='campaign-trace'||m[2]==='campaign-parcel'||m[2]==='campaign-archive'||m[2]==='campaign-field')return oldStreetJson(oldStreetCampaignOperation(request.method,owner,m[1],m[2]==='campaign-trace'?'trace':m[2]==='campaign-parcel'?'parcel':m[2]==='campaign-field'?'field':'archive',campaign?.jobs,request.method==='POST'?await readBody(request):undefined,campaign?.background??(()=>{})))
  if(m[2]==='expansion-photo'){
   if(!expansion)throw new LabError('EXPANSION_MEDIA_NOT_READY',503)
   return oldStreetJson(oldStreetExpansionPhotoOperation(request.method,owner,m[1],expansion.media,expansion.produce,request.method==='POST'?await readBody(request):undefined,expansion.background))
  }
  if(m[2]==='expansion-photo-file'&&request.method==='GET'){
   if(!expansion)throw new LabError('EXPANSION_MEDIA_NOT_READY',503)
   return new Response(new Uint8Array(await expansion.media.file(owner,m[1])),{headers:{'Content-Type':'image/png','Cache-Control':'private, no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT}})
  }
  if(m[2]==='expansion')return oldStreetJson(oldStreetExpansionOperation(request.method,owner,m[1],expansion?.jobs,request.method==='POST'?await readBody(request):undefined,expansion?.background??(()=>{})))
  if(request.method==='GET'&&!m[2])return oldStreetJson(authority.get(owner,m[1]))
  if(request.method==='GET'&&m[2]==='events')return oldStreetJson({events:authority.events(owner,m[1],Number(url.searchParams.get('after')??0))})
  if(request.method==='POST'&&m[2]==='actions'){
   const result=await authority.action(owner,m[1],await readBody(request))
   prepareJournalArt(owner,m[1],journalArt)
   prepareNextStreetContent(owner,result,campaign?.jobs,campaign?.background??(()=>{}))
   return oldStreetJson(result)
  }
  if(request.method==='POST'&&m[2]==='position')return oldStreetJson(authority.checkpoint(owner,m[1],await readBody(request)))
  throw new LabError('METHOD_NOT_ALLOWED',405)
 }catch(e){return oldStreetJson({error:e instanceof LabError?e.code:'SERVICE_UNAVAILABLE'},e instanceof LabError?e.status:503)}
}
