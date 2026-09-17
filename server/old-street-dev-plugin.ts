import {OldStreetCampaignJobs} from './old-street-campaign-jobs'
import {createOldStreetCampaignPlanner,type OldStreetCampaignGenerator} from './old-street-campaign-planner'
import {createOldStreetAttemptGenerator} from './old-street-attempt'
import {chatModel} from './model'
import {createOriginalActionInterpreter} from './original-action-interpreter'
import {createOldStreetDialogueGenerator} from './old-street-dialogue'
import {OldStreetExpansionJobs} from './old-street-expansion-jobs'
import {createOldStreetExpansionPlanner} from './old-street-expansion-planner'
import {oldStreetExpansionOperation,oldStreetExpansionPhotoOperation,oldStreetCampaignOperation} from './old-street-http'
import {OldStreetExpansionMedia,expansionPhotoProducer,type ExpansionPhotoProducer} from './old-street-expansion-media'
import {originalPreflightModels} from './original-preflight-model'
import {DatabaseSync} from 'node:sqlite'
import {mkdirSync} from 'node:fs'
import {resolve} from 'node:path'
import {randomUUID} from 'node:crypto'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {OldStreetAuthority} from './old-street-runtime'
import type {AuthorityStorage} from './session-authority'
import {GAME_ID} from '../src/game-id'
/** Loopback authoring adapter only. Not platform identity or a production route. */
export function oldStreetDevPlugin(offlineCampaign?:OldStreetCampaignGenerator,qaExpansion?:{plan:ReturnType<typeof createOldStreetExpansionPlanner>;photo:ExpansionPhotoProducer}){
 // Only a local QA launcher can inject this dependency. No query/body flag can
 // select a fixture. Narrative fixtures never fall through to remote generation;
 // an explicit QA media producer may independently exercise the platform service.
 const models=offlineCampaign?undefined:originalPreflightModels(process.env.OLDSTREET_MODEL_TEST_BUDGET,undefined,Number(process.env.OLDSTREET_MODEL_TEST_USED??0)) ?? (process.env.OLDSTREET_MODEL_TEST_BUDGET==='0'?undefined:{request:chatModel,interpreter:createOriginalActionInterpreter(chatModel)})
 let raw:DatabaseSync|undefined,service:OldStreetAuthority|undefined
 let expansions:OldStreetExpansionJobs|undefined
 let expansionMedia:OldStreetExpansionMedia|undefined
 let campaignJobs:OldStreetCampaignJobs|undefined
 const campaignEnabled=!!offlineCampaign||process.env.OLDSTREET_CAMPAIGN_TRIAL==='1'&&!!models
 const prefix='/'+GAME_ID+'/api/oldstreet-dev'
 function authority(){
  if(service)return service
  const directory=resolve(process.env.OLDSTREET_DEV_DATA??'.data/oldstreet-dev');mkdirSync(directory,{recursive:true,mode:0o700})
  raw=new DatabaseSync(resolve(directory,'journeys.sqlite'))
  const db=raw
  db.exec('PRAGMA busy_timeout=5000')
  const storage:AuthorityStorage={all:(sql,...b)=>db.prepare(sql).all(...b) as any,run:(sql,...b)=>{db.prepare(sql).run(...b)},transaction:work=>{db.exec('BEGIN IMMEDIATE');try{const result=work();db.exec('COMMIT');return result}catch(e){db.exec('ROLLBACK');throw e}}}
  service=new OldStreetAuthority(storage,()=>true,models?.interpreter,models?createOldStreetDialogueGenerator(models.request):undefined,h=>expansions?.candidateFor(h),h=>expansionMedia?.candidateFor(h),models?createOldStreetAttemptGenerator(models.request):undefined,undefined,campaignEnabled?(h,stage)=>campaignJobs?.candidateFor(h,stage):undefined)
  if(campaignEnabled)campaignJobs=new OldStreetCampaignJobs(storage,(owner,id)=>service!.get(owner,id),offlineCampaign??createOldStreetCampaignPlanner(models!.request))
  if(models||qaExpansion)expansions=new OldStreetExpansionJobs(storage,(owner,id)=>service!.get(owner,id),qaExpansion?.plan??createOldStreetExpansionPlanner(models!.request))
  if(models||qaExpansion)expansionMedia=new OldStreetExpansionMedia(storage,(owner,id)=>service!.get(owner,id),h=>expansions?.candidateFor(h))
  return service
 }
 async function handle(req:IncomingMessage,res:ServerResponse,next:()=>void){
  const url=new URL(req.url??'/', 'http://'+(req.headers.host??'localhost'))
  if(!url.pathname.startsWith(prefix+'/'))return next()
  const send=(status:number,value:unknown)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(value))}
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||req.headers.origin&&req.headers.origin!==url.origin)return send(403,{error:'LOOPBACK_ONLY'})
  try{
   const route=url.pathname.slice(prefix.length)
   if(!['GET','POST'].includes(req.method??''))return send(405,{error:'METHOD_NOT_ALLOWED'})
   let body:any
   if(req.method==='POST'){
    if(!req.headers['content-type']?.startsWith('application/json'))return send(415,{error:'JSON_REQUIRED'})
    let text='';for await(const chunk of req){text+=chunk;if(text.length>16000)return send(413,{error:'BODY_TOO_LARGE'})}body=JSON.parse(text)
   }
   let owner=req.headers.cookie?.split(';').map(s=>s.trim()).find(s=>s.startsWith('oldstreet_dev_owner='))?.split('=')[1]
   if(!owner||!/^[a-f0-9-]{36}$/.test(owner)){
    if(req.method!=='POST'||route!=='/sessions')return send(401,{error:'LOCAL_IDENTITY_MISSING'})
    owner=randomUUID();res.setHeader('Set-Cookie',`oldstreet_dev_owner=${owner}; HttpOnly; SameSite=Strict; Path=${prefix}; Max-Age=2592000`)
   }
   const s=authority()
   if(route==='/sessions'&&req.method==='GET')return send(200,{sessions:s.directory(owner)})
   if(route==='/sessions'&&req.method==='POST'){
    if(!['zh','en'].includes(body?.locale))return send(400,{error:'INVALID_LOCALE'})
    return send(200,s.create(owner,body.enrollment_id,body.locale,body.options))
   }
   const match=/^\/sessions\/([a-zA-Z0-9-]{16,80})(?:\/(actions|position|expansion|expansion-photo|expansion-photo-file|expansion-capabilities|campaign-trace|campaign-parcel|campaign-archive))?$/.exec(route)
   if(!match)return send(404,{error:'NOT_FOUND'})
   const [,id,operation]=match
   if(operation==='expansion-capabilities'&&req.method==='GET'){s.get(owner,id);return send(200,{planning:!!expansions,media:!!expansionMedia,campaign:!!campaignJobs})}
   if(operation==='campaign-trace'||operation==='campaign-parcel'||operation==='campaign-archive'){
    return send(200,oldStreetCampaignOperation(req.method!,owner,id,operation==='campaign-trace'?'trace':operation==='campaign-parcel'?'parcel':'archive',campaignJobs,body,p=>{void p.catch(()=>{})}))
   }
   if(operation==='expansion-photo')return send(200,oldStreetExpansionPhotoOperation(req.method!,owner,id,expansionMedia,qaExpansion?.photo??expansionPhotoProducer(),body,p=>{void p.catch(()=>{})}))
   if(operation==='expansion-photo-file'&&req.method==='GET'){
    if(!expansionMedia)return send(503,{error:'EXPANSION_MEDIA_NOT_READY'})
    const bytes=await expansionMedia.file(owner,id);res.writeHead(200,{'Content-Type':'image/png','Cache-Control':'private, no-store'});res.end(bytes);return
   }
   if(operation==='expansion')return send(200,oldStreetExpansionOperation(req.method!,owner,id,expansions,body,p=>{void p.catch(()=>{})}))
   if(req.method==='GET'&&!operation)return send(200,s.get(owner,id))
   if(req.method==='POST'&&operation==='actions')return send(200,await s.action(owner,id,body))
   if(req.method==='POST'&&operation==='position')return send(200,s.checkpoint(owner,id,body))
   return send(405,{error:'METHOD_NOT_ALLOWED'})
  }catch(e){const error=e as Error & {status?:number};send(error.status??400,{error:error.message})}
 }
 const install=(server:any)=>{server.middlewares.use((req:IncomingMessage,res:ServerResponse,next:()=>void)=>{void handle(req,res,next)});server.httpServer?.once('close',()=>{raw?.close();raw=undefined;service=undefined})}
 return {name:'oldstreet-loopback-session',configureServer:install,configurePreviewServer:install}
}
