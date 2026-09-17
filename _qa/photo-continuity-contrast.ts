/** Swap two retained synthetic proposals to test topic mismatch rejection.
 * No media generation, player database, or live save is read or changed. */
import {existsSync,readFileSync,writeFileSync} from 'node:fs'
import {reviewArchivePhotograph} from '../server/old-street-expansion-planner'
import {originalPreflightModels} from '../server/original-preflight-model'
if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const [input,output]=process.argv.slice(2)
if(!input||!output||existsSync(output))throw Error('INPUT_AND_NEW_REPORT_REQUIRED')
const samples=JSON.parse(readFileSync(input,'utf8')).cases
if(samples.length!==2||samples.some((sample:any)=>!sample.plan))throw Error('TWO_PLANS_REQUIRED')
const matched=process.argv.includes('--matched')
const model=originalPreflightModels('4')!
const report={source:input,scope:matched?'Two correctly paired retained synthetic photograph descriptions; at most four reviews. No media, saves or account data.':'Two cross-paired retained synthetic photograph descriptions; at most four review calls. No media, saves or account data.',startedAt:new Date().toISOString(),finishedAt:null as string|null,usage:model.usage(),cases:[] as any[]}
const persist=()=>{report.usage=model.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
persist()
try{
 for(let i=0;i<2;i++){
  const row={source:samples[i].source,candidate:samples[matched?i:1-i].plan.content,rejected:false,error:undefined as string|undefined,requests:[] as any[]};report.cases.push(row)
  try{await reviewArchivePhotograph(async(system,input,options)=>{const request:any={system,input:JSON.parse(input)};row.requests.push(request);persist();try{request.raw=await model.request(system,input,options);return request.raw}finally{persist()}},row.source,row.candidate,AbortSignal.timeout(22000))}
  catch(error){row.error=String(error);row.rejected=error instanceof Error&&error.message==='ARCHIVE_PHOTO_REVIEW_REJECTED'}
  persist()
 }
 if(report.cases.some(row=>matched?row.rejected||row.error:!row.rejected))process.exitCode=1
}finally{report.finishedAt=new Date().toISOString();persist();console.log(JSON.stringify({rejected:report.cases.map(row=>row.rejected),usage:report.usage}))}
