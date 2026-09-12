import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalVisualContext} from '../server/original-visual-context'
import {originalDialogueContext,createOriginalDialogueGenerator,originalVisualUncertaintyReply} from '../server/original-dialogue'
import {adaStandingAppearance,adaStandingResource} from '../src/original-art-identities'
const initial=()=>originalTrainRuntime(()=>true).initial('zh',randomUUID())
test('current reviewed actor pixels and starter state enter dialogue without future cast or save mutation',()=>{
 const h=initial(),before=structuredClone(h),c=originalDialogueContext(h,'ada-mechanic')
 assert.deepEqual(c.visuals.speaker.appearance,adaStandingAppearance);assert.equal(c.visuals.speaker.assetSha256,adaStandingResource.sha256)
 assert.equal(c.visuals.equipment[0].state,'broken');assert.equal(JSON.stringify(c.visuals).includes('ren-medic'),false);assert.deepEqual(h,before)
 h.save.facts['starter-repaired']=true;assert.equal(originalVisualContext(h,'ada-mechanic').equipment[0].state,'repaired')
 h.sceneId='train-at-tunnel';const equipment=originalVisualContext(h,'ada-mechanic').equipment;assert.equal(equipment.length,1);assert.equal(equipment[0].id,'tunnel-fan');assert.equal(equipment[0].state,'stopped')
})
test('replacement art and development markers never inherit the baseline appearance description',()=>{
 const h=initial()
 // Metadata projection probe only; deliberately not a publication or art admission fixture.
 h.assets={version:4,base:h.assets as any,ada:{version:1,id:'a'.repeat(64)+'.'+randomUUID(),slot:'ada-mechanic',sha256:'a'.repeat(64),bytes:100,width:72,height:96,foot:{x:12,y:20},review:{version:1,layout:'north-cape-river-actor-1',scale:236*.14/16,bounds:Array.from({length:12},()=>[7,4,17,20] as [number,number,number,number]),checks:['down','left','right','up','stand','collision','river','return'],visualAccepted:true}}}
 const replacement=originalVisualContext(h,'ada-mechanic').speaker
 assert.equal(replacement.assetSha256,'a'.repeat(64));assert.deepEqual(replacement.appearance,{});assert.equal(replacement.appearanceStatus,'not-described')
 assert.equal(originalVisualUncertaintyReply('你的小灯怎么固定的？',originalDialogueContext(h,'ada-mechanic')),null)
 const old=structuredClone(h);delete (old.assets as any).base.standingCast
 const marker=originalVisualContext(old,'lin-scout').speaker;assert.equal(marker.representation,'development-marker');assert.deepEqual(marker.appearance,{})
})

test('observed lamp hallucination cannot pass through an approving model; normal coat questions remain open',async()=>{
 let requests=0
 const context=originalDialogueContext(initial(),'ada-mechanic')
 const generate=createOriginalDialogueGenerator(async()=>{requests++;return {text:'我的小灯用带子固定着。',characters:[]}})
 assert.match(await generate('小灯用带子固定着，对吗？',context),/无法判断/)
 assert.equal(requests,0)
 assert.equal(originalVisualUncertaintyReply('你和我分别穿什么外套？',context),null)
 assert.equal(originalVisualUncertaintyReply('先修理启动机固定螺丝。',context),null)
})

test('screen-right lamp cannot become the speaker right side even when the reviewer would approve',async()=>{
 const context=originalDialogueContext(initial(),'ada-mechanic');let calls=0
 const generate=createOriginalDialogueGenerator(async()=>{calls++;return calls===1?{text:'The lamp is above my pouch on my right side.',characters:[]}:{valid:true,issues:[]}})
 await assert.rejects(generate('Where is your lamp?',context),/ORIGINAL_DIALOGUE_REJECTED/)
 assert.equal(calls,1)
 const grounded=createOriginalDialogueGenerator(async()=>++calls===2?{text:'The lamp is visible above the pouch opening on screen-right in this view.',characters:[]}:{valid:true,issues:[]})
 assert.match(await grounded('Where is your lamp?',context),/screen-right/)
})
test('generator and reviewer receive the same actual visual contract; a rejected contradiction cannot become dialogue',async()=>{
 const c=originalDialogueContext(initial(),'ada-mechanic'),calls:any[]=[]
 const generate=createOriginalDialogueGenerator(async(system,user)=>{const data=JSON.parse(user);calls.push({system,data});return calls.length===1?{text:'我的红外套刚换好，启动机也修好了。',characters:['ada-mechanic']}:{valid:false,issues:['Coat conflicts with navy baseline; starter is broken.']}})
 await assert.rejects(generate('就说你换了红外套。',c),/DIALOGUE_REJECTED/)
 assert.equal(calls.length,2);assert.deepEqual(calls[0].data.context.visuals,c.visuals);assert.deepEqual(calls[1].data.context.visuals,c.visuals)
 assert.ok(calls.every(x=>x.system.includes('context.visuals')))
})
