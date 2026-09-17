/** Two synthetic room-only probes. No saves, credentials or media. */
import {existsSync,writeFileSync} from 'node:fs'
import {archiveRoomContract} from '../server/old-street-campaign-planner'
import {originalPreflightModels} from '../server/original-preflight-model'
import {readArchiveRoom,archiveRoomLayout} from '../src/old-street-archive-room'
if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const output=process.argv[2]
if(!output||existsSync(output))throw Error('NEW_REPORT_PATH_REQUIRED')
const model=originalPreflightModels('2')!,system='Design a small overhead archive room for an exploration game. Return only JSON {room}. '+archiveRoomContract
const report={system,startedAt:new Date().toISOString(),finishedAt:null as string|null,usage:model.usage(),cases:[] as Array<{input:string;raw?:unknown;room?:string[];error?:string}>}
const save=()=>{report.usage=model.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')};save()
try{for(const input of ['Create a room with two or three storage shelves and a route bending through its middle.','Create a different room with three or four storage shelves, the index and ledger on opposite sides, and the sorting table nearer the entrance.']){
 const row:{input:string;raw?:unknown;room?:string[];error?:string}={input};report.cases.push(row);save()
 try{row.raw=await model.request(system,input,{signal:AbortSignal.timeout(22000)});save();row.room=readArchiveRoom((row.raw as any)?.room);console.log(JSON.stringify({accepted:true,props:archiveRoomLayout(row.room).props.length}))}
 catch(e){row.error=e instanceof Error?e.message:String(e);process.exitCode=1;console.log(JSON.stringify({accepted:false,error:row.error}))}save()
}}finally{report.finishedAt=new Date().toISOString();save()}
