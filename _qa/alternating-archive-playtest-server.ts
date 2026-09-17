/** Isolated local fixture: normal authority actions prepare an unread archive.
 * Only historical authorship is synthetic; no model/media calls or game-state injection. */
import {createServer} from 'vite'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OldStreetAuthority} from '../server/old-street-runtime'
import {OldStreetCampaignJobs} from '../server/old-street-campaign-jobs'
import {compilePreparedInvestigation} from '../server/old-street-investigation-draft'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetCampaignOperation} from '../server/old-street-http'
import {GAME_ID} from '../src/game-id'

process.env.OLDSTREET_MODEL_TEST_BUDGET='0'
const raw=new DatabaseSync(':memory:')
const db:AuthorityStorage={all:(sql,...args)=>raw.prepare(sql).all(...args) as any,run:(sql,...args)=>{raw.prepare(sql).run(...args)},transaction:fn=>{raw.exec('BEGIN IMMEDIATE');try{const result=fn();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}
const owner='synthetic-alternating-archive',prefix=`/${GAME_ID}/api/oldstreet-dev`,port=Number(process.env.ARCHIVE_SWITCH_QA_PORT??55674)
const trace={title:'Footbridge records',clue:{mark:'two notches',wrapping:'linen cord'},records:[{label:'The footbridge reopened',mark:'two notches',wrapping:'linen cord'},{label:'Roof repairs ended',mark:'two notches',wrapping:'folded flap'},{label:'The workshop reopened',mark:'one notch',wrapping:'linen cord'}]}
const prepared=compilePreparedInvestigation({title:'Footbridge repairs',recordAt:'end',events:['Damaged boards were surveyed','Replacement boards were cut','New boards were fitted','The footbridge reopened'],roomPlan:{indexSide:'left',storageShelves:1,rack:'switch-right'}},trace.records[0],'en',17)
let jobs:OldStreetCampaignJobs
const authority=new OldStreetAuthority(db,()=>true,undefined,undefined,undefined,undefined,undefined,undefined,(h,stage)=>jobs.candidateFor(h,stage))
jobs=new OldStreetCampaignJobs(db,(o,id)=>authority.get(o,id),async context=>context.stage==='trace'?trace:context.stage==='field'?{title:'Spare boards',target:'drawer',finding:'Sound boards were set aside for future patching instead of resurfacing the entire footbridge.'}:prepared)
async function enroll(enrollment:string){
 let h=authority.create(owner,enrollment,'en',{campaign:'letter-trail-v2'})
 if(h.version>0)return h
 const act=async(target:string,body:Record<string,unknown>)=>{const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.id===target)!;h=(await authority.action(owner,h.id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:entity.approach,target,...body})).head}
 const walk=async(route:string[])=>{for(const step of route){const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId;const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;await act(entity.id,{type:'action',action})}}
 const prepare=async(stage:'trace'|'parcel'|'archive')=>{jobs.enqueue(owner,h.id,stage);await jobs.run(owner,h.id,stage)}
 await walk(['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','oldstreet:take-letter'])
 await prepare('trace');await act('record-book',{type:'campaign-read',stage:'trace'});await act('record-book',{type:'campaign-decide',stage:'trace',selection:0})
 await walk(['yard','laundry','oldstreet:borrow-trolley','yard','oldstreet:clear-crates','cellar'])
 await prepare('parcel');await act('photo-folder',{type:'campaign-read',stage:'parcel'});await act('photo-folder',{type:'campaign-decide',stage:'parcel',selection:'leave'})
 await act('photo-folder',{type:'campaign-plan',stage:'archive'});await walk(['archive'])
 console.log(JSON.stringify({setup:'normal authority actions',scene:h.sceneId,version:h.version,examined:h.campaign?.archive?.examined,room:h.campaign?.archive?.content.room}))
 return h
}
const server=await createServer({mode:'oldstreet-dev',server:{host:'127.0.0.1',port,strictPort:true},plugins:[{
 name:'synthetic-alternating-archive',enforce:'pre',configureServer(server){server.middlewares.use((req,res,next)=>{
  const url=new URL(req.url??'/',`http://127.0.0.1:${port}`)
  if(!url.pathname.startsWith(prefix+'/'))return next()
  const send=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
  void(async()=>{
   if(req.headers.origin&&req.headers.origin!==url.origin)return send(403,{error:'LOOPBACK_ONLY'})
   const route=url.pathname.slice(prefix.length);let data='';for await(const chunk of req){data+=chunk;if(data.length>16000)return send(413,{error:'BODY_TOO_LARGE'})}const body=data?JSON.parse(data):undefined
   if(route==='/sessions')return send(200,req.method==='POST'?await enroll(body.enrollment_id):{sessions:authority.directory(owner)})
   const match=/^\/sessions\/([a-zA-Z0-9-]+)(?:\/(actions|position|expansion-capabilities|campaign-trace|campaign-parcel|campaign-archive|campaign-field))?$/.exec(route)
   if(!match)return send(404,{error:'NOT_FOUND'})
   const [,id,operation]=match
   if(operation==='expansion-capabilities')return send(200,{planning:false,media:false,campaign:true})
   if(operation?.startsWith('campaign-'))return send(200,oldStreetCampaignOperation(req.method!,owner,id,operation.slice(9) as 'trace'|'parcel'|'archive'|'field',jobs,body,p=>void p.catch(()=>{})))
   if(operation==='actions'&&req.method==='POST')return send(200,await authority.action(owner,id,body))
   if(operation==='position'&&req.method==='POST')return send(200,authority.checkpoint(owner,id,body))
   if(!operation&&req.method==='GET')return send(200,authority.get(owner,id))
   send(405,{error:'METHOD_NOT_ALLOWED'})
  })().catch(error=>send(error.status??400,{error:error.message}))
 })}
}]})
await server.listen();console.log(`Synthetic alternating archive: http://127.0.0.1:${port}/`)
for(const signal of ['SIGINT','SIGTERM'] as const)process.once(signal,()=>void server.close().then(()=>{raw.close();process.exit(0)}))
