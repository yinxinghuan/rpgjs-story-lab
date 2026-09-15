import assert from 'node:assert/strict'
import {resolveOldStreetInput} from '../src/old-street-action-input'
import {createOldStreetDialogueGenerator} from '../server/old-street-dialogue'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {writeFileSync} from 'node:fs'
import {OldStreetAuthority,type OldStreetHead} from '../server/old-street-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
import {originalPreflightModels} from '../server/original-preflight-model'
if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const output=process.argv[2];if(!output)throw Error('REPORT_PATH_REQUIRED')
const raw=new DatabaseSync(':memory:')
const db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const v=work();raw.exec('COMMIT');return v}catch(e){raw.exec('ROLLBACK');throw e}}}
const models=originalPreflightModels('6')!,service=new OldStreetAuthority(db,()=>true,models.interpreter,createOldStreetDialogueGenerator(models.request)),owner='synthetic-live-trial'
const report:{cases:any[];usage:unknown;scope:string}={cases:[],usage:models.usage(),scope:'New synthetic in-memory journey only. No real player/account/save data. At most six upstream requests.'}
const persist=()=>{report.usage=models.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
function actionBody(h:OldStreetHead,action:string){const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,type:'action',action}}
try{
 let head=service.create(owner,randomUUID(),'zh')
 for(const scene of ['photo','roof','shed'])head=(await service.action(owner,head.id,actionBody(head,oldStreetDoors().find(d=>d.room===head.sceneId&&d.destination.room===scene)!.actionId))).head
 head=(await service.action(owner,head.id,actionBody(head,'oldstreet:greet-watchmaker'))).head
 for(const step of [
  {type:'free-input',input:'我现在从你这里暂领打开寄信小格的那件工具。',item:true},
  {type:'free-input',input:'我现在把开寄信小格用的那件工具交回你手里。',item:false},
  {type:'dialogue',input:'以后我有东西坏了，还能来请你帮忙吗？',item:false},
 ]){
  const before=structuredClone(head),used=models.usage().used,started=Date.now()
  try{
   const {action,...base}=actionBody(head,'oldstreet:greet-watchmaker')
   if(step.type==='free-input')assert.equal(resolveOldStreetInput(step.input,'zh',oldStreetSpatialPlan(head.save).entities.find(e=>e.id==='watchmaker')!.actions),undefined,'probe must exercise real interpretation')
   const body={...base,type:step.type,text:step.input},result=await service.action(owner,head.id,body)
   head=result.head
   assert.equal(result.accepted,true);assert.equal(head.version,before.version+1)
   assert.equal(head.save.inventory.some(i=>i.id==='letter-key'&&i.count>0),step.item)
   if(step.type==='dialogue'){
    const {blocks,...state}=head.save,{blocks:prior,...old}=before.save
    assert.deepEqual(state,old);assert.equal(blocks.length,prior.length+2)
   }
   assert.deepEqual(await service.action(owner,head.id,body),result)
   const usedAfter=models.usage().used
   assert.equal(usedAfter-used,2,'one real generation and review, replay has no extra requests')
   if(!step.item)assert.equal(head.save.relationships.filter(r=>r.characterId==='zhou-watchmaker'&&r.axis==='kept-promise').length,1)
   report.cases.push({input:step.input,type:step.type,reply:result.text,pass:true,requests:usedAfter-used,elapsedMs:Date.now()-started,receiptReused:true,hasKey:step.item,relationships:head.save.relationships})
  }catch(e){report.cases.push({input:step.input,error:(e as Error).message,pass:false,requests:models.usage().used-used,elapsedMs:Date.now()-started});persist();break}
  persist();console.log(JSON.stringify(report.cases.at(-1)))
 }

 if(report.cases.some(c=>!c.pass))process.exitCode=1
}finally{persist();raw.close()}
