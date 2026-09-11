import type {OriginalTrainAuthority} from './original-train-runtime'
import {LabError} from '../src/journey-runtime'
import {ORIGINAL_API_PATH,ORIGINAL_RUNTIME_HEADER,ORIGINAL_RUNTIME_CONTRACT} from '../src/original-runtime-contract'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
export const originalJson=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[ORIGINAL_RUNTIME_HEADER]:ORIGINAL_RUNTIME_CONTRACT}})
/** Runs behind the existing capability boundary, in an original-only object. */
export async function handleOriginalSession(request:Request,owner:string,authority:OriginalTrainAuthority,readBody:(request:Request)=>Promise<any>){
 try{
  if(request.headers.get(ORIGINAL_RUNTIME_HEADER)!==ORIGINAL_RUNTIME_CONTRACT)throw new LabError('RUNTIME_VERSION_MISMATCH',409)
  const url=new URL(request.url),path=url.pathname.slice(ORIGINAL_API_PATH.length)
  if(path==='/sessions'&&request.method==='GET')return originalJson({sessions:authority.directory(owner)})
  if(path==='/sessions'&&request.method==='POST'){
   const b=await readBody(request)
   if(Object.keys(b).some(k=>!['enrollment_id','locale'].includes(k))||!['zh','en'].includes(b.locale))throw new LabError('INVALID_ENROLLMENT')
   return originalJson(authority.create(owner,b.enrollment_id,b.locale))
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
