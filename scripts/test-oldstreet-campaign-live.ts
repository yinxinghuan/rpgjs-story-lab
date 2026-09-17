/** Bounded content-quality probe. Never reads a player database or credentials.
 * Reports every upstream result, including rejected candidates. Existing output
 * is never overwritten, so resuming a terminal command cannot repeat requests. */
import {isPreparedInvestigation,readPreparedInvestigation} from '../server/old-street-investigation-draft'
import {existsSync,writeFileSync} from 'node:fs'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {originalPreflightModels} from '../server/original-preflight-model'
import {campaignRecordMatches,readTraceContent,readParcelContent,type CampaignContext} from '../src/old-street-campaign'
import {readArchiveContent,archiveOrders} from '../src/old-street-archive'

if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const output=process.argv[2]
if(!output||existsSync(output))throw Error('NEW_REPORT_PATH_REQUIRED')
const usedAtStart=Number(process.env.OLDSTREET_MODEL_TEST_USED??0)
const models=originalPreflightModels('12',undefined,usedAtStart)!
type RequestRecord={system:string;input:unknown;raw?:unknown;error?:string}
type CaseRecord={chain:number;stage:CampaignContext['stage'];context:CampaignContext;requests:RequestRecord[];raw?:unknown;accepted?:unknown;preparedArchive?:unknown;source?:string;error?:string;elapsedMs?:number;system?:string}
const report={startedAt:new Date().toISOString(),finishedAt:null as string|null,scope:'Two new English synthetic content chains, including semantic review and at most one correction per stage. Existing game-chat endpoint only. No player database, account, credentials, media generation or deployment.',limit:12,usedAtStart,usage:models.usage(),cases:[] as CaseRecord[],chains:[] as Array<{chain:number;complete:boolean;selected?:number;order?:string[];error?:string}>}
const persist=()=>{report.usage=models.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
persist()
try{
 for(let chain=1;chain<=2;chain++){
  const result:{chain:number;complete:boolean;selected?:number;order?:string[];error?:string}={chain,complete:false};report.chains.push(result)
  let preparedArchive:unknown
  const generate=async(context:CampaignContext)=>{
   const record:CaseRecord={chain,stage:context.stage,context,requests:[]}
   report.cases.push(record);persist();const started=Date.now()
   const planner=createOldStreetCampaignPlanner(async(system,user,options)=>{
    const request:RequestRecord={system,input:JSON.parse(user)};record.requests.push(request);persist()
    try{const raw=await models.request(system,user,options);request.raw=raw;if('stage' in (request.input as Record<string,unknown>)){record.system=system;record.raw=raw}return raw}
    catch(error){request.error=error instanceof Error?error.message:String(error);throw error}finally{persist()}
   })
   try{
    if(context.stage==='archive'&&preparedArchive){record.accepted=preparedArchive;record.source='prepared-with-parcel'}
    else {
     const result=await planner(context,AbortSignal.timeout(22000))
     if(isPreparedInvestigation(result)){const bundle=readPreparedInvestigation(result);record.accepted=bundle.parcel;record.preparedArchive=preparedArchive=bundle.archive}
     else record.accepted=result
    }
    return record.accepted
   }
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
