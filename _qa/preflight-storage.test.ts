import test from 'node:test'
import assert from 'node:assert/strict'
import {mkdtempSync,readdirSync,rmSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {PreflightStorage} from '../server/preflight-storage'

test('preflight persistence isolates cartridge object names and rolls back interrupted work across reopen',()=>{
 const dir=mkdtempSync(join(tmpdir(),'preflight-storage-')),store=new PreflightStorage(dir)
 try{
  for(const [name,value] of [['synthetic-owner',10],['original-v8:synthetic-owner',8]] as const){
   const {storage}=store.context(name)
   storage.sql.exec('CREATE TABLE sample (value INTEGER)')
   storage.transactionSync(()=>storage.sql.exec('INSERT INTO sample VALUES (?)',value))
   assert.throws(()=>storage.transactionSync(()=>{storage.sql.exec('UPDATE sample SET value=99');throw Error('interrupted')}),/interrupted/)
  }
  store.close()
  assert.equal(store.context('synthetic-owner').storage.sql.exec('SELECT value FROM sample').toArray()[0].value,10)
  assert.equal(store.context('original-v8:synthetic-owner').storage.sql.exec('SELECT value FROM sample').toArray()[0].value,8)
  assert.ok(readdirSync(dir).every(name=>/^[a-f0-9]{64}\.sqlite$/.test(name)))
 }finally{store.close();rmSync(dir,{recursive:true,force:true})}
})
test('preflight stays in memory without explicit directory and refuses unusable persistence paths',()=>{
 const store=new PreflightStorage(),dir=mkdtempSync(join(tmpdir(),'preflight-path-'))
 try{
  store.context('synthetic-owner').storage.sql.exec('CREATE TABLE sample (value INTEGER)');store.close()
  assert.throws(()=>store.context('synthetic-owner').storage.sql.exec('SELECT * FROM sample'),/no such table/)
  const path=join(dir,'file');writeFileSync(path,'synthetic')
  assert.throws(()=>new PreflightStorage(path))
 }finally{store.close();rmSync(dir,{recursive:true,force:true})}
})
