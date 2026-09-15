import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import type {AuthorityStorage} from '../server/session-authority'
import {OldStreetAuthority} from '../server/old-street-runtime'
import {OldStreetExpansionMedia,expansionPhotoProducer} from '../server/old-street-expansion-media'
import {compileExpansionPlan} from '../src/old-street-expansion-plan'

const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const png=new Uint8Array(PNG.sync.write({width:768,height:576,data:Buffer.alloc(768*576*4,90)}))
function storage(raw:DatabaseSync):AuthorityStorage{return {all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN IMMEDIATE');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}}
test('expansion photo resumes the same platform task after disk reopen while the story remains independent',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'expansion-photo-')),path=join(dir,'test.sqlite');let raw=new DatabaseSync(path),db=storage(raw),now=10000
 const h=new OldStreetAuthority(db,()=>true).create('synthetic',crypto.randomUUID(),'zh')
 h.expansions=[{version:1,id:crypto.randomUUID(),template:'photo-darkroom-v1',sourceScene:'photo',input:'旧街的照片',status:'requested',requestedAtVersion:1}];h.save.facts['darkroom-ready']=true
 const plan=compileExpansionPlan(h.expansions[0],{title:'暗房',discovery:'旧街的照片。',photograph:'An empty old street with a clock and a bridge.'})
 const head=(owner:string)=>{assert.equal(owner,'synthetic');return structuredClone(h)}
 let media=new OldStreetExpansionMedia(db,head,()=>plan,()=>now),submissions=0,downloads=0,requestId=''
 const produce=expansionPhotoProducer(async(input,init)=>{
  const url=String(input)
  if(url.includes('/v1/')){
   if(url.endsWith('generations')){submissions++;requestId=JSON.parse(String(init!.body)).request_id}
   return Response.json({request_id:requestId,task_id:'synthetic-photo',status:'succeeded',media:{type:'image',url:'https://cdn.aiwaves.tech/photo.png',format:'png',width:768,height:576}})
  }
  downloads++;return downloads===1?new Response('',{status:503}):new Response(png)
 })
 try{
  const before=structuredClone(h);media.start('synthetic',h.id)
  await media.run('synthetic',h.id,produce)
  assert.equal(media.get('synthetic',h.id)?.state,'failed');assert.equal(submissions,1)
  raw.close();raw=new DatabaseSync(path);db=storage(raw);now+=9000
  media=new OldStreetExpansionMedia(db,head,()=>plan,()=>now)
  // Walking away is unrelated to the media task; retry must not mint another image.
  h.sceneId='street';media.start('synthetic',h.id,true)
  await media.run('synthetic',h.id,produce)
  assert.equal(submissions,1);assert.equal(downloads,2);assert.equal(media.get('synthetic',h.id)?.state,'candidate')
  assert.equal(media.get('synthetic',h.id)?.attempt,1);assert.deepEqual(await media.file('synthetic',h.id),png)
  assert.deepEqual(h.save,before.save);assert.deepEqual(h.expansions,before.expansions)
  raw.close();raw=new DatabaseSync(path);media=new OldStreetExpansionMedia(storage(raw),head,()=>plan,()=>now)
  assert.deepEqual(await media.file('synthetic',h.id),png)
 }finally{raw.close();rmSync(dir,{recursive:true,force:true})}
})
