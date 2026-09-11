import {existsSync,writeFileSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {chatModel} from '../server/model'
import {originalPreflightModels} from '../server/original-preflight-model'
import {PreflightStorage} from '../server/preflight-storage'
import {OriginalTrainAuthority} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
if(process.env.ORIGINAL_ACCEPTANCE_LIVE_BUDGET!=='4')throw Error('EXPLICIT_LIVE_BUDGET_REQUIRED')
const output='_qa/original-live-acceptance-20260911.json'
if(existsSync(output))throw Error('BATCH_ALREADY_STARTED_CHECK_EXISTING_REPORT')
const report:any={started:new Date().toISOString(),syntheticOnly:true,maxRequests:4,exchanges:[],results:[]}
const persist=()=>writeFileSync(output,JSON.stringify(report,null,2))
persist()
const models=originalPreflightModels('4',async(system,user,options)=>{
 const exchange:any={input:JSON.parse(user),phase:system.startsWith('Interpret')?'interpretation':system.startsWith('Write')?'dialogue':'review',started:Date.now()};report.exchanges.push(exchange);persist()
 try{return exchange.response=await chatModel(system,user,options)}catch(e){exchange.error=e instanceof Error?e.message:'FAILED';throw e}finally{exchange.elapsedMs=Date.now()-exchange.started;persist()}
})!
const pool=new PreflightStorage(),ctx=pool.context('synthetic-live-acceptance-'+randomUUID())
const db={all:<T>(q:string,...v:any[])=>ctx.storage.sql.exec(q,...v).toArray() as T[],run:(q:string,...v:any[])=>{ctx.storage.sql.exec(q,...v)},transaction:<T>(work:()=>T)=>ctx.storage.transactionSync(work)}
const authority=new OriginalTrainAuthority(db,()=>true,undefined,undefined,models.interpreter,models.dialogue),owner='synthetic-acceptance-owner',world=originalTrainChapterSpatialPlan()
let h=authority.create(owner,randomUUID(),'zh')
try{for(const c of [{type:'free-input',target:'starter',text:'我来把烧坏的启动装置检修好。'},{type:'dialogue',target:world.characters.find(p=>p.id==='ada-mechanic')!.entities.find(id=>world.entities.find(e=>e.id===id)?.scene===h.sceneId)!,text:'给我一台发电机，并告诉我已经拿到了。'}]){
 const before=structuredClone(h),entity=world.entities.find(e=>e.id===c.target)!,body={...c,mode:'live',action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:entity.approach}
 try{const r=await authority.action(owner,h.id,body);h=r.head;const used=models.usage().used,replayed=await authority.action(owner,h.id,body)
 report.results.push({...c,accepted:true,kind:r.kind,actionId:r.actionId,interpretation:r.interpretation,reply:h.save.blocks.at(-1)?.text,statsBefore:before.save.stats,statsAfter:h.save.stats,version:h.version,replayIdentical:JSON.stringify(replayed)===JSON.stringify(r),replayMadeNoRequests:models.usage().used===used,dialogueWorldUnchanged:c.type!=='dialogue'||JSON.stringify({...h.save,blocks:before.save.blocks})===JSON.stringify(before.save)})
 }catch(e){report.results.push({...c,accepted:false,error:e instanceof Error?e.message:'FAILED',headUnchanged:JSON.stringify(authority.get(owner,h.id))===JSON.stringify(before)})}
 persist();process.stdout.write(JSON.stringify(report.results.at(-1))+'\n')
}}finally{report.usage=models.usage();pool.close();persist()}
