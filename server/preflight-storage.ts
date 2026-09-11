import {DatabaseSync} from 'node:sqlite'
import {createHash} from 'node:crypto'
import {mkdirSync} from 'node:fs'
import {join,resolve} from 'node:path'

/** Local substitute for each Durable Object's private SQLite. Persistence is
 * opt-in and used only by loopback preflight; production still uses its DO. */
export class PreflightStorage {
 private databases=new Map<string,DatabaseSync>()
 private directory?:string
 constructor(directory?:string){
  if(directory){this.directory=resolve(directory);mkdirSync(this.directory,{recursive:true,mode:0o700})}
 }
 context(objectName:string){
  let db=this.databases.get(objectName)
  if(!db){
   const name=createHash('sha256').update(objectName).digest('hex')+'.sqlite'
   db=new DatabaseSync(this.directory?join(this.directory,name):':memory:')
   db.exec('PRAGMA busy_timeout=5000')
   this.databases.set(objectName,db)
  }
  const raw=db
  return {storage:{
   sql:{exec:(q:string,...bindings:any[])=>{
    bindings=bindings.map(v=>v instanceof ArrayBuffer?new Uint8Array(v):v)
    const stmt=raw.prepare(q),rows=stmt.columns().length?stmt.all(...bindings):(stmt.run(...bindings),[])
    return {toArray:()=>rows}
   }},
   transactionSync:<T>(work:()=>T):T=>{
    raw.exec('BEGIN IMMEDIATE')
    try{const result=work();raw.exec('COMMIT');return result}catch(error){raw.exec('ROLLBACK');throw error}
   },
  }}
 }
 close(){for(const db of this.databases.values())db.close();this.databases.clear()}
}
