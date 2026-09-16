/** One bounded, source-preserving animation experiment through the public media API.
 * No output from this script is automatically admitted as a game sprite. */
import {readFileSync,writeFileSync,existsSync,renameSync} from 'node:fs'
import {dirname,join,resolve} from 'node:path'
import {createHash} from 'node:crypto'
import {submitVideoMedia,waitForMediaTask,MediaServiceError,type MediaTask} from '../src/vendor/media/client'
import {GAME_ID} from '../src/game-id'
const requestFile=resolve(process.argv[2]??'')
if(!process.argv[2])throw Error('Pass a frozen video request.json; use --resume for the same task')
const request=JSON.parse(readFileSync(requestFile,'utf8'))
if(request.sessionId!==GAME_ID||!/^[-a-f0-9]{36}$/.test(request.requestId)||request.ratio!=='9:16'||request.durationSeconds!==5)throw Error('INVALID_GAIT_PROBE')
const hash=(b:Uint8Array|string)=>createHash('sha256').update(b).digest('hex')
const folder=dirname(requestFile),stateFile=join(folder,'state.json'),assetFile=join(folder,'candidate.mp4'),requestSha256=hash(JSON.stringify(request))
let state:any=existsSync(stateFile)?JSON.parse(readFileSync(stateFile,'utf8')):null
if(state&&!process.argv.includes('--resume'))throw Error('EXISTING_TASK_REQUIRES_RESUME')
if(state&&state.requestSha256!==requestSha256)throw Error('REQUEST_CHANGED')
if(state?.asset){if(hash(readFileSync(assetFile))!==state.asset.sha256)throw Error('ASSET_CHANGED');console.log('Already downloaded');process.exit(0)}
if(state?.status==='failed'&&state.retryable===false)throw Error('TERMINAL_TASK_DO_NOT_RESUBMIT')
state??={requestSha256,requestId:request.requestId,startedAt:new Date().toISOString(),status:'prepared',admission:'not-reviewed'}
const persist=()=>{writeFileSync(stateFile+'.tmp',JSON.stringify(state,null,2)+'\n');renameSync(stateFile+'.tmp',stateFile)}
const signal=AbortSignal.timeout(600000),started=Date.now()
function record(task:MediaTask){
 if(task.request_id!==request.requestId||task.type!=='video')throw Error('TASK_IDENTITY_MISMATCH')
 const changed=state.status!==task.status;state.task=task;state.status=task.status;persist()
 if(changed)console.log(JSON.stringify({taskId:task.task_id,status:task.status}))
}
persist()
const options={signal,pollIntervalMs:8000,timeoutMs:540000,fetchImpl:async(input:RequestInfo|URL,init?:RequestInit)=>{
 const response=await fetch(input,init);if(response.ok)record(await response.clone().json() as MediaTask);return response
}}
try{
 const task=await waitForMediaTask(state.task?state.task.task_id:await submitVideoMedia(request,options),options)
 record(task)
 if(task.media?.type!=='video')throw Error('INVALID_VIDEO')
 const url=new URL(task.media.url)
 if(url.protocol!=='https:'||url.username||url.password||url.port||!['cdn.aiwaves.tech','images.aiwaves.tech','game.aiwaves.tech'].includes(url.hostname))throw Error('UNAPPROVED_MEDIA_HOST')
 const response=await fetch(url,{signal,redirect:'error',credentials:'omit'})
 if(!response.ok)throw Error('VIDEO_HTTP_'+response.status)
 const size=Number(response.headers.get('content-length')??0);if(size>32*1024*1024)throw Error('VIDEO_TOO_LARGE')
 const bytes=Buffer.from(await response.arrayBuffer());if(bytes.length<32||bytes.length>32*1024*1024||bytes.toString('ascii',4,8)!=='ftyp')throw Error('INVALID_MP4')
 writeFileSync(assetFile,bytes,{flag:'wx'})
 state.status='downloaded';state.asset={file:'candidate.mp4',bytes:bytes.length,sha256:hash(bytes)};state.elapsedMs=Date.now()-started;state.cost='not provided by public API';state.audioUse='none: sprite experiment only';delete state.error;persist()
 console.log(JSON.stringify({status:state.status,asset:state.asset,elapsedMs:state.elapsedMs}))
}catch(error){
 state.status='failed';state.error=error instanceof MediaServiceError?error.code:error instanceof Error?error.message:'UNKNOWN';state.retryable=error instanceof MediaServiceError?error.retryable:true;persist()
 console.log(JSON.stringify({status:state.status,error:state.error,retryable:state.retryable,taskId:state.task?.task_id??null}));process.exitCode=1
}
