// Loopback-only integration harness. This never provisions a cloud namespace.
import {DatabaseSync} from 'node:sqlite'
import type {IncomingMessage,ServerResponse} from 'node:http'
import {CarriageJourneyAuthority,createHandler} from '../worker/source'
import {GAME_ID} from '../src/game-id'
export function preflightPlugin(){
 // Explicit loopback-only fault injection, absent from cloud/Pages plugins.
 const failAsset=process.env.CARRIAGE_QA_ASSET_FAIL_ONCE
 let assetFailed=false
 let mismatchOnce=process.env.CARRIAGE_QA_RUNTIME_MISMATCH_ONCE==='1'
 const databases:DatabaseSync[]=[],objects=new Map<string,CarriageJourneyAuthority>()
 const environment={CARRIAGE_JOURNEYS:{idFromName:(owner:string)=>owner,get:(id:unknown)=>{
  const owner=String(id);let object=objects.get(owner)
  if(!object){const raw=new DatabaseSync(':memory:');databases.push(raw);object=new CarriageJourneyAuthority({storage:{sql:{exec:(q,...b)=>{const stmt=raw.prepare(q),rows=stmt.columns().length?stmt.all(...b):(stmt.run(...b),[]);return {toArray:()=>rows}}},transactionSync:<T>(work:()=>T)=>{raw.exec('BEGIN IMMEDIATE');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}});objects.set(owner,object)}
  return object
 }}}
 const handler=createHandler(true),prefix='/'+GAME_ID
 const middleware=(req:IncomingMessage,res:ServerResponse,next:()=>void)=>{
  const url=new URL(req.url??'/', 'http://'+(req.headers.host??'localhost'))
  if(failAsset&&!assetFailed&&['localhost','127.0.0.1','[::1]'].includes(url.hostname)&&url.pathname===failAsset&&url.searchParams.has('scene_asset')){assetFailed=true;res.writeHead(503,{'Cache-Control':'no-store'});res.end('Synthetic scene resource failure');return}
  if(!url.pathname.startsWith(prefix+'/api/lab'))return next()
  if(!['localhost','127.0.0.1','[::1]'].includes(url.hostname)){res.writeHead(403);res.end();return}
  if(mismatchOnce&&url.pathname===prefix+'/api/lab/health'){mismatchOnce=false;res.writeHead(200,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({ok:true,runtimeContract:'synthetic-previous-runtime'}));return}
  void(async()=>{try{
   let size=0;const chunks:Buffer[]=[];for await(const chunk of req){size+=chunk.length;if(size>6000){res.writeHead(413);res.end();return}chunks.push(Buffer.from(chunk))}
   url.pathname=url.pathname.slice(prefix.length)
   const headers=new Headers();for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
   const response=await handler(new Request(url,{method:req.method,headers,body:req.method==='GET'||req.method==='HEAD'?undefined:Buffer.concat(chunks)}),environment)
   res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()))
  }catch{res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'PREFLIGHT_UNAVAILABLE'}))}})()
 }
 return {name:'carriage-cloud-loopback-preflight',configureServer(server:any){server.middlewares.use(middleware);server.httpServer?.once('close',()=>databases.forEach(db=>db.close()))},configurePreviewServer(server:any){server.middlewares.use(middleware);server.httpServer?.once('close',()=>databases.forEach(db=>db.close()))}}
}
