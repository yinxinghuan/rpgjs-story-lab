/** Explicit synthetic-only provider probe: two stories, at most four calls, no media. */
import {writeFile,mkdir} from 'node:fs/promises'
import {chatModel} from '../server/model'
import {createOldStreetExpansionPlanner} from '../server/old-street-expansion-planner'
import type {ArchivePhotoSource} from '../src/old-street-archive-photo'
if(!process.argv.includes('--run'))throw Error('Use --run for the authorized synthetic provider probe')
const output=process.argv.find(a=>a.endsWith('.json'))
if(!output)throw Error('Provide a new report path')
const sources:ArchivePhotoSource[]=[
 {archiveId:'synthetic-bridge-0001',title:'The footbridge repairs',events:['The worn boards were measured','Replacement boards were cut','Three new boards were fitted','The footbridge reopened'],account:'The footbridge reopened after the three replacement boards were fitted.'},
 {archiveId:'synthetic-lamps-0001',title:'Street lamp replacement',events:['Residents reported broken lamps','The replacement was approved','New lamp fixtures were installed','The street lamps worked again'],account:'The broken lamp fixtures were replaced before the lamps worked again.'},
]
const report:{scope:string;calls:number;runs:any[]}={scope:'Synthetic archive-to-photograph plan and semantic review; no media, accounts, or player saves',calls:0,runs:[]}
await mkdir(output.slice(0,output.lastIndexOf('/')),{recursive:true})
for(const source of sources){
 const run:any={source,requests:[]};report.runs.push(run)
 try{run.plan=await createOldStreetExpansionPlanner(async(system,user,options)=>{
  if(++report.calls>4)throw Error('PROBE_LIMIT')
  const trace:any={system,user:JSON.parse(user)};run.requests.push(trace)
  try{trace.response=await chatModel(system,user,options);return trace.response}catch(e){trace.error=String(e);throw e}
 })({version:1,id:source.archiveId,template:'photo-darkroom-v1',sourceScene:'photo',input:'Look for a photograph related to the street history I reconstructed',status:'requested',requestedAtVersion:40,archiveSource:source},'en',AbortSignal.timeout(22000));run.accepted=true}catch(e){run.accepted=false;run.error=String(e)}
 await writeFile(output,JSON.stringify(report,null,2))
}
console.log(JSON.stringify({calls:report.calls,results:report.runs.map(r=>({subject:r.source.title,accepted:r.accepted,discovery:r.plan?.content.discovery,error:r.error}))}))
