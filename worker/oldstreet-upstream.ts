import {GAME_ID} from '../src/game-id'
import {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from '../src/old-street-runtime-contract'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
export type OldStreetUpstreamEnv={OLDSTREET_GAME_ID?:string;OLDSTREET_UPSTREAM_ORIGIN?:string;OLDSTREET_EDGE_TOKEN?:string;OLDSTREET_EXPIRES_AT?:string}
/** Authenticated edge only; never bundle secrets or forward a browser owner.
 * A Remix UUID requires its own registered upstream world and private bindings. */
export async function oldStreetUpstream(request:Request,env:OldStreetUpstreamEnv){
 const headers={'Cache-Control':'no-store',[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT,'X-Content-Type-Options':'nosniff'}
 const fail=(error:string,status:number)=>Response.json({error},{status,headers})
 const expires=Number(env.OLDSTREET_EXPIRES_AT),origin=env.OLDSTREET_UPSTREAM_ORIGIN,secret=env.OLDSTREET_EDGE_TOKEN
 if(env.OLDSTREET_GAME_ID!==GAME_ID||!/^https:\/\/[a-z0-9.-]+$/.test(origin??'')||!/^\w{64}$/.test(secret??'')||!Number.isSafeInteger(expires))return fail('OLDSTREET_DEPLOYMENT_UNCONFIGURED',503)
 if(Date.now()>=expires)return fail('PLAY_WINDOW_CLOSED',410)
 const url=new URL(request.url),path=url.pathname
 if(!path.startsWith(OLD_STREET_API_PATH+'/')||/[\\%#]/.test(path+url.search))return fail('NOT_FOUND',404)
 if(!['GET','POST'].includes(request.method))return fail('METHOD_NOT_ALLOWED',405)
 const publicOrigin='https://game.aiwaves.tech'
 if(request.headers.get('Origin')&&request.headers.get('Origin')!==publicOrigin||request.headers.get('Sec-Fetch-Site')==='cross-site')return fail('ORIGIN_FORBIDDEN',403)
 if(request.method==='POST'&&(request.headers.get('Origin')!==publicOrigin||request.headers.get('Content-Type')!=='application/json'))return fail('INVALID_WRITE_ORIGIN',403)
 const capability=request.headers.get('Authorization')?.match(/^Bearer ([A-Za-z0-9_-]{42}[AEIMQUYcgkosw048])$/)?.[1]
 if(!capability)return fail('AUTH_REQUIRED',401)
 if(request.headers.get(OLD_STREET_RUNTIME_HEADER)!==OLD_STREET_RUNTIME_CONTRACT||request.headers.get(RUNTIME_HEADER)!==RUNTIME_CONTRACT)return fail('RUNTIME_VERSION_MISMATCH',409)
 const owner=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(capability))),x=>x.toString(16).padStart(2,'0')).join('')
 const forwarded=new Headers({'X-Rpg-Edge-Token':secret!,'X-Rpg-Owner':owner})
 for(const k of ['Origin','Content-Type','Sec-Fetch-Site'])if(request.headers.has(k))forwarded.set(k,request.headers.get(k)!)
 let body:ArrayBuffer|undefined
 if(request.method==='POST'){
  const reader=request.body?.getReader();if(!reader)return fail('INVALID_JSON',400)
  const parts:Uint8Array[]=[];let count=0
  try{for(;;){const r=await reader.read();if(r.done)break;count+=r.value.byteLength;if(count>16384){await reader.cancel();return fail('BODY_TOO_LARGE',413)}parts.push(r.value)}}finally{reader.releaseLock()}
  const bytes=new Uint8Array(count);let at=0;for(const p of parts){bytes.set(p,at);at+=p.length}body=bytes.buffer
 }
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),28000)
 try{
  const response=await fetch(origin+'/'+GAME_ID+'/oldstreet'+path.slice(OLD_STREET_API_PATH.length)+url.search,{method:request.method,headers:forwarded,body,redirect:'manual',signal:controller.signal})
  if(response.status>=300&&response.status<400)return fail('UPSTREAM_REDIRECT_REFUSED',502)
  const type=response.headers.get('Content-Type')??''
  if(!type.startsWith('application/json')&&!type.startsWith('image/png'))return fail('INVALID_UPSTREAM_RESPONSE',502)
  return new Response(response.body,{status:response.status,headers:{...headers,'Content-Type':type}})
 }catch{return fail('SERVICE_UNAVAILABLE',503)}finally{clearTimeout(timer)}
}
