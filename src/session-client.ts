import {randomId} from './random-id'
import {currentScene} from './contract'
import type {Head} from './journey-runtime'
import type {Locale} from './story'
export type Transport=(path:string,body?:unknown)=>Promise<any>
export type SessionLock=<T>(name:string,work:()=>Promise<T>)=>Promise<T>
export type Pending={id:string;body:Record<string,any>&{action_id:string;expected_version:number;sceneId:string}}
const terminal=new Set(['VERSION_CONFLICT','OFF_SCENE_ENTITY','INVALID_ACTION','UNKNOWN_ENTITY','INVALID_POSITION','TOO_FAR','UNSUPPORTED_ACTION','INVALID_TEXT','INVALID_ACTION_TYPE','INVALID_NARRATION_MODE','ACTION_ID_CONFLICT'])
const idPattern=/^[a-zA-Z0-9-]{16,80}$/
function parsePending(raw:string):Pending{const p=JSON.parse(raw);if(!p||!idPattern.test(p.id)||!p.body||!idPattern.test(p.body.action_id)||!Number.isSafeInteger(p.body.expected_version)||typeof p.body.sceneId!=='string')throw Error('INVALID_PENDING');return p}
export class SessionClient{
 constructor(private storage:Storage,private prefix:string,private transport:Transport,private lock:SessionLock=async(_name,work)=>work()){}
 private key(name:string){return this.prefix+name}
 read<T>(name:string,fallback:T):T{const raw=this.storage.getItem(this.key(name));return raw===null?fallback:JSON.parse(raw)}
 write(name:string,value:unknown){this.storage.setItem(this.key(name),JSON.stringify(value))}
 private quarantine(key:string,raw:string){this.storage.setItem(this.key('quarantine:'+randomId()),raw);if(this.storage.getItem(key)===raw)this.storage.removeItem(key)}
 pending():Pending[]{
  const legacyKey=this.key('pending'),legacy=this.storage.getItem(legacyKey)
  if(legacy&&legacy!=='null'){
   let p:Pending|undefined;try{p=parsePending(legacy)}catch{this.quarantine(legacyKey,legacy)}
   if(p){this.put(p);if(this.storage.getItem(legacyKey)===legacy)this.storage.removeItem(legacyKey)}
  }
  const prefix=this.key('pending-v2:'),keys=Array.from({length:this.storage.length},(_,i)=>this.storage.key(i)).filter((k):k is string=>Boolean(k?.startsWith(prefix))),items:Pending[]=[]
  for(const key of keys){const raw=this.storage.getItem(key);if(!raw)continue;try{const p=parsePending(raw);if(key!==prefix+p.body.action_id)throw Error('KEY_MISMATCH');items.push(p)}catch{this.quarantine(key,raw)}}
  return items
 }
 private put(p:Pending){const key=this.key('pending-v2:'+p.body.action_id),raw=JSON.stringify(p),old=this.storage.getItem(key);if(old&&old!==raw)throw Error('PENDING_ID_CONFLICT');this.storage.setItem(key,raw)}
 private ack(p:Pending){const key=this.key('pending-v2:'+p.body.action_id);if(this.storage.getItem(key)===JSON.stringify(p))this.storage.removeItem(key)}
 hasPending(){const session=this.read('session','');return this.pending().some(p=>p.id===session)}
 async enroll(locale:Locale,restart=false):Promise<Head>{return this.lock(this.key('bootstrap'),async()=>{
  const current=this.read('session','')
  if(restart&&this.hasPending())throw Error('PENDING_ACTION')
  let pending=this.read<{enrollment_id:string;locale:Locale}|null>('enrollment-pending',null)
  if(current&&!restart&&!pending)return this.transport('/sessions/'+current)
  // A lost restart response must finish that enrollment before resuming the old session.
  if(!pending){
   pending=!current&&!restart?this.read<{enrollment_id:string;locale:Locale}|null>('enrollment-request',null):null
   pending??={enrollment_id:restart?randomId():this.read('enrollment','')||randomId(),locale}
   this.write('enrollment-pending',pending);this.write('enrollment-request',pending);this.write('enrollment',pending.enrollment_id)
  }
  const head=await this.transport('/sessions',pending);this.write('session',head.id);this.write('enrollment-pending',null);return head
 })}
 private async settle(p:Pending){
  let result:any
  try{result=await this.transport('/sessions/'+p.id+'/actions',p.body)}catch(e){if(!(e instanceof Error)||!terminal.has(e.message))throw e;result={kind:'recovered',text:null,accepted:false}}
  const latest:Head=await this.transport('/sessions/'+p.id)
  if(!result.head||latest.version!==result.head.version||currentScene(latest.save)!==currentScene(result.head.save))result={kind:'recovered',text:null,accepted:false}
  this.ack(p);return {...result,head:latest}
 }
 async send(head:Head,body:Record<string,unknown>){return this.lock(this.key('session:'+head.id),async()=>{
  if(this.pending().some(p=>p.id===head.id))throw Error('PENDING_ACTION')
  const p:Pending={id:head.id,body:{...body,sceneId:currentScene(head.save),action_id:randomId(),expected_version:head.version}}
  this.put(p);return this.settle(p)
 })}
 async recover(){const session=this.read('session','');if(!session)return null;return this.lock(this.key('session:'+session),async()=>{
  let result:any={head:await this.transport('/sessions/'+session),kind:'recovered',text:null,accepted:false}
  for(const p of this.pending().filter(p=>p.id===session))result=await this.settle(p)
  return result
 })}
}
