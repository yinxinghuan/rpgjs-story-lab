/** Bounded content-quality probe. Never reads a player database or credentials.
 * Reports every upstream result, including rejected candidates. Existing output
 * is never overwritten, so resuming a terminal command cannot repeat requests. */
import {existsSync,writeFileSync} from 'node:fs'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {originalPreflightModels} from '../server/original-preflight-model'
import {campaignRecordMatches,readTraceContent,readParcelContent,type CampaignContext} from '../src/old-street-campaign'
import {readArchiveContent,archiveOrders} from '../src/old-street-archive'

if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const output=process.argv[2]
if(!output||existsSync(output))throw Error('NEW_REPORT_PATH_REQUIRED')
const usedAtStart=Number(process.env.OLDSTREET_MODEL_TEST_USED??0)
const models=originalPreflightModels('6',undefined,usedAtStart)!
const report={startedAt:new Date().toISOString(),finishedAt:null as string|null,scope:'Two new English synthetic content chains. Existing game-chat endpoint only. No player database, account, credentials, media generation or deployment.',limit:6,usedAtStart,usage:models.usage(),cases:[] as Array<{chain:number;stage:CampaignContext['stage'];context:CampaignContext;raw?:unknown;accepted?:unknown;error?:string;elapsedMs?:number;system?:string}>,chains:[] as Array<{chain:number;complete:boolean;selected?:number;order?:string[];error?:string}>}
const persist=()=>{report.usage=models.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
persist()
try{
 for(let chain=1;chain<=2;chain++){
  const result:{chain:number;complete:boolean;selected?:number;order?:string[];error?:string}={chain,complete:false};report.chains.push(result)
  const generate=async(context:CampaignContext)=>{
   const record:{chain:number;stage:CampaignContext['stage'];context:CampaignContext;raw?:unknown;accepted?:unknown;error?:string;elapsedMs?:number;system?:string}={chain,stage:context.stage,context}
   report.cases.push(record);persist();const started=Date.now()
   const planner=createOldStreetCampaignPlanner(async(system,user,options)=>{record.system=system;persist();const raw=await models.request(system,user,options);record.raw=raw;persist();return raw})
   try{record.accepted=await planner(context,AbortSignal.timeout(22000));return record.accepted}
   catch(error){record.error=error instanceof Error?error.message:String(error);throw error}
   finally{record.elapsedMs=Date.now()-started;persist();console.log(JSON.stringify({chain,stage:context.stage,accepted:record.accepted!==undefined,error:record.error,elapsedMs:record.elapsedMs,usage:models.usage()}))}
  }
  try{
   const trace=readTraceContent(await generate({stage:'trace',locale:'en'}))
   const selected=trace.records.findIndex((_,i)=>campaignRecordMatches(trace,i));result.selected=selected
   const previous=trace.records[selected]
   const papers=readParcelContent(await generate({stage:'parcel',locale:'en',previous,investigation:true}))
   const archive=readArchiveContent(await generate({stage:'archive',locale:'en',previous,papers}))
   result.order=archiveOrders([...archive.sources.index,...archive.sources.ledger])[0]
   result.complete=true
  }catch(error){result.error=error instanceof Error?error.message:String(error)}
  persist()
 }
 if(report.chains.some(chain=>!chain.complete))process.exitCode=1
}finally{report.finishedAt=new Date().toISOString();persist()}
