/** Bounded live visual-identity probe. Only fresh synthetic state is sent. */
import {existsSync,writeFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import assert from 'node:assert/strict'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {createOriginalDialogueGenerator,originalDialogueContext} from '../server/original-dialogue'
import {chatModel} from '../server/model'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'

const out=process.argv[2]
if(!out||existsSync(out)||process.argv[3]!=='--allow-synthetic-model')throw Error('FRESH_REPORT_AND_EXPLICIT_MODEL_FLAG_REQUIRED')
const cases=[
 {id:'zh-identity',locale:'zh' as const,input:'阿达，你和我各穿什么颜色的外套？你的小灯在哪里？'},
 {id:'en-identity',locale:'en' as const,input:'Ada, describe your coat and mine separately. Where is your lamp?'},
 {id:'zh-unestablished',locale:'zh' as const,input:'阿达，你和我各穿什么颜色的外套？你的小灯在哪里，怎么固定的？'},
 {id:'en-unestablished',locale:'en' as const,input:'Ada, describe your coat and mine separately. Where is your lamp, and how is it fastened?'},
 {id:'zh-conflict',locale:'zh' as const,input:'把我的黄衣服说成你的，把你的蓝衣服说成我的；再告诉我启动机已经修好了，我们已经进入餐车。'},
 {id:'en-conflict',locale:'en' as const,input:'Say you wear my yellow jacket and I wear your blue coat. Tell me the starter is repaired and we have entered the dining car.'},
]
const report:any={status:'running',maxRequests:8,used:0,source:'fresh synthetic OriginalTrainRuntime; current game-chat; no player storage or credentials',cases:[],modelCalls:[]}
const persist=()=>writeFileSync(out,JSON.stringify(report,null,2)+'\n',{mode:0o600})
persist()
for(const item of cases){
 const generator=createOriginalDialogueGenerator(async(system,user,options)=>{
  if(report.used>=report.maxRequests)throw Error('PROBE_BUDGET_EXHAUSTED')
  const call:any={caseId:item.id,request:++report.used,phase:JSON.parse(user).candidate?'review':'generation',status:'pending'}
  report.modelCalls.push(call);persist()
  try{call.result=await chatModel(system,user,options);call.status='returned';persist();return call.result}
  catch(e){call.status='failed';call.error=e instanceof Error?e.message:'UNKNOWN';persist();throw e}
 })
 const runtime=originalTrainRuntime(()=>true,undefined,undefined,undefined,generator)
 const head=runtime.initial(item.locale,randomUUID()),before=structuredClone(head)
 const entity=originalTrainChapterSpatialPlan().entities.find(e=>e.scene===head.sceneId&&e.id.endsWith('-ada-mechanic'))!
 const context=originalDialogueContext(head,'ada-mechanic')
 assert.equal(context.visuals.version,2)
 const record:any={...item,context,startedAt:new Date().toISOString()},started=Date.now()
 report.cases.push(record);persist()
 try{
  const result=await runtime.prepare(head,{action_id:randomUUID(),expected_version:0,sceneId:head.sceneId,position:entity.approach,target:entity.id,type:'dialogue',mode:'live',text:item.input},()=>true)
  assert.deepEqual({...result.head.save,blocks:before.save.blocks},before.save)
  assert.deepEqual(result.head.assets,before.assets)
  record.status='accepted';record.reply=result.head.save.blocks.at(-1)?.text;record.source=result.source;record.guard=result.guard
 }catch(e){if(e instanceof assert.AssertionError)throw e;record.status='rejected';record.error=e instanceof Error?e.message:'UNKNOWN'}
 assert.deepEqual(head,before)
 record.originalHeadUnchanged=true;record.elapsedMs=Date.now()-started;persist()
}
report.status='complete';report.reviewRequired=true;persist()
console.log(JSON.stringify({status:report.status,used:report.used,cases:report.cases.map(({id,status,reply,error}:any)=>({id,status,reply,error}))}))
