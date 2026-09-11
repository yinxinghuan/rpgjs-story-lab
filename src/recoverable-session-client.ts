import {randomId} from './random-id'
type Locale='zh'|'en'
export interface RecoverableHead{id:string;version:number}
export interface SessionClientPolicy<H extends RecoverableHead>{scene:(head:H)=>string;assertHead:(value:unknown)=>asserts value is H;terminalErrors?:readonly string[];preparedAction?:{assertPlan:(value:any,body:Record<string,any>,id:string)=>void;ready:(plan:any)=>Promise<void>};ending?:{request:(head:H)=>{snapshot_id:string;mapVersion:string};assertResult:(result:any,body:Record<string,any>)=>void;terminalErrors:readonly string[]}}
export type Transport=(path:string,body?:unknown)=>Promise<any>
export type SessionLock=<T>(name:string,work:()=>Promise<T>)=>Promise<T>
export type Pending={id:string;operation?:'ending'|'prepared-action';body:Record<string,any>&{expected_version:number;sceneId:string}}
const pendingId=(p:Pending)=>p.operation==='ending'?'ending:'+p.body.ending_id:p.body.action_id
const terminal=new Set(['VERSION_CONFLICT','OFF_SCENE_ENTITY','INVALID_ACTION','UNKNOWN_ENTITY','INVALID_POSITION','TOO_FAR','UNSUPPORTED_ACTION','INVALID_TEXT','INVALID_ACTION_TYPE','INVALID_NARRATION_MODE','ACTION_ID_CONFLICT'])
const idPattern=/^[a-zA-Z0-9-]{16,80}$/
function parsePending(raw:string):Pending{const p=JSON.parse(raw);if(!p||!idPattern.test(p.id)||!p.body||(p.operation!==undefined&&p.operation!=='ending'&&p.operation!=='prepared-action')||!idPattern.test(p.operation==='ending'?p.body.ending_id:p.body.action_id)||!Number.isSafeInteger(p.body.expected_version)||typeof p.body.sceneId!=='string'||p.operation==='ending'&&(typeof p.body.snapshot_id!=='string'||typeof p.body.mapVersion!=='string'))throw Error('INVALID_PENDING');return p}
export class RecoverableSessionClient<H extends RecoverableHead>{
 constructor(private storage:Storage,private prefix:string,private transport:Transport,private policy:SessionClientPolicy<H>,private lock:SessionLock=async(_name,work)=>work()){}
 private head(value:unknown,expectedId?:string):H{this.policy.assertHead(value);const h=value as H;if(!idPattern.test(h.id)||!Number.isSafeInteger(h.version)||h.version<0||expectedId!==undefined&&h.id!==expectedId)throw Error('SESSION_RESPONSE_MISMATCH');return h}
 private assertSelected(id:string){const current=this.read('session','');if(current&&current!==id)throw Error('SESSION_SELECTION_CHANGED')}
 private async get(id:string){return this.head(await this.transport('/sessions/'+id),id)}
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
  for(const key of keys){const raw=this.storage.getItem(key);if(!raw)continue;try{const p=parsePending(raw);if(key!==prefix+pendingId(p))throw Error('KEY_MISMATCH');items.push(p)}catch{this.quarantine(key,raw)}}
  return items
 }
 private put(p:Pending){const key=this.key('pending-v2:'+pendingId(p)),raw=JSON.stringify(p),old=this.storage.getItem(key);if(old&&old!==raw)throw Error('PENDING_ID_CONFLICT');this.storage.setItem(key,raw)}
 private ack(p:Pending){const key=this.key('pending-v2:'+pendingId(p));if(this.storage.getItem(key)===JSON.stringify(p))this.storage.removeItem(key)}
 hasPending(){const session=this.read('session','');return this.pending().some(p=>p.id===session)}
 async enroll(locale:Locale,restart=false):Promise<H>{return this.lock(this.key('bootstrap'),async()=>{
  const current=this.read('session','')
  const work=async()=>{
  if(restart&&this.pending().length)throw Error('PENDING_ACTION')
  let pending=this.read<{enrollment_id:string;locale:Locale}|null>('enrollment-pending',null)
  if(current&&!restart&&!pending)return this.get(current)
  // A lost restart response must finish that enrollment before resuming the old session.
  if(!pending){
   pending=!current&&!restart?this.read<{enrollment_id:string;locale:Locale}|null>('enrollment-request',null):null
   pending??={enrollment_id:restart?randomId():this.read('enrollment','')||randomId(),locale}
   this.write('enrollment-pending',pending);this.write('enrollment-request',pending);this.write('enrollment',pending.enrollment_id)
  }
  let response:unknown
  try{response=await this.transport('/sessions',pending)}catch(e){
   // A definite quota refusal creates no journey. Do not strand selection behind it.
   if(restart&&e instanceof Error&&e.message==='SESSION_LIMIT'){this.write('enrollment-pending',null);this.write('enrollment-request',null)}
   throw e
  }
  const head=this.head(response);this.write('session',head.id);this.write('enrollment-pending',null);return head
  }
  return restart?this.lock(this.key('session:'+current),work):work()
 })}
 private async settle(p:Pending){
  let result:any,rejected=false
  const ending=p.operation==='ending'
  if(ending&&!this.policy.ending)throw Error('ENDING_UNAVAILABLE')
  try{
   if(p.operation==='prepared-action'){
    const policy=this.policy.preparedAction;if(!policy)throw Error('PREPARED_ACTION_UNAVAILABLE')
    const plan=await this.transport('/sessions/'+p.id+'/prepare-action',p.body);policy.assertPlan(plan,p.body,p.id)
    if(plan.status!=='committed')await policy.ready(plan)
    result=await this.transport('/sessions/'+p.id+'/commit-action',p.body)
   }else result=await this.transport('/sessions/'+p.id+(ending?'/ending':'/actions'),p.body)
  }catch(e){if(!(e instanceof Error)||!terminal.has(e.message)&&!(ending?this.policy.ending?.terminalErrors:this.policy.terminalErrors)?.includes(e.message))throw e;rejected=true;result={kind:'recovered',text:null,accepted:false,rejectionCode:e.message}}
  if(ending&&!rejected)this.policy.ending!.assertResult(result,p.body)
  if(result.head)this.head(result.head,p.id)
  const latest=await this.get(p.id)
  if(latest.version<p.body.expected_version||result.head&&latest.version<result.head.version)throw Error('SESSION_RESPONSE_REGRESSED')
  if(result.head&&latest.version===result.head.version&&this.policy.scene(latest)!==this.policy.scene(result.head))throw Error('SESSION_RESPONSE_MISMATCH')
  if(ending&&!rejected&&latest.version===result.head.version)this.policy.ending!.assertResult({...result,head:latest},p.body)
  if(!result.head||latest.version!==result.head.version)result={kind:'recovered',text:null,accepted:false,...(result.rejectionCode?{rejectionCode:result.rejectionCode}:{})}
  this.ack(p);return {...result,head:latest}
 }
 /** Selection changes only the continuation pointer; server state is never imported or rewritten. */
 async selectSession(id:string):Promise<H>{
  if(!idPattern.test(id))throw Error('INVALID_SESSION_ID')
  return this.lock(this.key('bootstrap'),async()=>{
   const current=this.read('session','')
   return this.lock(this.key('session:'+current),async()=>{
    if(this.pending().length||this.read('enrollment-pending',null))throw Error('PENDING_ACTION')
    const selected=await this.get(id)
    this.write('session',selected.id)
    return selected
   })
  })
 }
 async send(head:H,body:Record<string,unknown>){return this.lock(this.key('session:'+head.id),async()=>{
  this.head(head);this.assertSelected(head.id)
  if(this.pending().some(p=>p.id===head.id))throw Error('PENDING_ACTION')
  const p:Pending={id:head.id,body:{...body,sceneId:this.policy.scene(head),action_id:randomId(),expected_version:head.version}}
  this.put(p);return this.settle(p)
 })}
 async sendPrepared(head:H,body:Record<string,unknown>){return this.lock(this.key('session:'+head.id),async()=>{
  this.head(head);this.assertSelected(head.id);if(!this.policy.preparedAction)throw Error('PREPARED_ACTION_UNAVAILABLE')
  if(this.pending().some(p=>p.id===head.id))throw Error('PENDING_ACTION')
  const p:Pending={id:head.id,operation:'prepared-action',body:{...body,sceneId:this.policy.scene(head),action_id:randomId(),expected_version:head.version}}
  this.put(p);return this.settle(p)
 })}
 async sendEnding(head:H){return this.lock(this.key('session:'+head.id),async()=>{
  this.head(head);this.assertSelected(head.id)
  if(!this.policy.ending)throw Error('ENDING_UNAVAILABLE')
  if(this.pending().some(p=>p.id===head.id))throw Error('PENDING_ACTION')
  const p:Pending={id:head.id,operation:'ending',body:{...this.policy.ending.request(head),sceneId:this.policy.scene(head),ending_id:randomId(),expected_version:head.version}}
  this.put(p);return this.settle(p)
 })}
 async recover(){const session=this.read('session','');if(!session)return null;return this.lock(this.key('session:'+session),async()=>{
  let result:any={head:await this.get(session),kind:'recovered',text:null,accepted:false}
  for(const p of this.pending().filter(p=>p.id===session))result=await this.settle(p)
  return result
 })}
}
