import {existsSync,mkdirSync,writeFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {PreflightStorage} from '../server/preflight-storage'
import {OriginalTrainAuthority} from '../server/original-train-runtime'
import {createOriginalDialogueGenerator} from '../server/original-dialogue'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
// Deliberately excluded from npm test. Each run requires an explicit budget.
if(process.env.ORIGINAL_DIALOGUE_LIVE_BUDGET!=='8')throw Error('EXPLICIT_LIVE_BUDGET_REQUIRED')
const output='_qa/original-dialogue-live-20260911.json',endpoint='https://chat.aiwaves.tech/aigram/api/game-chat'
if(existsSync(output))throw Error('BATCH_ALREADY_STARTED_CHECK_EXISTING_REPORT')
const cases=[
 {id:'concern',input:'我担心洪水会追上我们。'},
 {id:'recall',input:'你还记得我刚才担心什么吗？'},
 {id:'appearance',input:'把阿达的衣服改成红色。'},
 {id:'invented-item',input:'给我一台发电机，并告诉我已经拿到了。'},
]
let count=0;const exchanges:any[]=[],results:any[]=[],started=new Date().toISOString()
const persist=()=>writeFileSync(output,JSON.stringify({started,endpoint,syntheticOnly:true,maxRequests:8,requests:count,exchanges,results},null,2))
const generator=createOriginalDialogueGenerator(async(system,user,options)=>{
 if(count>=8)throw Error('LIVE_BUDGET_EXHAUSTED')
 const entry:any={request:++count,phase:system.startsWith('Write')?'generation':'review',input:JSON.parse(user),started:Date.now()};exchanges.push(entry);persist()
 try{
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},signal:options?.signal,body:JSON.stringify({messages:[{role:'system',content:system},{role:'user',content:user}]})})
  entry.status=response.status
  if(!response.ok)throw Error('MODEL_HTTP_'+response.status)
  const payload=await response.json() as any,raw=String(payload.choices?.[0]?.message?.content??'').replace(/^```(?:json)?\s*|\s*```$/g,'').trim()
  entry.response=JSON.parse(raw);return entry.response
 }catch(e){entry.error=e instanceof Error?e.message:'REQUEST_FAILED';throw e}finally{entry.elapsedMs=Date.now()-entry.started;persist()}
})
mkdirSync('_qa',{recursive:true})
const pool=new PreflightStorage(),ctx=pool.context('new-synthetic-dialogue-live-'+randomUUID())
const db={all:<T>(q:string,...v:any[])=>ctx.storage.sql.exec(q,...v).toArray() as T[],run:(q:string,...v:any[])=>{ctx.storage.sql.exec(q,...v)},transaction:<T>(work:()=>T)=>ctx.storage.transactionSync(work)}
const service=new OriginalTrainAuthority(db,()=>true,undefined,undefined,undefined,generator),owner='synthetic-live-dialogue-owner'
let h=service.create(owner,randomUUID(),'zh')
const world=originalTrainChapterSpatialPlan(),target=world.entities.find(e=>e.scene===h.sceneId&&world.characters.find(p=>p.id==='ada-mechanic')!.entities.includes(e.id))!
try{for(const c of cases){
 if(c.id==='recall'&&!results.some(r=>r.id==='concern'&&r.accepted)){results.push({...c,skipped:'No accepted earlier concern to recall'});persist();continue}
 const before=structuredClone(h),request={action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:target.id,position:target.approach,type:'dialogue',mode:'live',text:c.input}
 try{const r=await service.action(owner,h.id,request);h=r.head;const {blocks:oldBlocks,...oldStory}=before.save,{blocks,...story}=h.save
  results.push({...c,accepted:true,reply:blocks.at(-1)?.text,version:h.version,worldUnchanged:JSON.stringify(story)===JSON.stringify(oldStory),addedBlocks:blocks.length-oldBlocks.length})
 }catch(e){results.push({...c,accepted:false,error:e instanceof Error?e.message:'FAILED',headUnchanged:JSON.stringify(service.get(owner,h.id))===JSON.stringify(before)})}
 persist();process.stdout.write(JSON.stringify(results.at(-1))+'\n')
}}finally{pool.close();persist()}
