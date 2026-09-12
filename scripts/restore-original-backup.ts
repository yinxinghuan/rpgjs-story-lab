/** Offline disaster-recovery drill only; never writes to the production Worker. */
import {openSync,closeSync,readFileSync,statSync,unlinkSync} from 'node:fs'
import {DatabaseSync} from 'node:sqlite'
import {OriginalTrainAuthority} from '../server/original-train-runtime'
import {OriginalIllustrations} from '../server/original-illustration'
import type {AuthorityStorage} from '../server/session-authority'
import {MAX_ORIGINAL_BACKUP_BYTES,validateOriginalBackup,restoreOriginalJourneyToEmptyDatabase} from '../server/original-backup'
const [input,output]=process.argv.slice(2)
if(!input||!output)throw Error('Usage: node --import tsx scripts/restore-original-backup.ts private-backup.json new-original.sqlite')
if(statSync(input).size>MAX_ORIGINAL_BACKUP_BYTES+1024)throw Error('BACKUP_TOO_LARGE')
const archive=JSON.parse(readFileSync(input,'utf8'));await validateOriginalBackup(archive)
closeSync(openSync(output,'wx',0o600))
const raw=new DatabaseSync(output),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
try{
 const authority=new OriginalTrainAuthority(db);new OriginalIllustrations(db,(owner,id)=>authority.get(owner,id))
 const result=await restoreOriginalJourneyToEmptyDatabase(db,archive)
 raw.close();console.log(JSON.stringify({ok:true,...result,mode:'offline-empty-database',containsCapability:false}))
}catch(e){raw.close();unlinkSync(output);throw e}
