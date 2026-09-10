import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {initialStory,runRule,type StorySave} from '../src/story'
import {prepareAction,type Head} from '../src/journey-runtime'
import {recentConversation,tagConversationTurn} from '../src/conversation-context'
import {sceneContract,localReply,actionTarget,currentScene,MAP_VERSION,type EntityId} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import {propose,type ModelRequest} from '../server/model'
const head=(save=initialStory('zh')):Head=>({id:randomUUID(),version:0,save,position:approachPoints.lin,mapVersion:MAP_VERSION})
const envelope=(h:Head,target:EntityId,text:string)=>({action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),target,position:approachPoints[target],type:'free-input',text})
test('natural model action is settled by the registered rule, not model completion prose',async()=>{
 const h=head(),before=structuredClone(h);let n=0
 const request:ModelRequest=async(_system,user)=>{
  n++;const payload=JSON.parse(user)
  if(n===1){assert.ok(payload.contract.supportedActions.some((a:any)=>a.id==='open-cabinet'&&a.label==='打开检修柜'));return {kind:'action',actionId:'open-cabinet',entityIds:['cabinet'],claims:[],text:'你想打开检修柜。'}}
  return {valid:true,issues:[]}
 }
 const result=await prepareAction(h,envelope(h,'cabinet','帮我把这扇柜门拉开'),(input,save,target)=>propose(input,save,target,true,request))
 assert.equal(result.actionId,'open-cabinet');assert.equal(result.head.save.facts.cabinet_open,true)
 assert.match(result.text,/备用保险丝/);assert.deepEqual(h,before)
})
test('tagged conversation keeps the actual input and response for this speaker only',async()=>{
 let h=head(runRule(initialStory('zh'),'meet-lin').save)
 const original=structuredClone(h.save.blocks)
 const input='我有点担心这场雨',reply='林看看窗外：“雨还在下，我在这里看着线路。”'
 const result=await prepareAction(h,envelope(h,'lin',input),async()=>({proposal:{kind:'dialogue',entityIds:['lin'],claims:[],text:reply},trace:{mode:'fixture'}}))
 h=JSON.parse(JSON.stringify(result.head))
 assert.deepEqual(h.save.blocks.slice(0,original.length),original)
 assert.deepEqual(recentConversation(h.save,'lin'),[{turn:h.save.scene,input,reply}])
 assert.deepEqual(recentConversation(h.save,'radio'),[])
 assert.deepEqual(recentConversation(h.save,'cabinet'),[])
 assert.deepEqual(recentConversation(h.save,'lin',0),[])
 assert.throws(()=>recentConversation(h.save,'lin',-1),/INVALID_HISTORY_LIMIT/)
 const contract=sceneContract(h.save,'lin');assert.equal(contract.conversation.recentTurns[0].input,input)
 assert.ok(!('save' in contract));assert.ok(!('blocks' in contract))
})
test('untagged old logs and another character cannot become invented recollections; history is bounded',()=>{
 const s=runRule(initialStory('zh'),'meet-lin').save
 assert.deepEqual(recentConversation(s,'lin'),[])
 for(let i=0;i<7;i++){
  const base=structuredClone(s);s.scene++
  s.blocks.push({id:`action-${s.scene}`,kind:'event',text:`input-${i}`},{id:`reply-${s.scene}`,kind:'narration',text:`reply-${i}`})
  tagConversationTurn(base,s,'lin')
 }
 s.blocks.push({id:'unrelated',kind:'narration',text:'private other dialogue',data:{spatialSpeakerId:'zhou-yu',spatialTurn:99,spatialRole:'reply'}})
 const memory=recentConversation(s,'lin');assert.equal(memory.length,4);assert.equal(memory[0].input,'input-3')
 assert.ok(!JSON.stringify(memory).includes('private other'))
 assert.deepEqual(recentConversation(initialStory('zh'),'lin'),[])
})
test('proposal and semantic review share one abort signal and bounded memory; review rejects unsupported memories',async()=>{
 const s=runRule(initialStory('zh'),'meet-lin').save;let n=0;const signals:AbortSignal[]=[]
 const r=await propose('你记得我昨晚说了什么吗',s,'lin',true,async(system,user,options)=>{
  n++;signals.push(options!.signal)
  if(n%2){assert.equal(JSON.parse(user).contract.conversation.recentTurns.length,0);return {kind:'dialogue',entityIds:['lin'],claims:[],text:'林说：“我记得你昨晚来过。”'}}
  return {valid:false,issues:['UNSUPPORTED_MEMORY']}
 })
 assert.equal(r.trace.fallback,true);assert.equal(r.trace.requests,4);assert.ok(signals.every(signal=>signal===signals[0]));assert.ok(r.trace.elapsedMs!>=0)
 assert.ok(!r.proposal.text.includes('昨晚来过'))
})
test('the scene contract does not expose future reception choices or identification answer',()=>{
 const s=initialStory('en');s.map.forEach(n=>n.current=n.id==='cab')
 const c=sceneContract(s,'radio')
 assert.ok(!c.allowedActions.includes('confirm-arrival' as any))
 assert.ok(!JSON.stringify(c.supportedActions).includes('two short'))
})

test('one total generation budget aborts a late provider and returns a grounded fallback',async()=>{
 const save=runRule(initialStory('zh'),'meet-lin').save
 let signal:AbortSignal|undefined,calls=0
 const response=await propose('你好',save,'lin',true,async(_system,_user,options)=>{
  signal=options!.signal;calls++
  return new Promise(resolve=>setTimeout(()=>resolve({kind:'dialogue',entityIds:['lin'],claims:[],text:'late reply'}),80))
 },15)
 assert.equal(response.trace.fallback,true);assert.equal(calls,1);assert.equal(signal?.aborted,true)
 assert.ok(response.trace.issues.includes('MODEL_BUDGET_EXCEEDED'));assert.notEqual(response.proposal.text,'late reply')
})

test('model action post-state is never consumed, and invented future lighting is rejected',async()=>{
 const s=initialStory('zh');let calls=0
 const r=await propose('帮我拉开柜门',s,'cabinet',true,async()=>++calls===1?{kind:'action',actionId:'open-cabinet',claims:[{entityId:'cabinet',state:'open'}],text:'imagined reward',commands:['fake']}:{valid:true,issues:[]})
 assert.equal(r.proposal.actionId,'open-cabinet');assert.deepEqual(r.proposal.claims,[]);assert.equal(r.proposal.text,'')
 const {validateProposal}=await import('../src/contract')
 const known=runRule(s,'meet-lin').save
 const bad={kind:'dialogue',entityIds:['lin'],claims:[],text:'林安慰说我们会找到备用的照明设备，保证能安全离开。'}
 assert.ok(validateProposal(bad,known,'lin').includes('UNSUPPORTED_LIGHTING_EQUIPMENT'))
 assert.ok(!validateProposal({...bad,text:'这里没有备用照明设备，先看看配电箱。'},known,'lin').includes('UNSUPPORTED_LIGHTING_EQUIPMENT'))
})

test('model and semantic approval cannot commit a question, negation or future plan',async()=>{
 const save=runRule(initialStory('zh'),'open-cabinet').save
 for(const input of ['我可以拿走里面的保险丝吗？','不要拿保险丝','我打算明天拿保险丝','Can I take the fuse?']){
  const h=head(save)
  const r=await prepareAction(h,envelope(h,'cabinet',input),async()=>({proposal:{kind:'action',actionId:'take-fuse',entityIds:['cabinet'],claims:[],text:''},trace:{}}))
  assert.equal(r.accepted,false,input);assert.deepEqual(r.head.save.inventory,[]);assert.ok(!r.head.save.facts.fuse_taken)
 }
})

test('invalid JSON gets one repair within the existing budget',async()=>{
 let calls=0
 const r=await propose('我可以拿走保险丝吗？',initialStory('zh'),'cabinet',true,async()=>{
  calls++;if(calls===1)throw new SyntaxError('extra JSON')
  return calls===2?{kind:'dialogue',entityIds:['cabinet'],claims:[],text:'先打开柜门，再决定是否取出保险丝。'}:{valid:true,issues:[]}
 })
 assert.equal(calls,3);assert.equal(r.trace.attempts,2);assert.equal(r.trace.fallback,false)
 assert.ok(r.trace.issues.includes('INVALID_MODEL_JSON'));assert.equal(r.proposal.kind,'dialogue')
})
