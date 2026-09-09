/** Offline drill. Never imports a browser file into production or overwrites a database. */
import {openSync,closeSync,readFileSync,statSync,unlinkSync} from 'node:fs'
import {DatabaseSync} from 'node:sqlite'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {MAX_BACKUP_BYTES,restoreJourneyToEmptyDatabase,validateBackup} from '../server/journey-backup'
const [input,output]=process.argv.slice(2)
if(!input||!output)throw Error('Usage: node --import tsx scripts/restore-journey-backup.ts private-backup.json new-database.sqlite')
if(statSync(input).size>MAX_BACKUP_BYTES+1024)throw Error('BACKUP_TOO_LARGE')
const archive=JSON.parse(readFileSync(input,'utf8'));await validateBackup(archive)
const fd=openSync(output,'wx',0o600);closeSync(fd)
const raw=new DatabaseSync(output)
const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
try{
 new ProductionAuthority(db,async()=>{throw Error('OFFLINE_RESTORE_HAS_NO_NARRATOR')})
 const result=await restoreJourneyToEmptyDatabase(db,archive)
 raw.close();console.log(JSON.stringify({ok:true,...result,mode:'offline-empty-database',containsCapability:false}))
}catch(error){raw.close();unlinkSync(output);throw error}
