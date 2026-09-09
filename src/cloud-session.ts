import type {SessionLock,Transport} from './session-client'
export function newCapability(source:Pick<Crypto,'getRandomValues'>=crypto){const bytes=source.getRandomValues(new Uint8Array(32));return btoa(String.fromCharCode(...bytes)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'')}
export function cloudTransport(storage:Storage,prefix:string,apiBase:string,lock:SessionLock,request:typeof fetch=fetch):Transport{
 let capability:Promise<string>|undefined
 const identity=()=>capability??=lock(prefix+'identity',async()=>{
  const key=prefix+'capability',old=storage.getItem(key)
  if(old){if(!/^[A-Za-z0-9_-]{42}[AEIMQUYcgkosw048]$/.test(old))throw Error('INVALID_CLOUD_IDENTITY');return old}
  const value=newCapability();storage.setItem(key,value);return value
 }).catch(e=>{capability=undefined;throw e})
 return async(path,body)=>{
  const token=await identity()
  const response=await request(apiBase+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+token},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)})
  const data=await response.json();if(!response.ok)throw Error(data.error??'NETWORK_ERROR');return data
 }
}
