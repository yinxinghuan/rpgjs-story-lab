/** Bounded authoring probe through the same public client used by the game.
 * Intent is authored before this command. A rerun never invents a request ID.
 */
import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs'
import {resolve,dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {generateImageMedia,waitForMediaTask,MediaServiceError,type MediaTask} from '../src/vendor/media/client'
import {GAME_ID} from '../src/game-id'
const file=resolve(process.argv[2]??''),resume=process.argv.includes('--resume')
if(!process.argv[2])throw Error('Pass an authored request.json; --resume reuses its original request/task')
const request=JSON.parse(readFileSync(file,'utf8'))
if(request.sessionId!==GAME_ID||!/^[-a-f0-9]{36}$/.test(request.requestId)||!['text','edit'].includes(request.mode)||typeof request.prompt!=='string'||request.prompt.length>6000)throw Error('INVALID_PROBE_REQUEST')
const folder=dirname(file),stateFile=join(folder,'state.json'),assetFile=join(folder,'candidate.png')
const digest=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex')
const requestSha256=digest(JSON.stringify(request))
let state:any=existsSync(stateFile)?JSON.parse(readFileSync(stateFile,'utf8')):null
if(state&&!resume)throw Error('EXISTING_PROBE_REQUIRES_RESUME')
if(state&&state.requestSha256!==requestSha256)throw Error('PROBE_REQUEST_CHANGED')
if(state?.status==='failed'&&!state.retryable)throw Error('TERMINAL_PROBE_DO_NOT_RESUBMIT')
if(state?.asset){if(digest(readFileSync(assetFile))!==state.asset.sha256)throw Error('CANDIDATE_CHANGED');console.log(JSON.stringify({status:'already-downloaded',asset:state.asset}));process.exit(0)}
state??={version:1,requestSha256,requestId:request.requestId,status:'prepared',startedAt:new Date().toISOString(),attempts:0}
function persist(){writeFileSync(stateFile+'.tmp',JSON.stringify(state,null,2)+'\n');renameSync(stateFile+'.tmp',stateFile)}
state.attempts++;state.status='submitting';persist()
const signal=AbortSignal.timeout(180000),started=Date.now()
function recordTask(task:MediaTask){
 if(task?.request_id!==request.requestId||typeof task?.task_id!=='string')throw Error('TASK_IDENTITY_MISMATCH')
 state.task={task_id:task.task_id,request_id:task.request_id,status:task.status,type:task.type,...(task.media?{media:task.media}:{}),...(task.error?{error:task.error}:{}),...(task.timing_ms===undefined?{}:{timing_ms:task.timing_ms})};state.status=task.status;persist()
}
const options={signal,pollIntervalMs:8000,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{
 const response=await fetch(input,init)
 if(response.ok){const task=await response.clone().json() as MediaTask;recordTask(task)}
 return response
}}
try{
 const task=state.task?await waitForMediaTask(state.task.status==='succeeded'?state.task:state.task.task_id,options):await generateImageMedia(request,options)
 recordTask(task)
 const media=task.media
 if(media?.type!=='image'||media.format!=='png')throw Error('UNEXPECTED_IMAGE_FORMAT')
 const url=new URL(media.url)
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['cdn.aiwaves.tech','images.aiwaves.tech','game.aiwaves.tech'].includes(url.hostname))throw Error('UNAPPROVED_ASSET_HOST')
 const response=await fetch(url,{signal,redirect:'error',credentials:'omit'})
 if(!response.ok)throw Error('ASSET_HTTP_'+response.status)
 const bytes=Buffer.from(await response.arrayBuffer())
 if(bytes.length>8*1024*1024||bytes.length<45||bytes.toString('hex',0,8)!=='89504e470d0a1a0a')throw Error('INVALID_PNG')
 const width=bytes.readUInt32BE(16),height=bytes.readUInt32BE(20)
 if(width!==media.width||height!==media.height||width!==request.size.width||height!==request.size.height)throw Error('IMAGE_SIZE_MISMATCH')
 writeFileSync(assetFile,bytes,{flag:'wx'})
 state.asset={file:'candidate.png',sha256:digest(bytes),bytes:bytes.length,width,height,pngColorType:bytes[25]};state.status='downloaded';state.elapsedMs=Date.now()-started;state.cost='not provided by public API';state.admission='not-reviewed';delete state.error;persist()
 console.log(JSON.stringify({status:state.status,taskId:task.task_id,elapsedMs:state.elapsedMs,asset:state.asset}))
}catch(error){
 state.status='failed';state.error=error instanceof MediaServiceError?error.code:error instanceof Error?error.message:'UNKNOWN';state.retryable=error instanceof MediaServiceError?error.retryable:true;state.elapsedMs=Date.now()-started;persist()
 console.log(JSON.stringify({status:state.status,error:state.error,retryable:state.retryable,elapsedMs:state.elapsedMs,taskId:state.task?.task_id??null}));process.exitCode=1
}
