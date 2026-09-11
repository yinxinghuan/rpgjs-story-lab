import {originalPreflightModels} from './original-preflight-model'
// Loopback-only integration harness. This never provisions a cloud namespace.
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import type {OriginalPresentationGate} from './original-train-runtime'
import {PreflightStorage} from './preflight-storage'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {CarriageJourneyAuthority,createHandler} from '../worker/source'
import {GAME_ID} from '../src/game-id'
import {completePreflightJourney} from './preflight-complete'
export function preflightPlugin(){
 const originalModels=originalPreflightModels(process.env.CARRIAGE_QA_ORIGINAL_MODEL_BUDGET,undefined,Number(process.env.CARRIAGE_QA_ORIGINAL_MODEL_USED??0))
 // Explicit loopback-only fault injection, absent from cloud/Pages plugins.
 const failAsset=process.env.CARRIAGE_QA_ASSET_FAIL_ONCE
 const completeFixture=process.env.CARRIAGE_QA_COMPLETED_JOURNEY==='1',completed=new Map<string,Promise<unknown>>()
 let assetFailed=false
 let mismatchOnce=process.env.CARRIAGE_QA_RUNTIME_MISMATCH_ONCE==='1'
 const delayedAsset=process.env.CARRIAGE_QA_ASSET_DELAY_PATH
 const delayEngineMap=process.env.CARRIAGE_QA_DELAY_ENGINE_MAP==='1'
 const delayMs=Math.min(35000,Math.max(0,Number(process.env.CARRIAGE_QA_ASSET_DELAY_MS)||0));let assetDelayed=false
 const storage=new PreflightStorage(process.env.CARRIAGE_QA_DATABASE_DIR),objects=new Map<string,CarriageJourneyAuthority>()
 // Explicit loopback authoring gate: the UI marks all non-admitted art as draft.
 const authoringRooms=new Set(originalTrainChapterSpatialPlan().scenes.map(s=>s.id))
 const admitOriginal:OriginalPresentationGate=head=>{if(!authoringRooms.has(head.sceneId))throw Error('UNREGISTERED_AUTHORING_ROOM');return true}
 const environment={CARRIAGE_JOURNEYS:{idFromName:(owner:string)=>owner,get:(id:unknown)=>{
  const owner=String(id);let object=objects.get(owner)
  if(!object){object=new CarriageJourneyAuthority(storage.context(owner),undefined,undefined,undefined,admitOriginal,originalModels?.interpreter,originalModels?.dialogue);objects.set(owner,object)}
  const authority=object
  return {fetch:async(request:Request)=>{
   const response=await authority.fetch(request)
   if(!completeFixture||request.method!=='POST'||new URL(request.url).pathname!=='/api/lab/sessions'||!response.ok)return response
   const head=await response.json() as any
   let work=completed.get(head.id)
   if(!work){work=completePreflightJourney(authority,owner,head);completed.set(head.id,work)}
   return Response.json(await work,{headers:response.headers})
  }}
 }}}
 const handler=createHandler(true,true,true,()=>originalModels?.available()??false,()=>originalModels?.available()??false,true),prefix='/'+GAME_ID
 const middleware=(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
  const url=new URL(req.url??'/', 'http://'+(req.headers.host??'localhost'))
  if(delayMs&&!assetDelayed&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.pathname===delayedAsset&&(delayEngineMap?!url.searchParams.has('scene_asset'):url.searchParams.has('scene_asset'))){assetDelayed=true;setTimeout(next,delayMs);return}
  if(failAsset&&!assetFailed&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.pathname===failAsset&&url.searchParams.has('scene_asset')){assetFailed=true;res.writeHead(503,{'Cache-Control':'no-store'});res.end('Synthetic scene resource failure');return}
  if(!url.pathname.startsWith(prefix+'/api/lab')&&!url.pathname.startsWith(prefix+'/api/original')&&!url.pathname.startsWith(prefix+'/api/creator'))return next()
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)){res.writeHead(403);res.end();return}
  if(mismatchOnce&&url.pathname===prefix+'/api/lab/health'){mismatchOnce=false;res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,runtimeContract:'synthetic-previous-runtime'}));return}
  void(async()=>{try{
   let size=0;const chunks:Buffer[]=[];for await(const chunk of req){size+=chunk.length;if(size>6000){res.writeHead(413);res.end();return}chunks.push(Buffer.from(chunk))}
   url.pathname=url.pathname.slice(prefix.length)
   const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
   let response=await handler(new Request(url,{method:req.method,headers,body:req.method==='GET'||req.method==='HEAD'?undefined:Buffer.concat(chunks)}),environment)
   if(originalModels&&url.pathname==='/api/original/health'&&response.ok){const health=await response.json();response=Response.json({...health as object,modelTrial:originalModels.usage()},{headers:response.headers})}
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))
  }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'PREFLIGHT_UNAVAILABLE'}))}})()
 }
 return {name:'carriage-cloud-loopback-preflight',configureServer(server:any){server.middlewares.use(middleware);server.httpServer?.once('close',()=>storage.close())},configurePreviewServer(server:any){server.middlewares.use(middleware);server.httpServer?.once('close',()=>storage.close())}}
}
