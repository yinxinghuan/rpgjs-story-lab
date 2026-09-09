import {initialStory,type Locale} from '../src/story'
import {MAP_VERSION,safePosition,currentScene} from '../src/contract'
import {LabError,prepareAction,validateAction,type Head,type Narrator} from '../src/journey-runtime'
import {upgradeHead} from './head-migration'
import {exportJourney} from './journey-backup'
export interface AuthorityStorage{
 all<T>(sql:string,...bindings:any[]):T[]
 run(sql:string,...bindings:any[]):void
 transaction<T>(work:()=>T):T
}
const validId=(id:unknown)=>typeof id==='string'&&/^[a-zA-Z0-9-]{16,80}$/.test(id)
const wire=<T>(v:T):T=>JSON.parse(JSON.stringify(v))
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
const digest=(v:unknown)=>JSON.stringify(canonical(v))
type Row={data:string;cursor:number}
export class ProductionAuthority{
 constructor(private db:AuthorityStorage,private narrator:Narrator){
  db.run('CREATE TABLE IF NOT EXISTS journeys(id TEXT PRIMARY KEY, owner TEXT NOT NULL, enrollment TEXT NOT NULL, enrollment_digest TEXT NOT NULL, data TEXT NOT NULL, cursor INTEGER NOT NULL DEFAULT 0, updated INTEGER NOT NULL, UNIQUE(owner,enrollment))')
  db.run('CREATE TABLE IF NOT EXISTS receipts(owner TEXT NOT NULL, action TEXT NOT NULL, digest TEXT NOT NULL, response TEXT NOT NULL, PRIMARY KEY(owner,action))')
  db.run('CREATE TABLE IF NOT EXISTS journal(session TEXT NOT NULL, cursor INTEGER NOT NULL, action TEXT NOT NULL, kind TEXT NOT NULL, event TEXT NOT NULL, PRIMARY KEY(session,cursor))')
 }
 backup(owner:string,id:string){return exportJourney(this.db,owner,id)}
 private row(owner:string,id:string){const row=this.db.all<Row>('SELECT data,cursor FROM journeys WHERE owner=? AND id=?',owner,id)[0];if(!row)throw new LabError('SESSION_NOT_FOUND',404);return row}
 private write(owner:string,h:Head,cursor:number){this.db.run('UPDATE journeys SET data=?,cursor=?,updated=? WHERE owner=? AND id=?',JSON.stringify(h),cursor,Date.now(),owner,h.id)}
 get(owner:string,id:string){return this.db.transaction(()=>{const row=this.row(owner,id),head=upgradeHead(JSON.parse(row.data));if(JSON.stringify(head)!==row.data)this.write(owner,head,row.cursor);return head})}
 create(owner:string,enrollment:string,locale:Locale){
  if(!validId(enrollment))throw new LabError('INVALID_ENROLLMENT')
  const hash=digest({locale})
  return this.db.transaction(()=>{
   const old=this.db.all<{id:string;enrollment_digest:string}>('SELECT id,enrollment_digest FROM journeys WHERE owner=? AND enrollment=?',owner,enrollment)[0]
   if(old){if(old.enrollment_digest!==hash)throw new LabError('ENROLLMENT_ID_CONFLICT',409);return upgradeHead(JSON.parse(this.row(owner,old.id).data))}
   const count=this.db.all<{n:number}>('SELECT COUNT(*) AS n FROM journeys WHERE owner=?',owner)[0].n
   if(count>=100)throw new LabError('SESSION_LIMIT',429)
   const head:Head=wire({id:crypto.randomUUID(),version:0,save:initialStory(locale),position:safePosition(null),mapVersion:MAP_VERSION})
   this.db.run('INSERT INTO journeys VALUES(?,?,?,?,?,?,?)',head.id,owner,enrollment,hash,JSON.stringify(head),0,Date.now());return head
  })
 }
 directory(owner:string){return this.db.all<{id:string;data:string;cursor:number;updated:number}>('SELECT id,data,cursor,updated FROM journeys WHERE owner=? ORDER BY updated DESC LIMIT 100',owner).map(r=>{const h=JSON.parse(r.data) as Head;return {id:r.id,version:h.version,cursor:r.cursor,scene:currentScene(h.save),updated:r.updated}})}
 events(owner:string,id:string,after:number){this.row(owner,id);if(!Number.isSafeInteger(after)||after<0)throw new LabError('INVALID_CURSOR');return this.db.all<{event:string}>('SELECT event FROM journal WHERE session=? AND cursor>? ORDER BY cursor LIMIT 100',id,after).map(r=>JSON.parse(r.event))}
 checkpoint(owner:string,id:string,body:any){return this.db.transaction(()=>{
  const row=this.row(owner,id),head=upgradeHead(JSON.parse(row.data))
  if(body.sceneId!==currentScene(head.save)||body.expected_version!==head.version)throw new LabError('STALE_POSITION',409)
  const position=safePosition(body.position,currentScene(head.save))
  if(!body.position||position.x!==body.position.x||position.y!==body.position.y)throw new LabError('INVALID_POSITION')
  head.position=position;this.write(owner,head,row.cursor);return {position}
 })}
 private replay(owner:string,action:string,hash:string){const r=this.db.all<{digest:string;response:string}>('SELECT digest,response FROM receipts WHERE owner=? AND action=?',owner,action)[0];if(!r)return null;if(r.digest!==hash)throw new LabError('ACTION_ID_CONFLICT',409);return JSON.parse(r.response)}
 async action(owner:string,id:string,body:any){
  validateAction(body);const hash=digest({id,body}),cached=this.replay(owner,body.action_id,hash);if(cached)return cached
  const head=this.get(owner,id),response=await prepareAction(head,body,this.narrator)
  // No network await inside transactionSync. Recheck after narrator yields.
  return this.db.transaction(()=>{
   const raced=this.replay(owner,body.action_id,hash);if(raced)return raced
   const row=this.row(owner,id),current=JSON.parse(row.data) as Head
   if(current.version!==head.version)throw new LabError('VERSION_CONFLICT',409)
   const cursor=row.cursor+1,result=wire({...response,cursor}),event={cursor,version:response.head.version,action_id:body.action_id,kind:response.kind}
   this.write(owner,response.head,cursor)
   this.db.run('INSERT INTO journal VALUES(?,?,?,?,?)',id,cursor,body.action_id,response.kind,JSON.stringify(event))
   this.db.run('INSERT INTO receipts VALUES(?,?,?,?)',owner,body.action_id,hash,JSON.stringify(result))
   return result
  })
 }
}
