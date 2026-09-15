import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OldStreetAuthority,type OldStreetHead} from '../server/old-street-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import {resolveOldStreetInput} from '../src/old-street-action-input'
const utterances:Record<string,[string,string]>={
 'move-box':['把空盒移开','move the empty box'],'take-lens':['拿起放大镜','pick up the magnifying glass'],
 'borrow-trolley':['借用推车','borrow the trolley'],'clear-crates':['搬开箱子','move the crates'],
 'borrow-key':['借一下钥匙','borrow the key'],'lift-latch':['拉开插销','unbolt the courtyard gate'],
 'unlock-letter':['用钥匙打开小格','open the compartment with the key'],'take-letter':['取信','take the letter'],
 'return-key':['还钥匙','return the key'],'return-trolley':['还推车','return the trolley'],
}
for(const locale of ['zh','en'] as const)test(`${locale}: natural input and buttons finish the same exploration route and preserve rejected intents`,async()=>{
 const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(s,...b)=>raw.prepare(s).all(...b) as any,run:(s,...b)=>{raw.prepare(s).run(...b)},transaction:f=>{raw.exec('BEGIN');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 try{
 const authority=new OldStreetAuthority(db,()=>true),heads:OldStreetHead[]=[]
 for(const natural of [false,true]){
 let h=authority.create(natural?'typed':'buttons',randomUUID(),locale),owner=natural?'typed':'buttons'
 const route=['shop','move-box','take-lens','street','yard','laundry','borrow-trolley','yard','clear-crates','cellar','shed','borrow-key','lift-latch','yard','shop','unlock-letter','take-letter','yard','shed','return-key','yard','laundry','return-trolley','yard','street','leave']
 for(const step of route){
  const action=step in utterances||step==='leave'?'oldstreet:'+step:oldStreetDoors().find(d=>d.room===h.sceneId&&d.destination.room===step)!.actionId
  const entity=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!
  const b={action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:entity.id,position:entity.approach,type:'action',action}
  if(natural&&step in utterances){
   const text=utterances[step][locale==='zh'?0:1]
   for(const rejected of locale==='zh'?[text+'吗？','不要'+text,'我已经'+text,text+'然后取信']:[text+'?','Do not '+text,'I already '+text,text+' and then take the letter']){
    await assert.rejects(authority.action(owner,h.id,{...b,action_id:randomUUID(),type:'free-input',text:rejected}),/INPUT_UNSUPPORTED/)
    assert.equal(authority.get(owner,h.id).version,h.version)
   }
   const request={...b,type:'free-input',text},result=await authority.action(owner,h.id,request);assert.deepEqual(await authority.action(owner,h.id,request),result);h=result.head
  }else{
   if(natural&&step==='leave')await assert.rejects(authority.action(owner,h.id,{...b,action_id:randomUUID(),type:'free-input',text:locale==='zh'?'带信回家':'Take the letter home'}),/INPUT_UNSUPPORTED/)
   h=(await authority.action(owner,h.id,b)).head
  }
 }
 heads.push(h)
 }
 assert.deepEqual(heads[0].save.facts,heads[1].save.facts);assert.deepEqual(heads[0].save.inventory,heads[1].save.inventory)
 assert.deepEqual(heads[0].save.relationships.map(r=>[r.characterId,r.axis,r.delta]),heads[1].save.relationships.map(r=>[r.characterId,r.axis,r.delta]))
 assert.equal(heads[1].save.finale.status,'complete');assert.equal(heads[0].version,heads[1].version)
 }finally{raw.close()}
})
test('inspection and archival aliases stay target-bound and cannot bypass permission actions',()=>{
 for(const [action,zh,en] of [['inspect-clock','检查钟底刻记','inspect the clock mark'],['match-photos','对照旧照片','match the photographs'],['return-clock','归还旧钟','return the old clock'],['return-photos','归还照片夹','return the photographs'],['record-clock','记录旧钟的故事','record the clock history'],['withdraw-photo','撤下照片','remove the photo entry']]){
  for(const [locale,input] of [['zh',zh],['en',en]] as const){assert.equal(resolveOldStreetInput(input,locale,['oldstreet:'+action]),'oldstreet:'+action);assert.equal(resolveOldStreetInput(input,locale,['oldstreet:borrow-key']),undefined)}
 }
 assert.equal(resolveOldStreetInput('帮我同意收录旧钟','zh',['oldstreet:consent-clock']),undefined)
})
