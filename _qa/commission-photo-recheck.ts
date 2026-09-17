/** Recheck retained synthetic continuity failures, then regenerate photographs
 * against those SAME archive histories. No media, saves, or account access. */
import {existsSync,readFileSync,writeFileSync} from 'node:fs'
import {createOldStreetExpansionPlanner,reviewArchivePhotograph} from '../server/old-street-expansion-planner'
import {originalPreflightModels} from '../server/original-preflight-model'
import {archivePhotoSuggestion,type ArchivePhotoSource} from '../src/old-street-archive-photo'
if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const [input,output]=process.argv.slice(2)
if(!input||!output||existsSync(output))throw Error('INPUT_AND_NEW_REPORT_REQUIRED')
const original=JSON.parse(readFileSync(input,'utf8'))
if(original.photos?.length!==2)throw Error('EXPECTED_TWO_SYNTHETIC_PHOTO_CASES')
const failedDrafts=process.argv.includes('--review-failed-drafts')
const models=originalPreflightModels('10')!
const report={source:input,scope:'Two retained synthetic archive histories: recheck prior proposals without presuming a pass, then generate and review one new proposal per source. At most ten requests including bounded review-format correction. No media generation or player data.',startedAt:new Date().toISOString(),finishedAt:null as string|null,usage:models.usage(),cases:[] as Array<{chain:number;source:ArchivePhotoSource;rejectedOriginal?:boolean;originalError?:string;plan?:unknown;error?:string;requests:any[]}>}
const persist=()=>{report.usage=models.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
persist()
try{
 for(const previous of original.photos){
  const record:typeof report.cases[number]={chain:previous.chain,source:previous.source,requests:[]};report.cases.push(record)
  let phase='reject-original'
  const request:typeof models.request=async(system,user,options)=>{
   const log:any={phase,system,input:JSON.parse(user)};record.requests.push(log);persist()
   try{log.raw=await models.request(system,user,options);return log.raw}
   catch(error){log.error=String(error);throw error}finally{persist()}
  }
  const previousContent=previous.plan?.content??(failedDrafts?previous.requests?.find((r:any)=>r.input?.intention)?.raw:undefined)
  if(!previousContent)throw Error('PRIOR_PHOTO_PROPOSAL_REQUIRED')
  try{await reviewArchivePhotograph(request,record.source,previousContent,AbortSignal.timeout(22000));record.rejectedOriginal=false}
  catch(error){record.originalError=String(error);record.rejectedOriginal=error instanceof Error&&error.message==='ARCHIVE_PHOTO_REVIEW_REJECTED'}
  phase='regenerate-same-source'
  try{record.plan=await createOldStreetExpansionPlanner(request)({version:1,id:`synthetic-recheck-${record.chain}`,template:'photo-darkroom-v1',sourceScene:'photo',input:archivePhotoSuggestion('en'),status:'requested',requestedAtVersion:40,archiveSource:record.source},'en',AbortSignal.timeout(22000))}
  catch(error){record.error=String(error)}
  persist();console.log(JSON.stringify({chain:record.chain,rejectedOriginal:record.rejectedOriginal,newPlan:!!record.plan,error:record.error,usage:models.usage()}))
 }
 if(report.cases.some(c=>(!failedDrafts&&!c.rejectedOriginal)||!c.plan))process.exitCode=1
}finally{report.finishedAt=new Date().toISOString();persist()}
