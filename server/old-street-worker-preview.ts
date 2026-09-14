import type {IncomingMessage,ServerResponse} from 'node:http'
import {PreflightStorage} from './preflight-storage'
import {CarriageJourneyAuthority,createHandler} from '../worker/source'
import {GAME_ID} from '../src/game-id'
import {OLD_STREET_API_PATH} from '../src/old-street-runtime-contract'

/** Only installed by oldstreet-dev. Executes the real Worker boundary on local SQLite. */
export function oldStreetWorkerPreviewPlugin(){
 const storage=new PreflightStorage('.data/oldstreet-worker-preview')
 const objects=new Map<string,CarriageJourneyAuthority>()
 const env={CARRIAGE_JOURNEYS:{idFromName:(name:string)=>name,get:(key:unknown)=>({fetch:(request:Request)=>{
  const name=String(key)
  let object=objects.get(name)
  // Local art admission only. Production OLD_STREET_RELEASED and gate remain closed.
  if(!object){object=new CarriageJourneyAuthority(storage.context(name),undefined,undefined,undefined,undefined,undefined,undefined,undefined,undefined,()=>true);objects.set(name,object)}
  return object.fetch(request)
 }})}}
 const handler=createHandler(true,false,false,()=>false,()=>false,false,false,false,true)
 const prefix='/'+GAME_ID+OLD_STREET_API_PATH
 async function middleware(req:IncomingMessage,res:ServerResponse,next:()=>void){
  const url=new URL(req.url??'/', 'http://'+(req.headers.host??'localhost'))
  if(!url.pathname.startsWith(prefix+'/'))return next()
  const fail=(status:number,error:string)=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error}))}
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||req.headers.origin&&req.headers.origin!==url.origin)return fail(403,'LOOPBACK_ONLY')
  try{
   if(!['GET','POST'].includes(req.method??''))return fail(405,'METHOD_NOT_ALLOWED')
   if(req.method==='POST'&&!req.headers['content-type']?.startsWith('application/json'))return fail(415,'JSON_REQUIRED')
   const chunks:Buffer[]=[];let size=0
   for await(const chunk of req){size+=chunk.length;if(size>16000)return fail(413,'BODY_TOO_LARGE');chunks.push(Buffer.from(chunk))}
   const headers=new Headers()
   for(const [key,value] of Object.entries(req.headers))if(value)headers.set(key,Array.isArray(value)?value.join(','):value)
   url.pathname=url.pathname.slice(GAME_ID.length+1)
   const response=await handler(new Request(url,{method:req.method,headers,body:req.method==='POST'?Buffer.concat(chunks):undefined}),env)
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))
  }catch{fail(503,'PREVIEW_SERVICE_UNAVAILABLE')}
 }
 const install=(server:any)=>{server.middlewares.use((req:IncomingMessage,res:ServerResponse,next:()=>void)=>{void middleware(req,res,next)});server.httpServer?.once('close',()=>{objects.clear();storage.close()})}
 return {name:'oldstreet-worker-preview',configureServer:install,configurePreviewServer:install}
}
