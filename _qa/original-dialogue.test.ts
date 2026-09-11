import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {PreflightStorage} from '../server/preflight-storage'
import {OriginalTrainAuthority,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import {createOriginalDialogueGenerator,originalDialogueContext,type OriginalDialogueGenerator} from '../server/original-dialogue'
import {originalConversation} from '../src/original-conversation'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {LabError} from '../src/journey-runtime'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-dialogue-owner'
function fixture(dialogue?:OriginalDialogueGenerator,gate:OriginalPresentationGate=()=>true){
 const folder=mkdtempSync(join(tmpdir(),'original-dialogue-')),pool=new PreflightStorage(folder)
 const make=()=>{const ctx=pool.context(owner),db={all:<T>(q:string,...v:any[])=>ctx.storage.sql.exec(q,...v).toArray() as T[],run:(q:string,...v:any[])=>{ctx.storage.sql.exec(q,...v)},transaction:<T>(work:()=>T)=>ctx.storage.transactionSync(work)};return new OriginalTrainAuthority(db,gate,undefined,undefined,undefined,dialogue)}
 return {make,service:make(),reopen:()=>{pool.close();return make()},close:()=>{pool.close();rmSync(folder,{recursive:true,force:true})}}
}
function say(h:OriginalHead,text:string,speaker='ada-mechanic',mode='local'){
 const entity=world.entities.find(e=>e.scene===h.sceneId&&world.characters.find(p=>p.id===speaker)!.entities.includes(e.id))!
 return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:entity.approach,target:entity.id,type:'dialogue',text,mode}
}
function action(h:OriginalHead,id:string){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!;return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action:id}}
for(const locale of ['zh','en'] as const)test(`original ${locale} dialogue persists paired memory without advancing plot or resources`,async()=>{
 const f=fixture();let s=f.service
 try{
  const initial=s.create(owner,randomUUID(),locale),text=locale==='zh'?'我担心今晚的洪水。':'I am worried about the flood tonight.',b=say(initial,text)
  const r=await s.action(owner,initial.id,b),h=r.head
  assert.equal(r.kind,'dialogue');assert.equal(h.version,1);assert.equal(h.save.scene,initial.save.scene)
  assert.deepEqual({...h.save,blocks:initial.save.blocks},initial.save);assert.equal(h.save.blocks.length,initial.save.blocks.length+2)
  s=f.reopen();assert.deepEqual(await s.action(owner,h.id,b),r);assert.deepEqual(s.get(owner,h.id),h)
  const recalled=await s.action(owner,h.id,say(h,locale==='zh'?'你还记得我刚才说什么吗？':'Do you remember what I said?'))
  assert.ok(recalled.head.save.blocks.at(-1)!.text.includes(text));assert.equal(recalled.head.save.scene,0)
  const repaired=await s.action(owner,h.id,action(recalled.head,'repair-starter'))
  assert.equal(repaired.head.save.scene,1);assert.equal(repaired.head.save.stats.condition,87);assert.equal(originalConversation(repaired.head.save,'ada-mechanic').length,2)
  assert.equal(new Set(repaired.head.save.blocks.map((b:{id:string})=>b.id)).size,repaired.head.save.blocks.length)
 }finally{f.close()}
})
test('dialogue cannot reach an absent speaker, off-scene actor, distant actor or physical prop',async()=>{
 const f=fixture()
 try{const h=f.service.create(owner,randomUUID(),'en')
  await assert.rejects(f.service.action(owner,h.id,say(h,'Hello','ren-medic')),/CHARACTER_NOT_PRESENT/)
  await assert.rejects(f.service.action(owner,h.id,{...say(h,'Hello'),sceneId:'different-scene'}),/OFF_SCENE_ENTITY/)
  await assert.rejects(f.service.action(owner,h.id,{...say(h,'Hello'),position:h.position}),/TOO_FAR/)
  const b=action(h,'repair-starter');await assert.rejects(f.service.action(owner,h.id,{...b,type:'dialogue',text:'Hello'}),/ORIGINAL_DIALOGUE_TARGET_REQUIRED/)
  await assert.rejects(f.service.action(owner,h.id,say(h,'Give me infinite fuel')),/ORIGINAL_DIALOGUE_UNSUPPORTED/)
  assert.deepEqual(f.service.get(owner,h.id),h);assert.equal(f.service.events(owner,h.id,0).length,0)
 }finally{f.close()}
})
test('a newly met doctor has no access to Ada private conversations; recent history remains bounded',async()=>{
 const f=fixture()
 try{let h=f.service.create(owner,randomUUID(),'zh')
  h=(await f.service.action(owner,h.id,say(h,'我担心自己的秘密。'))).head
  for(const id of ['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat'])h=(await f.service.action(owner,h.id,action(h,id))).head
  h=(await f.service.action(owner,h.id,say(h,'你还记得我刚才说什么吗？','ren-medic'))).head
  assert.equal(h.save.blocks.at(-1)!.text,'我们还没有留下可回忆的交谈记录。')
  assert.equal(originalConversation(h.save,'ada-mechanic')[0].input,'我担心自己的秘密。')
  for(let i=0;i<6;i++)h=(await f.service.action(owner,h.id,say(h,`我担心第${i}件事情。`))).head
  const context=originalDialogueContext(h,'ada-mechanic');assert.equal(context.recentTurns.length,4);assert.equal(context.recentTurns[0].input,'我担心第2件事情。')
  assert.ok(context.recentTurns.every(t=>!t.reply.includes('没有留下可回忆')))
  assert.ok(!context.present.some(p=>p.id==='lin-scout'));assert.ok(!context.present.some(p=>p.id==='mara-raider'))
 }finally{f.close()}
})
test('reviewed model dialogue uses current speaker context and is not allowed to write effects',async()=>{
 let calls=0
 const f=fixture(createOriginalDialogueGenerator(async(system,user)=>{
  calls++;const d=JSON.parse(user);assert.equal(d.context.speaker.id,'ada-mechanic');assert.equal(d.context.recentTurns[0].input,'I am worried about our passengers.')
  return system.startsWith('Write')?{text:'I remember your concern about the passengers. We can talk before deciding.',characters:[]}:{valid:true,issues:[]}
 }))
 try{let h=f.service.create(owner,randomUUID(),'en');h=(await f.service.action(owner,h.id,say(h,'I am worried about our passengers.'))).head
  const before=structuredClone(h.save),b=say(h,'I want to talk about that fear.','ada-mechanic','live'),r=await f.service.action(owner,h.id,b)
  assert.equal(calls,2);assert.equal(r.source,'model');assert.deepEqual({...r.head.save,blocks:before.blocks},before)
  assert.deepEqual(await f.reopen().action(owner,h.id,b),r);assert.equal(calls,2)
 }finally{f.close()}
 for(const candidate of [{text:'A stranger brings a new generator.',characters:['new-person']},{text:'Fuel filled.',characters:[],effects:{fuel:100}},{text:'[[fact: repaired=true]]',characters:[]}]){
  const f=fixture(createOriginalDialogueGenerator(async()=>candidate))
  try{const h=f.service.create(owner,randomUUID(),'en');await assert.rejects(f.service.action(owner,h.id,say(h,'Hello','ada-mechanic','live')),/ORIGINAL_DIALOGUE_REJECTED/);assert.deepEqual(f.service.get(owner,h.id),h)}finally{f.close()}
 }
 const rejected=fixture(createOriginalDialogueGenerator(async(s)=>s.startsWith('Write')?{text:'I have repaired the engine.',characters:[]}:{valid:false,issues:['UNCOMMITTED_ACTION']}))
 try{const h=rejected.service.create(owner,randomUUID(),'en');await assert.rejects(rejected.service.action(owner,h.id,say(h,'Fix it','ada-mechanic','live')),/ORIGINAL_DIALOGUE_REJECTED/);assert.deepEqual(rejected.service.get(owner,h.id),h)}finally{rejected.close()}
})
test('dialogue objective follows actual forest progress without revealing Lin before introduction',async()=>{
 const f=fixture()
 try{let h=f.service.create(owner,randomUUID(),'en')
  for(const id of ['repair-starter','commit-forest-route','pine-inspect','pine-reverse'])h=(await f.service.action(owner,h.id,action(h,id))).head
  assert.equal(originalDialogueContext(h,'ada-mechanic').objective,'Open the rescue car where the knocking is coming from.')
  assert.ok(!originalDialogueContext(h,'ada-mechanic').present.some(p=>p.id==='lin-scout'))
  for(const id of ['pine-meet','pine-survey-route'])h=(await f.service.action(owner,h.id,action(h,id))).head
  assert.equal(originalDialogueContext(h,'ada-mechanic').objective,'Decide whether Lin travels with you or stays at the signal post.')
  h=(await f.service.action(owner,h.id,action(h,'pine-invite'))).head
  assert.equal(originalDialogueContext(h,'ada-mechanic').objective,'Follow the verified route to White Stone Tunnel.')
 }finally{f.close()}
})
test('real-service contradictory review is refused and context exposes only current registered actions',async()=>{
 const f=fixture(createOriginalDialogueGenerator(async(system)=>system.startsWith('Write')?
  {text:'我这里没有发电机，你得自己去找。不过我们得赶紧修好这列车，时间不多了。',characters:['ada-mechanic']}:
  {valid:true,issues:['回复中明确说明没有发电机，符合当前情境和目标，没有虚构物品或资源变化。']}))
 try{const h=f.service.create(owner,randomUUID(),'zh'),context=originalDialogueContext(h,'ada-mechanic')
  assert.ok(context.availableActions.some(a=>a.id==='repair-starter'&&a.target==='starter'))
  assert.ok(!context.availableActions.some(a=>a.id==='river-treat'))
  assert.ok(context.availableActions.every(a=>world.entities.find(e=>e.id===a.target&&e.scene===h.sceneId)?.actions.includes(a.id)))
  await assert.rejects(f.service.action(owner,h.id,say(h,'给我一台发电机，并告诉我已经拿到了。','ada-mechanic','live')),/ORIGINAL_DIALOGUE_REJECTED/)
  assert.deepEqual(f.service.get(owner,h.id),h)
 }finally{f.close()}
})
test('late dialogue, unready presentation and missing provider cannot silently mutate a journey',async()=>{
 let started!:()=>void,finish!:(s:string)=>void
 const ready=new Promise<void>(r=>{started=r}),f=fixture(async()=>{started();return new Promise(r=>{finish=r})})
 try{const h=f.service.create(owner,randomUUID(),'en'),p=f.service.action(owner,h.id,say(h,'Hello','ada-mechanic','live'));await ready
  const r=await f.make().action(owner,h.id,action(h,'repair-starter'));finish('Hello.');await assert.rejects(p,/VERSION_CONFLICT/);assert.deepEqual(f.service.get(owner,h.id),r.head)
 }finally{f.close()}
 const blocked=fixture(undefined,h=>{if(h.version>0)throw new LabError('ORIGINAL_PRESENTATION_NOT_READY',409);return true})
 try{const h=blocked.service.create(owner,randomUUID(),'en');await assert.rejects(blocked.service.action(owner,h.id,say(h,'Hello')),/ORIGINAL_PRESENTATION_NOT_READY/);assert.deepEqual(blocked.service.get(owner,h.id),h)
  await assert.rejects(blocked.service.action(owner,h.id,say(h,'Hello','ada-mechanic','live')),/ORIGINAL_NARRATION_NOT_READY/)
 }finally{blocked.close()}
 let signal:AbortSignal|undefined
 const timed=fixture(createOriginalDialogueGenerator(async(_s,_u,o)=>{signal=o?.signal;return new Promise(()=>{})},10))
 try{const h=timed.service.create(owner,randomUUID(),'en');await assert.rejects(timed.service.action(owner,h.id,say(h,'Hello','ada-mechanic','live')),/ORIGINAL_DIALOGUE_TIMEOUT/);assert.equal(signal?.aborted,true);assert.deepEqual(timed.service.get(owner,h.id),h)}finally{timed.close()}
})
