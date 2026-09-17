/** Two synthetic continuations; no saves, identities, credentials or media requests. */
import {existsSync,readFileSync,writeFileSync} from 'node:fs'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'
import {originalPreflightModels} from '../server/original-preflight-model'
import type {CampaignContext} from '../src/old-street-campaign'
if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const out=process.argv[2];if(!out||existsSync(out))throw Error('NEW_REPORT_REQUIRED')
const sources=JSON.parse(readFileSync('doc/campaign-live-20260917/archive-photo-2.json','utf8')).runs.map((r:any)=>r.source)
const models=originalPreflightModels('4')!
const report={scope:'Two synthetic follow-up notes from already recorded archive histories. Existing game-chat only. No player data, credentials, media or deployment.',startedAt:new Date().toISOString(),usage:models.usage(),runs:[] as any[]}
const persist=()=>{report.usage=models.usage();writeFileSync(out,JSON.stringify(report,null,2)+'\n')};persist()
for(const source of sources){
 const context:CampaignContext={stage:'field',locale:'en',events:source.events,account:source.account}
 const row:any={context,requests:[]};report.runs.push(row);persist()
 const generate=createOldStreetCampaignPlanner(async(system,user,options)=>{
  const rec:any={system,input:JSON.parse(user)};row.requests.push(rec);persist()
  try{return rec.result=await models.request(system,user,options)}catch(e){rec.error=String(e);throw e}finally{persist()}
 })
 try{row.accepted=await generate(context,AbortSignal.timeout(22000))}catch(e){row.error=String(e)}finally{persist()}
 console.log(JSON.stringify({accepted:row.accepted,error:row.error,usage:report.usage}))
}
if(report.runs.some(r=>!r.accepted))process.exitCode=1
