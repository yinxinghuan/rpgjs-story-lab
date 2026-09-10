import type {SessionLock,Transport} from './session-client'
import {RUNTIME_CONTRACT,RUNTIME_HEADER} from './runtime-contract'
export function newCapability(source:Pick<Crypto,'getRandomValues'>=crypto){const bytes=source.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
export function cloudTransport(storage:Storage,prefix:string,apiBase:string,lock:SessionLock,request:typeof fetch=fetch):Transport{
 let capability:Promise<string>|undefined
 let handshake:Promise<void>|undefined
 const identity=()=>capability??=lock(prefix+'identity',async()=>{
  const key=prefix+'capability',old=storage.getItem(key)
  if(old){if(!/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(old))throw Error('INVALID_CLOUD_IDENTITY');return old}
  const value=newCapability();storage.setItem(key,value);return value
 }).catch(e=>{capability=undefined;throw e})
 return async(path,body)=>{
  const token=await identity()
  const headers={'Content-Type':'application/json',Authorization:'Bearer '+token,[RUNTIME_HEADER]:RUNTIME_CONTRACT}
  // An old server ignores unknown request headers. Check its health contract
  // before sending any session request, including enrollment or a pending retry.
  await (handshake??=request(apiBase+'/health',{headers,cache:'no-store',signal:AbortSignal.timeout(10000)}).then(async r=>{
   const h=await r.json();if(!r.ok)throw Error(h.error??'NETWORK_ERROR')
   if(h.runtimeContract!==RUNTIME_CONTRACT)throw Error('RUNTIME_VERSION_MISMATCH')
  }).catch(e=>{handshake=undefined;throw e}))
  const response=await request(apiBase+path,{method:body===undefined?'GET':'POST',headers,cache:'no-store',body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)})
  const data=response.ok&&response.headers.get('Content-Type')?.startsWith('image/png')?new Uint8Array(await response.arrayBuffer()):await response.json();if(!response.ok){if(data.error==='RUNTIME_VERSION_MISMATCH')handshake=undefined;throw Error(data.error??'NETWORK_ERROR')}
  if(response.headers.get(RUNTIME_HEADER)!==RUNTIME_CONTRACT){handshake=undefined;throw Error('RUNTIME_VERSION_MISMATCH')}
  return data
 }
}
