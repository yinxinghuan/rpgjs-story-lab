import {GAME_ID} from '../src/game-id'
import {LabError} from '../src/journey-runtime'
import {assertOriginalHead} from './original-train-runtime'
import type {AuthorityStorage} from './session-authority'
// Operator recovery format. A checksum is integrity, never authorization to
// import browser-provided state into the running game.
export const MAX_ORIGINAL_BACKUP_BYTES=16*1024*1024
const columns={
 journeys:['id','owner','enrollment','enrollment_digest','data','cursor','updated'],
 journal:['session','cursor','action','kind','event'],
 receipts:['owner','action','digest','response'],
 prepared_actions:['owner','action','session','digest','base','response'],
 narration_usage:['owner','window_start','uses'],
 original_illustrations:['owner','session','scene','data'],
 original_illustration_parts:['owner','session','scene','part','data'],
 original_illustration_usage:['owner','day','uses'],
 original_illustration_attempts:['owner','session','scene','attempt','data'],
 original_illustration_attempt_parts:['owner','session','scene','attempt','part','data'],
} as const
export type OriginalBackupTable=keyof typeof columns
type Row=Record<string,string|number>
export type OriginalBackupPayload={format:'original-train-backup-v1';gameId:string;createdAt:string;owner:string;journeyId:string;tables:Record<OriginalBackupTable,Row[]>}
export type OriginalBackup={payload:OriginalBackupPayload;sha256:string}
const tables=Object.keys(columns) as OriginalBackupTable[]
const canonical=(v:any):any=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v
const invalid=()=>{throw new LabError('INVALID_ORIGINAL_BACKUP')}
export async function originalBackupChecksum(payload:OriginalBackupPayload){const bytes=new TextEncoder().encode(JSON.stringify(canonical(payload)));if(bytes.length>MAX_ORIGINAL_BACKUP_BYTES)throw new LabError('BACKUP_TOO_LARGE',413);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')}
const exists=(db:AuthorityStorage,table:string)=>db.all('SELECT name FROM sqlite_master WHERE type=\'table\' AND name=?',table).length>0
export async function exportOriginalJourney(db:AuthorityStorage,owner:string,id:string):Promise<OriginalBackup>{
 const payload=db.transaction(()=>{
  if(!db.all('SELECT id FROM journeys WHERE owner=? AND id=?',owner,id).length)throw new LabError('SESSION_NOT_FOUND',404)
  const selected={} as Record<OriginalBackupTable,Row[]>;let estimated=0
  for(const table of tables){
   if(!exists(db,table)){selected[table]=[];continue}
   const where=table==='journeys'?'owner=? AND id=?':table==='journal'?'session=?':table==='receipts'?"owner=? AND json_extract(digest,'$.id')=?":table==='narration_usage'||table==='original_illustration_usage'?'owner=?':'owner=? AND session=?'
   const params=table==='journal'?[id]:table==='narration_usage'||table==='original_illustration_usage'?[owner]:[owner,id]
   const size=columns[table].map(c=>'COALESCE(length(CAST('+c+' AS BLOB)),0)').join('+')
   const stat=db.all<{n:number;bytes:number}>('SELECT COUNT(*) AS n, COALESCE(SUM('+size+'),0) AS bytes FROM '+table+' WHERE '+where,...params)[0]
   estimated+=stat.bytes+stat.n*512
   if(stat.n>10000||estimated>MAX_ORIGINAL_BACKUP_BYTES)throw new LabError('BACKUP_TOO_LARGE',413)
   selected[table]=db.all<Row>('SELECT '+columns[table].join(',')+' FROM '+table+' WHERE '+where+' ORDER BY '+(table==='journal'?'cursor':columns[table].join(',')),...params)
  }
  return {format:'original-train-backup-v1' as const,gameId:GAME_ID,createdAt:new Date().toISOString(),owner,journeyId:id,tables:selected}
 })
 const envelope={payload,sha256:await originalBackupChecksum(payload)};await validateOriginalBackup(envelope);return envelope
}
export async function validateOriginalBackup(value:unknown):Promise<OriginalBackupPayload>{
 const v=value as OriginalBackup,p=v?.payload
 if(!v||Object.keys(v).sort().join(',')!=='payload,sha256'||!p||Object.keys(p).sort().join(',')!=='createdAt,format,gameId,journeyId,owner,tables'||p.format!=='original-train-backup-v1'||p.gameId!==GAME_ID||typeof p.createdAt!=='string'||!Number.isFinite(Date.parse(p.createdAt))||!/^[a-f0-9]{64}$/.test(p.owner)||!/^[a-zA-Z0-9-]{16,80}$/.test(p.journeyId)||!p.tables||Object.keys(p.tables).sort().join(',')!==[...tables].sort().join(','))return invalid()
 if(typeof v.sha256!=='string'||v.sha256!==await originalBackupChecksum(p))return invalid()
 for(const table of tables){const rows=p.tables[table];if(!Array.isArray(rows)||rows.length>10000)return invalid()
  for(const r of rows){if(!r||Object.keys(r).sort().join(',')!==[...columns[table]].sort().join(',')||Object.values(r).some(x=>typeof x!=='string'&&(typeof x!=='number'||!Number.isSafeInteger(x)||x<0))||('owner'in r&&r.owner!==p.owner)||('session'in r&&r.session!==p.journeyId))return invalid()}
 }
 for(const table of tables)for(const row of p.tables[table])for(const key of ['cursor','updated','window_start','uses','day','part','attempt'])if(key in row&&(typeof row[key]!=='number'||!Number.isSafeInteger(row[key])||Number(row[key])<0))return invalid()
 const t=p.tables,j=t.journeys[0]
 if(t.journeys.length!==1||j.id!==p.journeyId||typeof j.data!=='string'||typeof j.cursor!=='number'||!Number.isSafeInteger(j.cursor)||j.cursor<0)return invalid()
 try{
  const head=JSON.parse(j.data);assertOriginalHead(head)
  if(head.id!==j.id||![j.cursor,j.cursor+1].includes(head.version)||t.journal.length!==j.cursor||t.receipts.length!==head.version||head.version-j.cursor!==(head.save.finale.status==='complete'?1:0))return invalid()
  const enrollment=JSON.parse(String(j.enrollment_digest));if(enrollment.locale!==head.save.locale||!/^[a-zA-Z0-9-]{16,80}$/.test(String(j.enrollment)))return invalid()
  const versions=new Set<number>(),receipts=new Map<string,Row>();let endingCount=0
  for(const r of t.receipts){const d=JSON.parse(String(r.digest)),result=JSON.parse(String(r.response));assertOriginalHead(result.head)
   const ending=d.operation==='ending',key=ending?'ending:'+d.body?.ending_id:d.body?.action_id
   if(d.id!==j.id||key!==r.action||receipts.has(String(r.action))||!Number.isSafeInteger(d.body?.expected_version)||d.body.expected_version<0||d.body.expected_version>=head.version||versions.has(d.body.expected_version)||result.head.id!==j.id||result.head.version!==d.body.expected_version+1||(ending?result.kind!=='ending'||result.head.save.finale.status!=='complete':result.kind==='ending'))return invalid()
   if(ending){endingCount++;if(result.endingId!==d.body.ending_id||result.snapshotId!==d.body.snapshot_id||result.cursor!==j.cursor||d.body.expected_version!==j.cursor)return invalid()}
   versions.add(d.body.expected_version);receipts.set(String(r.action),r)
  }
  if(endingCount!==head.version-j.cursor)return invalid()
  for(const [i,e]of t.journal.entries()){const event=JSON.parse(String(e.event)),receipt=receipts.get(String(e.action));if(!receipt||e.cursor!==i+1||event.cursor!==i+1||event.action_id!==e.action||event.kind!==e.kind)return invalid();const r=JSON.parse(String(receipt.response));if(r.cursor!==e.cursor||r.kind!==e.kind||event.version!==r.head.version)return invalid()}
  if(t.prepared_actions.length>32||t.narration_usage.length>1)return invalid()
  for(const r of t.prepared_actions){const d=JSON.parse(String(r.digest)),base=JSON.parse(String(r.base)),result=JSON.parse(String(r.response));assertOriginalHead(base);assertOriginalHead(result.head);if(d.id!==j.id||d.body?.action_id!==r.action||d.body.expected_version!==base.version||base.id!==j.id||base.version!==head.version||base.mapVersion!==head.mapVersion||result.head.id!==j.id||result.head.version!==base.version+1||result.accepted!==true||result.kind!=='action'||receipts.has(String(r.action)))return invalid()}
  for(const table of ['original_illustrations','original_illustration_attempts'] as const)for(const r of t[table]){const job=JSON.parse(String(r.data));if(job.plan?.scene!==r.scene||job.plan.request?.sessionId!==GAME_ID||![1,2].includes(job.attempt))return invalid()}
 }catch{return invalid()}
 return p
}
/** Offline, trusted operator only. No HTTP restore route and no account transfer. */
export async function restoreOriginalJourneyToEmptyDatabase(db:AuthorityStorage,value:unknown){
 const p=await validateOriginalBackup(value)
 return db.transaction(()=>{
  for(const table of tables){if(!exists(db,table))throw new LabError('ORIGINAL_RESTORE_SCHEMA_MISSING',409);if(db.all<{n:number}>('SELECT COUNT(*) AS n FROM '+table)[0].n)throw new LabError('RESTORE_TARGET_NOT_EMPTY',409)}
  for(const table of tables)for(const row of p.tables[table])db.run('INSERT INTO '+table+' ('+columns[table].join(',')+') VALUES('+columns[table].map(()=>'?').join(',')+')',...columns[table].map(c=>row[c]))
  return {version:JSON.parse(String(p.tables.journeys[0].data)).version,events:p.tables.journal.length,receipts:p.tables.receipts.length,prepared:p.tables.prepared_actions.length}
 })
}
