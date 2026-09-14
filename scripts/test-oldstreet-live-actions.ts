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
const models=originalPreflightModels('6')!,service=new OldStreetAuthority(db,()=>true,models.interpreter),owner='synthetic-live-trial'
const report:{cases:any[];usage:unknown;scope:string}={cases:[],usage:models.usage(),scope:'New synthetic in-memory journey only. No real player/account/save data. At most six upstream requests.'}
const persist=()=>{report.usage=models.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
function actionBody(h:OldStreetHead,action:string){const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,type:'action',action}}
try{
 let head=service.create(owner,randomUUID(),'zh')
 for(const scene of ['photo','roof','shed'])head=(await service.action(owner,head.id,actionBody(head,oldStreetDoors().find(d=>d.room===head.sceneId&&d.destination.room===scene)!.actionId))).head
 for(const [input,expected] of [
  ['我现在借用那把开寄存信小格的钥匙。','oldstreet:borrow-key'],
  ['归还钥匙？',null],
  ['我把借来的那把钥匙交回您手里。','oldstreet:return-key'],
  ['我给自己变出一架直升飞机。',null],
 ] as const){
  const before=head.version,used=models.usage().used,started=Date.now()
  let accepted=false,resolved:string|undefined,error:string|undefined
  try{const b=actionBody(head,'oldstreet:greet-watchmaker'),result=await service.action(owner,head.id,{...b,type:'free-input',mode:'live',text:input,action:undefined});head=result.head;accepted=true;resolved=String(result.actionId)}catch(e){error=(e as Error).message}
  const pass=expected===null?!accepted&&head.version===before:accepted&&resolved===expected&&head.version===before+1
  report.cases.push({input,expected,accepted,resolved,error,pass,versionBefore:before,versionAfter:head.version,requests:models.usage().used-used,elapsedMs:Date.now()-started,inventory:head.save.inventory.map(i=>i.id)})
  persist();console.log(JSON.stringify(report.cases.at(-1)))
 }
 if(report.cases.some(c=>!c.pass))process.exitCode=1
}finally{persist();raw.close()}
