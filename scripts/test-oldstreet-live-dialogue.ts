import assert from 'node:assert/strict'
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
 for(const input of ['家里托我来拿那封信，我已经到这里了，接下来该找什么？','那把钥匙借给我以后，我该怎么处理它？','你记得我刚才问了什么吗？']){
  const before=structuredClone(head),used=models.usage().used,started=Date.now()
  try{
   const {action,...base}=actionBody(head,'oldstreet:greet-watchmaker')
   const body={...base,type:'dialogue',text:input},result=await service.action(owner,head.id,body)
   head=result.head
   const {blocks,...afterState}=head.save,{blocks:priorBlocks,...priorState}=before.save
   assert.deepEqual(afterState,priorState);assert.equal(blocks.length,priorBlocks.length+2)
   assert.deepEqual(await service.action(owner,head.id,body),result)
   report.cases.push({input,reply:result.text,source:result.source,pass:true,semanticReviewRequired:true,requests:models.usage().used-used,elapsedMs:Date.now()-started,stateUnchanged:true,receiptReused:true})
  }catch(e){report.cases.push({input,error:(e as Error).message,pass:false,requests:models.usage().used-used,elapsedMs:Date.now()-started})}
  persist();console.log(JSON.stringify(report.cases.at(-1)))
 }

 if(report.cases.some(c=>!c.pass))process.exitCode=1
}finally{persist();raw.close()}
