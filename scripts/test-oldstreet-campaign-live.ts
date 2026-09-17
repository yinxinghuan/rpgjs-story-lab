/** Bounded content-quality probe. Never reads a player database or credentials.
 * Reports every upstream result, including rejected candidates. Existing output
 * is never overwritten, so resuming a terminal command cannot repeat requests. */
import {isPreparedInvestigation,readPreparedInvestigation} from '../server/old-street-investigation-draft'
import {existsSync,writeFileSync} from 'node:fs'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {originalPreflightModels} from '../server/original-preflight-model'
import {campaignRecordMatches,readTraceContent,readParcelContent,type CampaignContext} from '../src/old-street-campaign'
import {readArchiveContent,archiveOrders} from '../src/old-street-archive'
import {createOldStreetExpansionPlanner} from '../server/old-street-expansion-planner'
import {assertArchivePhotoSource,archivePhotoSuggestion,type ArchivePhotoSource} from '../src/old-street-archive-photo'

if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const output=process.argv[2]
if(!output||existsSync(output))throw Error('NEW_REPORT_PATH_REQUIRED')
const usedAtStart=Number(process.env.OLDSTREET_MODEL_TEST_USED??0)
const withPhoto=process.argv.includes('--with-photo')
// The older three-stage probe retains its shared 12-call budget. A complete
// commission gets two independent 8-call synthetic budgets (trace <=2,
// investigation including repair/review <=4, photograph plus review <=2).
if(withPhoto&&usedAtStart!==0)throw Error('NEW_FULL_CHAIN_REPORT_REQUIRED')
const budgets=withPhoto?[originalPreflightModels('8')!,originalPreflightModels('8')!]:[originalPreflightModels('12',undefined,usedAtStart)!]
const usage=()=>({used:budgets.reduce((n,b)=>n+b.usage().used,0),limit:withPhoto?16:12})
type RequestRecord={system:string;input:unknown;raw?:unknown;error?:string}
type CaseRecord={chain:number;stage:CampaignContext['stage'];context:CampaignContext;requests:RequestRecord[];raw?:unknown;accepted?:unknown;preparedArchive?:unknown;source?:string;error?:string;elapsedMs?:number;system?:string}
const report={startedAt:new Date().toISOString(),finishedAt:null as string|null,scope:`Two new English synthetic content chains${withPhoto?' through archive-linked photograph planning':''}, including semantic review and at most one correction per campaign stage. Existing game-chat endpoint only. No player database, account, credentials, media generation or deployment. Content acceptance is not a rendered gameplay or length verdict.`,limit:usage().limit,usedAtStart,usage:usage(),cases:[] as CaseRecord[],photos:[] as Array<{chain:number;source:ArchivePhotoSource;requests:RequestRecord[];plan?:unknown;error?:string}>,chains:[] as Array<{chain:number;complete:boolean;selected?:number;order?:string[];error?:string}>}
const persist=()=>{report.usage=usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
persist()
try{
 for(let chain=1;chain<=2;chain++){
  const models=budgets[withPhoto?chain-1:0]
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
   if(withPhoto){
    const source:ArchivePhotoSource={archiveId:`synthetic-commission-${chain}`,title:archive.title,events:result.order.map(id=>archive.cards.find(card=>card.id===id)!.label),account:archive.discovery}
    assertArchivePhotoSource(source)
    const photo:{chain:number;source:ArchivePhotoSource;requests:RequestRecord[];plan?:unknown;error?:string}={chain,source,requests:[]};report.photos.push(photo);persist()
    try{photo.plan=await createOldStreetExpansionPlanner(async(system,user,options)=>{
     const request:RequestRecord={system,input:JSON.parse(user)};photo.requests.push(request);persist()
     try{request.raw=await models.request(system,user,options);return request.raw}
     catch(error){request.error=error instanceof Error?error.message:String(error);throw error}finally{persist()}
    })({version:1,id:`synthetic-photo-${chain}`,template:'photo-darkroom-v1',sourceScene:'photo',input:archivePhotoSuggestion('en'),status:'requested',requestedAtVersion:40,archiveSource:source},'en',AbortSignal.timeout(22000))}
    catch(error){photo.error=error instanceof Error?error.message:String(error);throw error}finally{persist()}
   }
   result.complete=true
  }catch(error){result.error=error instanceof Error?error.message:String(error)}
  persist()
 }
 if(report.chains.some(chain=>!chain.complete))process.exitCode=1
}finally{report.finishedAt=new Date().toISOString();persist()}
