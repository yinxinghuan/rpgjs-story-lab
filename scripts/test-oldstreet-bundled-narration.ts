import assert from 'node:assert/strict'
import {resolveOldStreetInput} from '../src/old-street-action-input'
import {randomUUID} from 'node:crypto'
import {writeFileSync} from 'node:fs'
import {type OldStreetHead} from '../server/old-street-runtime'
import {oldStreetSpatialPlan,oldStreetDoors} from '../src/old-street-space'
if(process.env.OLDSTREET_LIVE_TRIAL!=='1')throw Error('EXPLICIT_SYNTHETIC_TRIAL_REQUIRED')
const output=process.argv[2];if(!output)throw Error('REPORT_PATH_REQUIRED')
const {readFileSync}=await import('node:fs')
const {PreflightStorage}=await import('../server/preflight-storage')
const {RUNTIME_HEADER,RUNTIME_CONTRACT}=await import('../src/runtime-contract')
const {OLD_STREET_API_PATH,OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT}=await import('../src/old-street-runtime-contract')
const {randomBytes,createHash}=await import('node:crypto')
const bytes=readFileSync('worker/index.js'),bundleHash=createHash('sha256').update(bytes).digest('hex')
const bundled=await import('data:text/javascript;base64,'+bytes.toString('base64'))
const storage=new PreflightStorage(),objects=new Map<string,any>()
const token=randomBytes(32).toString('base64url'),owner='synthetic-bundled-trial'
const nativeFetch=globalThis.fetch
let used=0
// Actual production provider, with an explicit synthetic request ceiling only.
globalThis.fetch=async(input,init)=>{
 if(String(input)==='https://chat.aiwaves.tech/aigram/api/game-chat'){
  if(used>=6)throw Error('SYNTHETIC_BUDGET_EXHAUSTED')
  used++
 }
 return nativeFetch(input,init)
}
const env={CARRIAGE_JOURNEYS:{idFromName:(id:string)=>id,get:(name:string)=>({fetch:(request:Request)=>{
 let instance=objects.get(name)
 if(!instance){instance=new bundled.CarriageJourneyAuthority(storage.context(name));objects.set(name,instance)}
 return instance.fetch(request)
}})}}
const api=async(path:string,body?:unknown)=>{
 const response=await bundled.handleApi(new Request('https://authority.invalid'+OLD_STREET_API_PATH+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+token,'Content-Type':'application/json',[RUNTIME_HEADER]:RUNTIME_CONTRACT,[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT},body:body?JSON.stringify(body):undefined}),env)
 const data=await response.json();if(!response.ok)throw Error(data.error)
 return data
}
const service={create:async(_owner:string,enrollment:string,locale:string)=>api('/sessions',{enrollment_id:enrollment,locale}),action:async(_owner:string,id:string,body:unknown)=>api('/sessions/'+id+'/actions',body)}
const models={usage:()=>({used,limit:6})}
const report:{cases:any[];usage:unknown;scope:string}={cases:[],usage:models.usage(),scope:'Compiled Worker opaque module, actual default provider, new in-memory SQLite journey. No real player data. Not workerd or deployed runtime. Bundle SHA256 '+bundleHash}
const persist=()=>{report.usage=models.usage();writeFileSync(output,JSON.stringify(report,null,2)+'\n')}
function actionBody(h:OldStreetHead,action:string){const e=oldStreetSpatialPlan(h.save).entities.find(e=>e.scene===h.sceneId&&e.actions.includes(action))!;return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,type:'action',action}}
try{
 let head:OldStreetHead=await service.create(owner,randomUUID(),'zh')
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
}finally{persist();storage.close();globalThis.fetch=nativeFetch}
