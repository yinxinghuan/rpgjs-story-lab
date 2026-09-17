import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {OldStreetAuthority} from '../server/old-street-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetSession} from '../src/old-street-session'
import {oldStreetNewJourneyOptions,OLD_STREET_CAMPAIGN_RELEASED} from '../src/old-street-runtime-contract'
import {oldStreetActionFailureMessage} from '../src/old-street-recovery-message'

function setup(){
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const v=work();raw.exec('COMMIT');return v}catch(e){raw.exec('ROLLBACK');throw e}}}
 const authority=new OldStreetAuthority(db,()=>true,undefined,undefined,()=>undefined,()=>undefined,undefined,async()=>{throw Error('ENROLLMENT_MUST_NOT_GENERATE')})
 const values=new Map<string,string>()
 const storage:Storage={get length(){return values.size},key:i=>[...values.keys()][i]??null,getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,String(v))},removeItem:k=>{values.delete(k)},clear:()=>values.clear()}
 let refusal='',readFailure=false,actions=0
 const request:typeof fetch=async(url,init)=>{
  const path=String(url).split('/api/oldstreet-dev')[1],body=init?.body?JSON.parse(String(init.body)):undefined
  if(path==='/sessions')return Response.json(authority.create('synthetic-campaign-entry',body.enrollment_id,body.locale,body.options))
  if(path.endsWith('/actions')){actions++;return Response.json({error:refusal},{status:409})}
  if(readFailure){readFailure=false;throw Error('SYNTHETIC_HEAD_READ_LOST')}
  return Response.json(authority.get('synthetic-campaign-entry',path.split('/')[2]))
 }
 return {authority,client:()=>oldStreetSession(storage,async(_name,work)=>work(),request).client,close:()=>raw.close(),refuse:(code:string,loseRead=false)=>{refusal=code;readFailure=loseRead},actions:()=>actions}
}

test('normal local campaign entry creates the complete trail, resumes old journeys, and retains new-journey intent',async()=>{
 const s=setup(),options=oldStreetNewJourneyOptions('oldstreet-dev',true,'1')
 try{
  const old=await s.client().enroll('en')
  const resumed=await s.client().enroll('zh',false,options)
  assert.equal(resumed.id,old.id);assert.equal(resumed.campaign,undefined);assert.equal(resumed.save.locale,'en')
  const fresh=await s.client().enroll('en',true,options)
  assert.equal(fresh.campaign?.version,3);assert.equal(fresh.campaign.photoSource,'roof-negative-v1')
  assert.equal(fresh.save.facts['campaign-commission'],'street-memory')
  assert.equal(fresh.save.facts['roof-negative-taken'],false)
  assert.equal(fresh.sceneId,'street')
  assert.match(fresh.save.blocks.find(b=>b.id==='oldstreet-opening')!.text,/sealed letter/)
  assert.equal((await s.client().enroll('en',false,options)).id,fresh.id)
  const again=await s.client().enroll('en',true,options)
  assert.notEqual(again.id,fresh.id);assert.equal(again.campaign?.photoSource,'roof-negative-v1')
  assert.equal(s.authority.get('synthetic-campaign-entry',old.id).campaign,undefined)
  assert.equal(s.authority.get('synthetic-campaign-entry',fresh.id).campaign?.photoSource,'roof-negative-v1')
  assert.equal(OLD_STREET_CAMPAIGN_RELEASED,true)
  for(const mode of ['cloud','cloud-preflight'])assert.deepEqual(oldStreetNewJourneyOptions(mode,false,undefined),options)
  assert.equal(oldStreetNewJourneyOptions('pages',true,'1'),undefined)
  assert.equal(oldStreetNewJourneyOptions('oldstreet-dev',false,'1'),undefined)
 }finally{s.close()}
})

for(const code of ['OLD_STREET_NEGATIVE_REQUIRED','OLD_STREET_TARGET_TOO_FAR'])test(`${code}: confirmed refusal clears pending input; a lost read never retries the rejected mutation`,async()=>{
 const s=setup()
 try{
  const client=s.client(),head=await client.enroll('en',false,oldStreetNewJourneyOptions('oldstreet-dev',true,'1'))
  s.refuse(code,true)
  await assert.rejects(client.send(head,{type:'expansion-request',template:'photo-darkroom-v1',text:'Make a print',position:head.position}),/SYNTHETIC_HEAD_READ_LOST/)
  assert.equal(client.hasPending(),true);assert.equal(s.actions(),1)
  const restored=s.client(),result=await restored.recover()
  assert.equal(result.rejectionCode,code);assert.equal(result.accepted,false)
  assert.equal(restored.hasPending(),false);assert.equal(s.actions(),1)
  assert.equal(result.head.version,head.version);assert.deepEqual(result.head.save,head.save)
  assert.notEqual(oldStreetActionFailureMessage(code,'en'),oldStreetActionFailureMessage('UNKNOWN','en'))
  const next=await restored.enroll('en',true,oldStreetNewJourneyOptions('oldstreet-dev',true,'1'))
  assert.notEqual(next.id,head.id)
 }finally{s.close()}
})
