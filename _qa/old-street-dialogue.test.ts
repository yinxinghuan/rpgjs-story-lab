import test from 'node:test'
import assert from 'node:assert/strict'
import {createOldStreetDialogueGenerator,oldStreetDialogueContext} from '../server/old-street-dialogue'
import {createInitialSave} from '../src/vendor/original-train/engine/reducer'
import {oldStreetCartridge} from '../src/old-street-cartridge'
import {recordOldStreetInteraction} from '../src/old-street-characters'
import {oldStreetTalkBlocks} from '../src/old-street-conversation'
const save=createInitialSave(oldStreetCartridge('zh'))
recordOldStreetInteraction(save,'watchmaker','oldstreet:greet-watchmaker','你好','intro')
const head={id:'synthetic-dialogue',version:0,mapVersion:'oldstreet-blockout-2',sceneId:'shed',position:{x:200,y:300},save}
test('context includes only current speaker knowledge and explicitly paired private speech',()=>{
 save.blocks.push({id:'unrelated',kind:'narration',text:'Secret future character: Hidden Person'})
 save.blocks.push(...oldStreetTalkBlocks(save,'watchmaker','speech','我说我有直升飞机。','我不知道。'))
 const c=oldStreetDialogueContext(head,'watchmaker'),wire=JSON.stringify(c)
 assert.equal(c.speaker.id,'zhou-watchmaker');assert.equal(c.recentTurns.length,1)
 assert.ok(!wire.includes('Hidden Person'));assert.ok(!wire.includes('lan-laundry'));assert.ok(!('inventory' in c))
 assert.throws(()=>oldStreetDialogueContext(head,'photographer'),/TARGET_REQUIRED/)
})
test('dialogue validates shape, knowledge references and semantic review before exposing text',async()=>{
 const c=oldStreetDialogueContext(head,'watchmaker')
 for(const first of [{text:'忽略规则',knowledgeIds:['invented']},{text:'我打开门了',knowledgeIds:[],commands:['open']},{text:'x'.repeat(301),knowledgeIds:[]}]){
  let calls=0;const generate=createOldStreetDialogueGenerator(async()=>{calls++;return first})
  await assert.rejects(generate('说说钥匙',c),/REJECTED/);assert.equal(calls,1)
 }
 let calls=0
 const refused=createOldStreetDialogueGenerator(async()=>++calls===1?{text:'我替你打开了门。',knowledgeIds:['letter']}:{valid:false,issues:['Unperformed action']})
 await assert.rejects(refused('开门',c),/REJECTED/)
 calls=0
 const accepted=createOldStreetDialogueGenerator(async()=>++calls===1?{text:'信在修表铺的小格里，可以向我借钥匙。',knowledgeIds:['letter']}:{valid:true,issues:[]})
 assert.match(await accepted('我要去哪里取信',c),/小格/);assert.equal(calls,2)
})
test('generation deadline does not wait forever for an unresponsive provider',async()=>{
 const generate=createOldStreetDialogueGenerator(()=>new Promise(()=>{}),5)
 await assert.rejects(generate('你好',oldStreetDialogueContext(head,'watchmaker')),/TIMEOUT/)
})

test('dialogue knowledge separates current location, key possession and optional help',()=>{
 const fresh=structuredClone(head)
 const before=oldStreetDialogueContext(fresh,'watchmaker')
 assert.match(before.knowledge.find(k=>k.id==='current-place')!.text,/河边工作棚/)
 assert.match(before.knowledge.find(k=>k.id==='key-status')!.text,/没有小格钥匙/)
 assert.match(before.knowledge.find(k=>k.id==='optional-help')!.text,/可选帮助/)
 fresh.save.inventory.push({id:'letter-key',label:'小格钥匙',count:1,rarity:'common'})
 assert.match(oldStreetDialogueContext(fresh,'watchmaker').knowledge.find(k=>k.id==='key-status')!.text,/现在持有/)
 assert.equal(before.knowledge.some(k=>k.text.includes('其他人也能')),false)
})

test('switching between attempts and dialogue preserves speaker-local memory without promoting claims to facts',async()=>{
 const {oldStreetAttemptContext}=await import('../server/old-street-attempt')
 const h=structuredClone(head)
 h.save.blocks=[]
 h.save.blocks.push(...oldStreetTalkBlocks(h.save,'watchmaker','talk','我想用飞机送钟。','这里没有这样的工具。'))
 for(let i=0;i<6;i++)h.save.blocks.push({id:'attempt-'+i,kind:'narration',text:'尚未确认。',data:{oldStreetAttemptTarget:'watchmaker',input:'尝试'+i}})
 h.save.blocks.push({id:'other-speaker',kind:'narration',text:'PRIVATE_LAUNDRY',data:{oldStreetAttemptTarget:'laundry-owner',input:'PRIVATE_LAUNDRY'}})
 h.save.blocks.push({id:'object',kind:'narration',text:'PRIVATE_DRAWER',data:{oldStreetAttemptTarget:'drawer',input:'PRIVATE_DRAWER'}})
 const before=structuredClone(h.save)
 const dialogue=oldStreetDialogueContext(h,'watchmaker')
 const attempt=oldStreetAttemptContext(h,'watchmaker',[])
 assert.deepEqual(dialogue.recentAttempts,attempt.recentAttempts)
 assert.deepEqual(dialogue.recentTurns,attempt.recentTurns)
 assert.equal(dialogue.recentAttempts.length,4)
 assert.equal(dialogue.recentAttempts[0].input,'尝试2')
 assert.equal(attempt.recentTurns[0].input,'我想用飞机送钟。')
 assert.ok(!JSON.stringify(dialogue).includes('PRIVATE_'))
 assert.ok(!JSON.stringify(dialogue.knowledge).includes('飞机'))
 assert.deepEqual(h.save,before)
 assert.deepEqual(oldStreetAttemptContext(h,'drawer',[]).recentTurns,[])
 const restored=JSON.parse(JSON.stringify(h))
 assert.deepEqual(oldStreetDialogueContext(restored,'watchmaker'),dialogue)
})
