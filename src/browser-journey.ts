import {initialStory,upgradePowerFacts,type Locale} from './story'
import {upgradeAttendantFacts} from './attendant'
import {upgradeContactFacts} from './contacts'
import {currentScene,safePosition,MAP_VERSION,localReply} from './contract'
import {prepareAction,validateAction,LabError,type Head} from './journey-runtime'
import {randomId} from './random-id'

const request=<T>(r:IDBRequest<T>)=>new Promise<T>((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
// The whole action and its replay receipt commit together. Concurrent tabs cannot
// spend the same inventory twice; an aborted write never becomes a visible win.
export class BrowserJourney {
 private database:Promise<IDBDatabase>
 constructor(name:string,factory:IDBFactory=globalThis.indexedDB){
  this.database=new Promise((resolve,reject)=>{
   if(!factory){reject(new Error('BROWSER_STORAGE_UNAVAILABLE'));return}
   const r=factory.open(name,1)
   r.onupgradeneeded=()=>{for(const table of ['heads','enrollments','actions'])r.result.createObjectStore(table)}
   r.onsuccess=()=>{r.result.onversionchange=()=>r.result.close();resolve(r.result)}
   r.onerror=()=>reject(r.error)
   r.onblocked=()=>reject(new Error('BROWSER_STORAGE_BLOCKED'))
  })
 }
 private async transaction<T>(tables:string[],work:(tx:IDBTransaction)=>Promise<T>):Promise<T>{
  const db=await this.database,tx=db.transaction(tables,'readwrite')
  const done=new Promise<void>((resolve,reject)=>{tx.oncomplete=()=>resolve();tx.onabort=()=>reject(tx.error??new Error('STORAGE_ABORTED'));tx.onerror=()=>{}})
  try{const result=await work(tx);await done;return result}catch(e){try{tx.abort()}catch{}await done.catch(()=>{});throw e}
 }
 private async head(tx:IDBTransaction,id:string):Promise<Head>{
  const h=await request(tx.objectStore('heads').get(id)) as Head|undefined
  if(!h)throw new LabError('SESSION_NOT_FOUND',404)
  if(h.mapVersion!==MAP_VERSION)throw new Error('BROWSER_SAVE_VERSION_UNSUPPORTED')
  upgradePowerFacts(h.save);upgradeContactFacts(h.save);upgradeAttendantFacts(h.save)
  return h
 }
 async create(enrollment:string,locale:Locale){
  return this.transaction(['heads','enrollments'],async tx=>{
   const enrollments=tx.objectStore('enrollments'),id=await request(enrollments.get(enrollment))
   if(id)return this.head(tx,id)
   const h:Head={id:randomId(),version:0,save:initialStory(locale),position:safePosition(null),mapVersion:MAP_VERSION}
   tx.objectStore('heads').put(h,h.id);enrollments.put(h.id,enrollment);return h
  })
 }
 async get(id:string){return this.transaction(['heads'],async tx=>{const h=await this.head(tx,id);tx.objectStore('heads').put(h,id);return h})}
 async checkpoint(id:string,body:any){return this.transaction(['heads'],async tx=>{
  const h=await this.head(tx,id)
  if(body.sceneId!==currentScene(h.save)||body.expected_version!==h.version)throw new LabError('STALE_POSITION',409)
  h.position=safePosition(body.position,currentScene(h.save));tx.objectStore('heads').put(h,id);return {position:h.position}
 })}
 async action(id:string,body:any){
  validateAction(body)
  const digest=JSON.stringify({id,...body}),key=body.action_id
  const replay=async(tx:IDBTransaction)=>{const old=await request(tx.objectStore('actions').get(key));if(old&&old.digest!==digest)throw new LabError('ACTION_ID_CONFLICT',409);return old?.response}
  // Replay before checking expected_version permits recovery after a lost receipt.
  const cached=await this.transaction(['actions'],replay);if(cached)return cached
  const h=await this.get(id)
  const response=await prepareAction(h,body,async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'local',attempts:0,issues:[],fallback:false}}))
  return this.transaction(['heads','actions'],async tx=>{
   const raced=await replay(tx);if(raced)return raced
   const current=await this.head(tx,id);if(current.version!==h.version)throw new LabError('VERSION_CONFLICT',409)
   tx.objectStore('heads').put(response.head,id)
   tx.objectStore('actions').put({digest,response},key)
   return response
  })
 }
 async api(path:string,body?:any){
  if(path==='/sessions'&&body){if(!/^[a-zA-Z0-9-]{16,80}$/.test(body.enrollment_id))throw new LabError('INVALID_ENROLLMENT');return this.create(body.enrollment_id,body.locale==='en'?'en':'zh')}
  const m=path.match(/^\/sessions\/([\w-]+)(?:\/(actions|position))?$/)
  if(!m)throw new LabError('NOT_FOUND',404)
  if(!body&&!m[2])return this.get(m[1])
  if(body&&m[2]==='position')return this.checkpoint(m[1],body)
  if(body&&m[2]==='actions')return this.action(m[1],body)
  throw new LabError('METHOD_NOT_ALLOWED',405)
 }
 async close(){(await this.database).close()}
}
