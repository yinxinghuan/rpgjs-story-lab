import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OldStreetAuthority} from '../server/old-street-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import {oldStreetTalkTopics} from '../src/old-street-conversation'
import {oldStreetDialogueContext} from '../server/old-street-dialogue'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {recordOldStreetInteraction} from '../src/old-street-characters'
for(const locale of ['zh','en'] as const)test(`${locale}: unlocked compartment guidance and remembered promise survive authority replay`,async()=>{
 const raw=new DatabaseSync(':memory:')
 const db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const result=work();raw.exec('COMMIT');return result}catch(e){raw.exec('ROLLBACK');throw e}}}
 const s=new OldStreetAuthority(db,()=>true)
 try{
  let h=s.create('synthetic-owner',randomUUID(),locale)
  const request=(action:string)=>{const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;assert.ok(e,action);return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.id==='watchmaker'?{x:e.approach.x+(locale==='zh'?24:-24),y:e.approach.y}:e.approach,type:'action',action}}
  for(const step of ['photo','roof','shed','oldstreet:borrow-key','oldstreet:lift-latch','yard','shop','oldstreet:unlock-letter','yard','shed']){
   const action=step.startsWith('oldstreet:')?step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId
   h=(await s.action('synthetic-owner',h.id,request(action))).head
  }
  assert.ok(!oldStreetTalkTopics(h.save,'watchmaker').some(t=>t.id==='kept-promise'))
  const body=request('oldstreet:return-key'),returned=await s.action('synthetic-owner',h.id,body);h=returned.head
  assert.deepEqual(await s.action('synthetic-owner',h.id,body),returned)
  assert.equal(h.save.relationships.filter(r=>r.axis==='kept-promise').length,1)
  h=new OldStreetAuthority(db,()=>true).get('synthetic-owner',h.id)
  const topics=oldStreetTalkTopics(h.save,'watchmaker'),route=topics.find(t=>t.id==='letter')!
  assert.match(route.reply,locale==='zh'?/已经打开/:/already open/)
  assert.doesNotMatch(route.reply,locale==='zh'?/借给|拿着钥匙/:/borrow|Take the key/)
  const followup=topics.find(t=>t.id==='kept-promise')!;assert.ok(followup)
  assert.ok(oldStreetDialogueContext(h,'watchmaker').knowledge.some(k=>k.id===followup.id&&k.text===followup.reply))
  const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.id==='watchmaker')!
  h=(await s.action('synthetic-owner',h.id,{action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.id==='watchmaker'?{x:e.approach.x+(locale==='zh'?24:-24),y:e.approach.y}:e.approach,type:'dialogue',text:followup.text})).head
  assert.equal(h.save.blocks.at(-1)?.text,followup.reply)
  h=(await s.action('synthetic-owner',h.id,request('oldstreet:greet-watchmaker'))).head
  assert.match(h.save.blocks.at(-1)!.text,locale==='zh'?/已经打开/:/already open/)
  h=(await s.action('synthetic-owner',h.id,request('oldstreet:borrow-key'))).head
  assert.ok(!oldStreetTalkTopics(h.save,'watchmaker').some(t=>t.id==='kept-promise'))
 }finally{raw.close()}
})
test('neighbour follow-ups require both an introduced person and their own completed help',()=>{
 for(const [entity,action,fact,topic] of [['laundry-owner','return-clock','clock-returned','returned-clock'],['photographer','return-photos','photos-returned','returned-photos']]){
  const save=createInitialSave(oldStreetCartridge('zh'));save.facts[fact]=true
  assert.equal(oldStreetTalkTopics(save,entity).length,0)
  recordOldStreetInteraction(save,entity,'greeting','你好','intro')
  assert.ok(!oldStreetTalkTopics(save,entity).some(t=>t.id===topic))
  recordOldStreetInteraction(save,entity,'oldstreet:'+action,'已归还','return')
  assert.ok(oldStreetTalkTopics(save,entity).some(t=>t.id===topic))
  save.facts[fact]=false
  assert.ok(!oldStreetTalkTopics(save,entity).some(t=>t.id===topic))
 }
})
