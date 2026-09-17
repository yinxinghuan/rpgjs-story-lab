import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync,mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {PreflightStorage} from '../server/preflight-storage'
import {oldStreetSessionHttp} from '../src/old-street-session'
import {oldStreetNewJourneyOptions} from '../src/old-street-runtime-contract'

// Deliberately load the same opaque bundled module as the deployed Worker.
// Run after build:worker; no model/media network requests are permitted here.
test('compiled Worker and default client enroll the full trail without changing older or pending journeys',async()=>{
 const worker=await import('data:text/javascript;base64,'+Buffer.from(readFileSync('worker/index.js')).toString('base64'))
 const dir=mkdtempSync(join(tmpdir(),'campaign-release-')),db=new PreflightStorage(dir),objects=new Map<string,any>()
 let modelCalls=0,dropEnrollment=false
 const env={CARRIAGE_JOURNEYS:{idFromName:(id:string)=>id,get:(id:string)=>({fetch:(request:Request)=>{
  let authority=objects.get(id)
  if(!authority){authority=new worker.CarriageJourneyAuthority(db.context(id),undefined,async()=>{modelCalls++;throw Error('ENROLLMENT_MUST_NOT_GENERATE')});objects.set(id,authority)}
  return authority.fetch(request)
 }})}}
 const values=new Map<string,string>()
 const storage:Storage={get length(){return values.size},key:i=>[...values.keys()][i]??null,getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,String(v))},removeItem:k=>{values.delete(k)},clear:()=>values.clear()}
 const request:typeof fetch=async(input,init)=>{
  const path=String(input).replace('/release-test','')
  const response=await worker.handleApi(new Request('https://worker.invalid'+path,init),env)
  if(dropEnrollment&&path.endsWith('/sessions')&&init?.method==='POST'){dropEnrollment=false;throw Error('SYNTHETIC_LOST_ENROLLMENT_RESPONSE')}
  return response
 }
 const connection=()=>oldStreetSessionHttp(storage,async(_name,work)=>work(),request,'/release-test')
 const restart=()=>{objects.clear();db.close()}
 const options=oldStreetNewJourneyOptions('cloud',false,undefined)
 assert.deepEqual(options,{campaign:'letter-trail-v4'})
 try{
  const old=await connection().client.enroll('en')
  assert.equal(old.campaign,undefined)
  restart()
  const resumed=await connection().client.enroll('zh',false,options)
  assert.deepEqual(resumed,old,'new release must resume the old journey unchanged')
  const fresh=await connection().client.enroll('en',true,options)
  assert.notEqual(fresh.id,old.id)
  assert.equal(fresh.campaign?.photoSource,'roof-negative-v1')
  assert.equal(fresh.save.finale?.status==='complete',false)
  const caps=await connection().api('/sessions/'+fresh.id+'/expansion-capabilities')
  assert.deepEqual(caps,{planning:true,media:true,campaign:true})
  restart()
  assert.deepEqual(await connection().client.enroll('zh',false,options),fresh)
  assert.deepEqual(await connection().api('/sessions/'+old.id),old)
  dropEnrollment=true
  await assert.rejects(connection().client.enroll('en',true,options))
  restart()
  // A changed default/locale after a lost response must not change the request.
  const recovered=await connection().client.enroll('zh',false)
  assert.notEqual(recovered.id,fresh.id)
  assert.equal(recovered.save.locale,'en')
  assert.equal(recovered.campaign?.photoSource,'roof-negative-v1')
  const directory=await connection().api('/sessions')
  assert.equal(directory.sessions.length,3,'the lost response must not duplicate enrollment')
  assert.equal(modelCalls,0,'opening/resuming a game must not request generation')
 }finally{objects.clear();db.close();rmSync(dir,{recursive:true,force:true})}
})
