import {NARRATION_POLICY} from '../src/narration-policy'
import {LabError} from '../src/journey-runtime'
export interface AuthorityStorage{
 all<T>(sql:string,...bindings:any[]):T[]
 run(sql:string,...bindings:any[]):void
 transaction<T>(work:()=>T):T
}
type Locale='zh'|'en'
export interface SessionHead{id:string;version:number;position:{x:number;y:number};mapVersion:string}
export interface SessionResult<H extends SessionHead>{head:H;kind:string;[key:string]:unknown}
/** One commit/replay implementation; the installed policy owns story semantics.
 * A store belongs to one policy/world. Never reinterpret another world's rows. */
export interface SessionRuntime<H extends SessionHead>{
 initial(locale:Locale,id:string):H
 upgrade(value:unknown):H
 assertReadable(value:unknown):void
 scene(head:H):string
 position(head:H,value:unknown):H['position']
 validateAction(body:unknown):void
 prepare(head:H,body:any,reserveNarration:()=>boolean):Promise<SessionResult<H>>
 preserveConcurrent(candidate:H,current:H):void
 assertPrepared?(candidate:H,current:H,actionId?:string):void
 ending?:{validate(body:unknown):void;prepare(head:H,body:any):Promise<SessionResult<H>>;assertCurrent(before:H,current:H):void}
}
const validId=(id:unknown)=>typeof id==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(id)
const wire=<T>(v:T):T=>JSON.parse(JSON.stringify(v))
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
const digest=(v:unknown)=>JSON.stringify(canonical(v))
type Row={data:string;cursor:number}
export class SessionAuthority<H extends SessionHead>{
 private inFlight=new Map<string,{hash:string;promise:Promise<any>}>()
 constructor(protected db:AuthorityStorage,protected runtime:SessionRuntime<H>,protected now:()=>number=Date.now){
  db.run('CREATE TABLE IF NOT EXISTS prepared_actions(owner TEXT NOT NULL, action TEXT NOT NULL, session TEXT NOT NULL, digest TEXT NOT NULL, base TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(owner,action))')
  db.run('CREATE TABLE IF NOT EXISTS narration_usage(owner TEXT PRIMARY KEY, window_start INTEGER NOT NULL, uses INTEGER NOT NULL)')
  db.run('CREATE TABLE IF NOT EXISTS journeys(id TEXT PRIMARY KEY, owner TEXT NOT NULL, enrollment TEXT NOT NULL, enrollment_digest TEXT NOT NULL, data TEXT NOT NULL, cursor INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL, UNIQUE(owner,enrollment))')
  db.run('CREATE TABLE IF NOT EXISTS receipts(owner TEXT NOT NULL, action TEXT NOT NULL, digest TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(owner,action))')
  db.run('CREATE TABLE IF NOT EXISTS journal(session TEXT NOT NULL, cursor INTEGER NOT NULL, action TEXT NOT NULL, kind TEXT NOT NULL, event TEXT NOT NULL, PRIMARY KEY(session,cursor))')
 }
 protected row(owner:string,id:string){const row=this.db.all<Row>('SELECT data,cursor FROM journeys WHERE owner=? AND id=?',owner,id)[0];if(!row)throw new LabError('SESSION_NOT_FOUND',404);return row}
 protected write(owner:string,h:H,cursor:number){this.db.run('UPDATE journeys SET data=?,cursor=?,updated=? WHERE owner=? AND id=?',JSON.stringify(h),cursor,Date.now(),owner,h.id)}
 get(owner:string,id:string){return this.db.transaction(()=>{const row=this.row(owner,id),head=this.runtime.upgrade(JSON.parse(row.data));if(JSON.stringify(head)!==row.data)this.write(owner,head,row.cursor);return head})}
 create(owner:string,enrollment:string,locale:Locale){
  if(!validId(enrollment))throw new LabError('INVALID_ENROLLMENT')
  const hash=digest({locale})
  return this.db.transaction(()=>{
   const old=this.db.all<{id:string;enrollment_digest:string}>('SELECT id,enrollment_digest FROM journeys WHERE owner=? AND enrollment=?',owner,enrollment)[0]
   if(old){if(old.enrollment_digest!==hash)throw new LabError('ENROLLMENT_ID_CONFLICT',409);return this.runtime.upgrade(JSON.parse(this.row(owner,old.id).data))}
   // A store cannot mix story policies, even under a different owner. The
   // first-row check and insertion share one transaction for an empty store.
   const sample=this.db.all<Row>('SELECT data,cursor FROM journeys LIMIT 1')[0]
   if(sample)this.runtime.assertReadable(JSON.parse(sample.data))
   const count=this.db.all<{n:number}>('SELECT COUNT(*) AS n FROM journeys WHERE owner=?',owner)[0].n
   if(count>=100)throw new LabError('SESSION_LIMIT',429)
   const head:H=wire(this.runtime.initial(locale,crypto.randomUUID()))
   this.db.run('INSERT INTO journeys VALUES(?,?,?,?,?,?,?)',head.id,owner,enrollment,hash,JSON.stringify(head),0,Date.now());return head
  })
 }
 directory(owner:string){return this.db.all<{id:string;data:string;cursor:number;updated:number}>('SELECT id,data,cursor,updated FROM journeys WHERE owner=? ORDER BY updated DESC LIMIT 100',owner).map(r=>{const h=this.runtime.upgrade(JSON.parse(r.data));return {id:r.id,version:h.version,cursor:r.cursor,scene:this.runtime.scene(h),updated:r.updated}})}
 events(owner:string,id:string,after:number){this.row(owner,id);if(!Number.isSafeInteger(after)||after<0)throw new LabError('INVALID_CURSOR');return this.db.all<{event:string}>('SELECT event FROM journal WHERE session=? AND cursor>? ORDER BY cursor LIMIT 100',id,after).map(r=>JSON.parse(r.event))}
 checkpoint(owner:string,id:string,body:any){return this.db.transaction(()=>{
  const row=this.row(owner,id),head=this.runtime.upgrade(JSON.parse(row.data))
  if(body?.sceneId!==this.runtime.scene(head)||body.expected_version!==head.version)throw new LabError('STALE_POSITION',409)
  const position=this.runtime.position(head,body.position)
  head.position=position;this.write(owner,head,row.cursor);return {position}
 })}
 private replay(owner:string,action:string,hash:string){const r=this.db.all<{digest:string;response:string}>('SELECT digest,response FROM receipts WHERE owner=? AND action=?',owner,action)[0];if(!r)return null;if(r.digest!==hash)throw new LabError('ACTION_ID_CONFLICT',409);return JSON.parse(r.response)}
 async action(owner:string,id:string,body:any){return this.dispatch(owner,id,body,'action')}
 async ending(owner:string,id:string,body:any){return this.dispatch(owner,id,body,'ending')}
 private async dispatch(owner:string,id:string,body:any,operation:'action'|'ending'){
  if(operation==='ending'){if(!this.runtime.ending)throw new LabError('ENDING_UNAVAILABLE',503);this.runtime.ending.validate(body)}else this.runtime.validateAction(body)
  body=wire(body)
  const receiptId=operation==='ending'?'ending:'+body.ending_id:body.action_id
  const hash=digest(operation==='ending'?{id,body,operation}:{id,body}),cached=this.replay(owner,receiptId,hash);if(cached)return cached
  const key=JSON.stringify([owner,receiptId]),existing=this.inFlight.get(key)
  if(existing){if(existing.hash!==hash)throw new LabError('ACTION_ID_CONFLICT',409);return existing.promise}
  const promise=this.prepareAndCommit(owner,id,body,hash,operation,receiptId)
  this.inFlight.set(key,{hash,promise})
  try{return await promise}finally{if(this.inFlight.get(key)?.promise===promise)this.inFlight.delete(key)}
 }
 /** Compute and persist a candidate without committing the story. Replays of
  * the same envelope reuse it, including across service restarts. */
 async prepareAction(owner:string,id:string,body:any){
  this.runtime.validateAction(body);body=wire(body)
  const hash=digest({id,body}),cached=this.replay(owner,body.action_id,hash)
  if(cached)return {status:'committed' as const,result:cached}
  const old=this.db.all<{digest:string;base:string;response:string}>('SELECT digest,base,response FROM prepared_actions WHERE owner=? AND action=?',owner,body.action_id)[0]
  if(old){if(old.digest!==hash)throw new LabError('ACTION_ID_CONFLICT',409);const current=this.get(owner,id),base=JSON.parse(old.base);if(current.version!==base.version||current.mapVersion!==base.mapVersion)throw new LabError('VERSION_CONFLICT',409);return {status:'prepared' as const,result:JSON.parse(old.response)}}
  const key=JSON.stringify([owner,'prepare:'+body.action_id]),running=this.inFlight.get(key)
  if(running){if(running.hash!==hash)throw new LabError('ACTION_ID_CONFLICT',409);return running.promise}
  const promise=(async()=>{
   const head=this.get(owner,id)
   if(head.version!==body.expected_version)throw new LabError('VERSION_CONFLICT',409)
   const count=this.db.all<{n:number}>('SELECT COUNT(*) AS n FROM prepared_actions WHERE owner=?',owner)[0].n
   if(count>=32)throw new LabError('PREPARED_ACTION_LIMIT',429)
   const response=await this.runtime.prepare(head,body,()=>this.reserveNarration(owner))
   if(response.kind!=='action'||response.accepted!==true||response.head.id!==id||response.head.version!==head.version+1)throw new LabError('UNSUPPORTED_ACTION',409)
   this.runtime.assertReadable(response.head)
   return this.db.transaction(()=>{
    const committed=this.replay(owner,body.action_id,hash);if(committed)return {status:'committed' as const,result:committed}
    const current=JSON.parse(this.row(owner,id).data) as H
    if(current.version!==head.version||current.mapVersion!==head.mapVersion)throw new LabError('VERSION_CONFLICT',409)
    const raced=this.db.all<{digest:string;response:string}>('SELECT digest,response FROM prepared_actions WHERE owner=? AND action=?',owner,body.action_id)[0]
    if(raced){if(raced.digest!==hash)throw new LabError('ACTION_ID_CONFLICT',409);return {status:'prepared' as const,result:JSON.parse(raced.response)}}
    if(this.db.all<{n:number}>('SELECT COUNT(*) AS n FROM prepared_actions WHERE owner=?',owner)[0].n>=32)throw new LabError('PREPARED_ACTION_LIMIT',429)
    this.db.run('INSERT INTO prepared_actions VALUES(?,?,?,?,?,?)',owner,body.action_id,id,hash,JSON.stringify(head),JSON.stringify(response))
    return {status:'prepared' as const,result:wire(response)}
   })
  })()
  this.inFlight.set(key,{hash,promise});try{return await promise}finally{if(this.inFlight.get(key)?.promise===promise)this.inFlight.delete(key)}
 }
 async commitPreparedAction(owner:string,id:string,body:any){
  this.runtime.validateAction(body);body=wire(body)
  const hash=digest({id,body}),cached=this.replay(owner,body.action_id,hash);if(cached)return cached
  const row=this.db.all<{digest:string;base:string;response:string}>('SELECT digest,base,response FROM prepared_actions WHERE owner=? AND action=?',owner,body.action_id)[0]
  if(!row)throw new LabError('ACTION_NOT_PREPARED',409)
  if(row.digest!==hash)throw new LabError('ACTION_ID_CONFLICT',409)
  return this.commitResponse(owner,id,body,hash,'action',body.action_id,JSON.parse(row.base),JSON.parse(row.response),true)
 }
 private reserveNarration(owner:string){
  return this.db.transaction(()=>{
   const now=this.now(),old=this.db.all<{window_start:number;uses:number}>('SELECT window_start,uses FROM narration_usage WHERE owner=?',owner)[0]
   const active=old&&now>=old.window_start&&now-old.window_start<NARRATION_POLICY.windowMs
   if(active&&old.uses>=NARRATION_POLICY.turnsPerWindow)return false
   this.db.run('INSERT INTO narration_usage(owner,window_start,uses) VALUES(?,?,?) ON CONFLICT(owner) DO UPDATE SET window_start=excluded.window_start,uses=excluded.uses',owner,active?old.window_start:now,active?old.uses+1:1)
   return true
  })
 }
 private async prepareAndCommit(owner:string,id:string,body:any,hash:string,operation:'action'|'ending',receiptId:string){
  const head=this.get(owner,id),response=operation==='ending'?await this.runtime.ending!.prepare(head,body):await this.runtime.prepare(head,body,()=>this.reserveNarration(owner))
  return this.commitResponse(owner,id,body,hash,operation,receiptId,head,response)
 }
 private commitResponse(owner:string,id:string,body:any,hash:string,operation:'action'|'ending',receiptId:string,head:H,response:SessionResult<H>,prepared=false){
  // No network await inside transactionSync. Recheck after narrator yields.
  return this.db.transaction(()=>{
   const raced=this.replay(owner,receiptId,hash);if(raced)return raced
   const row=this.row(owner,id),current=JSON.parse(row.data) as H
   this.runtime.assertReadable(current)
   if(current.mapVersion!==head.mapVersion)throw new LabError('JOURNEY_VERSION_UNSUPPORTED',409)
   if(current.version!==head.version)throw new LabError('VERSION_CONFLICT',409)
   if(response.head.id!==head.id||response.head.version!==head.version+1)throw new LabError('INVALID_COMMIT_CANDIDATE',409)
   this.runtime.assertReadable(response.head)
   if(operation==='ending'){
    this.runtime.ending!.assertCurrent(head,current)
    if(response.kind!=='ending'||this.runtime.scene(response.head)!==this.runtime.scene(current))throw new LabError('INVALID_COMMIT_CANDIDATE',409)
    response.head.position={...current.position}
   }
   if(prepared)this.runtime.assertPrepared?.(response.head,current,typeof response.actionId==='string'?response.actionId:undefined)
   this.runtime.preserveConcurrent(response.head,current)
   const cursor=row.cursor+(operation==='ending'?0:1),result=wire({...response,cursor}),event={cursor,version:response.head.version,action_id:body.action_id,kind:response.kind}
   this.write(owner,response.head,cursor)
   if(operation==='action')this.db.run('INSERT INTO journal VALUES(?,?,?,?,?)',id,cursor,body.action_id,response.kind,JSON.stringify(event))
   this.db.run('INSERT INTO receipts VALUES(?,?,?,?)',owner,receiptId,hash,JSON.stringify(result))
   this.db.run('DELETE FROM prepared_actions WHERE owner=? AND session=?',owner,id)
   return result
  })
 }
}
