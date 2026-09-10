import type {AuthorityStorage} from './production-authority'
import {GAME_ID} from '../src/game-id'
import {supportsJourneyMap,assertReadableJourney} from '../src/journey-compatibility'
import {LabError,type Head} from '../src/journey-runtime'
type JourneyRow={id:string;owner:string;enrollment:string;enrollment_digest:string;data:string;cursor:number;updated:number}
type JournalRow={session:string;cursor:number;action:string;kind:string;event:string}
type ReceiptRow={owner:string;action:string;digest:string;response:string}
export type JourneyBackup={format:'carriage-journey-backup-v1';gameId:string;mapVersion:string;createdAt:string;journey:JourneyRow;journal:JournalRow[];receipts:ReceiptRow[]}
export type BackupEnvelope={payload:JourneyBackup;sha256:string}
export const MAX_BACKUP_BYTES=8*1024*1024
const canonical=(value:any):any=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(k=>[k,canonical(value[k])])):value
export async function checksum(payload:JourneyBackup){const bytes=new TextEncoder().encode(JSON.stringify(canonical(payload)));if(bytes.length>MAX_BACKUP_BYTES)throw new LabError('BACKUP_TOO_LARGE',413);return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(b=>b.toString(16).padStart(2,'0')).join('')}
// The checksum detects corruption. It is NOT a signature or permission to import client state.
export async function exportJourney(db:AuthorityStorage,owner:string,id:string):Promise<BackupEnvelope>{
 const payload=db.transaction(()=>{
  const journey=db.all<JourneyRow>('SELECT * FROM journeys WHERE owner=? AND id=?',owner,id)[0];if(!journey)throw new LabError('SESSION_NOT_FOUND',404)
  const stats=db.all<{n:number;size:number}>('SELECT COUNT(*) AS n, COALESCE(SUM(length(r.response)+length(r.digest)+length(j.event)),0) AS size FROM journal j JOIN receipts r ON r.action=j.action AND r.owner=? WHERE j.session=?',owner,id)[0]
  if(stats.n>10000||stats.size+journey.data.length>MAX_BACKUP_BYTES/4)throw new LabError('BACKUP_TOO_LARGE',413)
  const head=JSON.parse(journey.data) as Head
  assertReadableJourney(head)
  return {format:'carriage-journey-backup-v1' as const,gameId:GAME_ID,mapVersion:head.mapVersion,createdAt:new Date().toISOString(),journey,journal:db.all<JournalRow>('SELECT * FROM journal WHERE session=? ORDER BY cursor',id),receipts:db.all<ReceiptRow>('SELECT r.* FROM receipts r JOIN journal j ON j.action=r.action WHERE r.owner=? AND j.session=? ORDER BY j.cursor',owner,id)}
 })
 return {payload,sha256:await checksum(payload)}
}
function requireValue(ok:unknown){if(!ok)throw new LabError('INVALID_BACKUP')}
export async function validateBackup(value:unknown):Promise<JourneyBackup>{
 const envelope=value as BackupEnvelope,p=envelope?.payload
 requireValue(p?.format==='carriage-journey-backup-v1'&&p.gameId===GAME_ID&&supportsJourneyMap(p.mapVersion))
 requireValue(typeof envelope.sha256==='string'&&envelope.sha256===await checksum(p))
 const j=p.journey,head=JSON.parse(j.data) as Head
 requireValue(/^[a-f0-9]{64}$/.test(j.owner)&&/^[a-zA-Z0-9-]{16,80}$/.test(j.id)&&/^[a-zA-Z0-9-]{16,80}$/.test(j.enrollment))
 requireValue(head.id===j.id&&head.mapVersion===p.mapVersion&&Number.isSafeInteger(j.cursor)&&j.cursor>=0&&head.version===j.cursor&&Number.isFinite(j.updated))
 try{assertReadableJourney(head)}catch{throw new LabError('INVALID_BACKUP')}
 const enrollment=JSON.parse(j.enrollment_digest);requireValue(['en','zh'].includes(enrollment.locale)&&head.save?.facts&&Array.isArray(head.save.blocks)&&Array.isArray(head.save.inventory))
 requireValue(Array.isArray(p.journal)&&Array.isArray(p.receipts)&&p.journal.length===j.cursor&&p.receipts.length===j.cursor)
 const actions=new Set<string>()
 for(let i=0;i<p.journal.length;i++){
  const event=p.journal[i],receipt=p.receipts[i],e=JSON.parse(event.event),r=JSON.parse(receipt.response),d=JSON.parse(receipt.digest)
  requireValue(event.session===j.id&&event.cursor===i+1&&!actions.has(event.action)&&/^[a-zA-Z0-9-]{16,80}$/.test(event.action));actions.add(event.action)
  requireValue(e.cursor===event.cursor&&e.version===event.cursor&&e.action_id===event.action&&e.kind===event.kind)
  requireValue(receipt.owner===j.owner&&receipt.action===event.action&&d.id===j.id&&d.body?.action_id===event.action&&d.body.expected_version===i)
  requireValue(r.cursor===event.cursor&&r.head?.id===j.id&&r.head.version===event.cursor&&r.kind===event.kind)
 }
 return p
}
// Offline operator tool only: deliberately not exposed by the Worker HTTP router.
export async function restoreJourneyToEmptyDatabase(db:AuthorityStorage,value:unknown){
 const p=await validateBackup(value),j=p.journey
 return db.transaction(()=>{
  for(const table of ['journeys','journal','receipts'])if(db.all<{n:number}>('SELECT COUNT(*) AS n FROM '+table)[0].n!==0)throw new LabError('RESTORE_TARGET_NOT_EMPTY',409)
  db.run('INSERT INTO journeys VALUES(?,?,?,?,?,?,?)',j.id,j.owner,j.enrollment,j.enrollment_digest,j.data,j.cursor,j.updated)
  for(const e of p.journal)db.run('INSERT INTO journal VALUES(?,?,?,?,?)',e.session,e.cursor,e.action,e.kind,e.event)
  for(const r of p.receipts)db.run('INSERT INTO receipts VALUES(?,?,?,?)',r.owner,r.action,r.digest,r.response)
  return {version:j.cursor,events:p.journal.length,receipts:p.receipts.length}
 })
}
