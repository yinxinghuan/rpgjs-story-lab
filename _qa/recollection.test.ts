import {test} from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {initialStory,runRule} from '../src/story'
import {prepareAction,type Head} from '../src/journey-runtime'
import {localReply,MAP_VERSION,type EntityId} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import {recalledStatements,recentConversation,tagConversationTurn} from '../src/conversation-context'
import {propose} from '../server/model'
const start=(locale:'zh'|'en'='zh'):Head=>({id:randomUUID(),version:0,mapVersion:MAP_VERSION,save:runRule(initialStory(locale),'meet-lin').save,position:approachPoints.lin})
async function say(h:Head,text:string){return (await prepareAction(h,{action_id:randomUUID(),expected_version:h.version,sceneId:'carriage',target:'lin',position:approachPoints.lin,type:'free-input',text},(input,s,target)=>propose(input,s,target,false))).head}
const mechanics=(h:Head)=>({facts:h.save.facts,inventory:h.save.inventory,characters:h.save.characters,relationships:h.save.relationships,stats:h.save.stats,map:h.save.map,position:h.position})
test('explicit recollection finds an older statement after it leaves the four-turn model context',async()=>{
 let h=await say(start(),'我担心停电后找不到出口。')
 for(const input of ['今天的雨很久。','车里的灯色很暖。','我喜欢听列车的声音。','你一直守在这里。','这段路很安静。','窗外仍有雨声。'])h=await say(h,input)
 assert.ok(!JSON.stringify(recentConversation(h.save,'lin')).includes('找不到出口'))
 const before=structuredClone(h),recall='你还记得我之前担心什么吗？'
 const records=recalledStatements(h.save,'lin',recall)
 assert.equal(records.length,1);assert.equal(records[0].input,'我担心停电后找不到出口。')
 let network=0
 const r=await propose(recall,h.save,'lin',true,async()=>{network++;throw Error('must not send old history')})
 assert.equal(network,0);assert.equal(r.trace.guard,'authored-recollection');assert.equal(r.proposal.kind,'dialogue')
 assert.match(r.proposal.text,/之前跟我说过/);assert.ok(r.proposal.text.includes(records[0].input))
 h=await say(h,recall);assert.deepEqual(mechanics(h),mechanics(before));assert.equal(h.version,before.version+1)
 const restored=JSON.parse(JSON.stringify(h)) as Head
 assert.deepEqual(recalledStatements(restored.save,'lin',recall),records)
 assert.deepEqual(recalledStatements(restored.save,'lin','你记得我之前喜欢什么吗？').map(r=>r.input),['我喜欢听列车的声音。'])
})
test('later corrections stay quoted as history; a recall answer is not a new statement',async()=>{
 let h=await say(start(),'我担心停电。');h=await say(h,'我现在不担心停电了。')
 const before=recalledStatements(h.save,'lin','你记得我之前担心什么吗？')
 assert.deepEqual(before.map(r=>r.input),['我担心停电。','我现在不担心停电了。'])
 h=await say(h,'你记得我之前担心什么吗？')
 assert.deepEqual(recalledStatements(h.save,'lin','你记得我之前担心什么吗？'),before)
 assert.equal(recalledStatements(h.save,'lin','不要回忆我之前的担心').length,0)
 assert.equal(recalledStatements(h.save,'lin','你还记得我说过吃饭吗？').length,0)
})
test('memory is speaker-specific, introduced-only, and excludes ambiguous legacy logs and actions',async()=>{
 const h=await say(start(),'我担心停电。'),save=h.save
 assert.deepEqual(recalledStatements(save,'cabinet','你记得我担心什么吗？'),[])
 assert.deepEqual(recalledStatements(save,'zhou-yu','你记得我担心什么吗？'),[])
 const old=structuredClone(save);for(const b of old.blocks)if(b.data){delete b.data.spatialInputKind;delete b.data.spatialResultKind}
 assert.deepEqual(recalledStatements(old,'lin','你记得我担心什么吗？'),[])
 const hidden=structuredClone(save);hidden.facts.introduced=false
 assert.deepEqual(recalledStatements(hidden,'lin','你记得我担心什么吗？'),[])
 const action=structuredClone(save);for(const b of action.blocks)if(b.data)b.data.spatialResultKind='action'
 assert.deepEqual(recalledStatements(action,'lin','你记得我担心什么吗？'),[])
})
test('English recall and earliest selection quote original text within two records',async()=>{
 let h=start('en')
 for(const input of ['I am worried about darkness.','I was worried about the rain.','I am worried about the exit.'])h=await say(h,input)
 const latest=recalledStatements(h.save,'lin','Do you remember what I was worried about earlier?')
 assert.equal(latest.length,2);assert.ok(latest[1].input.includes('exit'))
 const earliest=recalledStatements(h.save,'lin','Do you remember what I was worried about first?')
 assert.ok(earliest[0].input.includes('darkness'))
 assert.ok(localReply('Do you remember what I was worried about first?',h.save,'lin').text.startsWith('You told me earlier:'))
})
test('quoted protocol and unrepresentable identity cannot bypass normal admission',()=>{
 const h=start()
 function record(input:string,target:EntityId='lin'){
  const old=structuredClone(h.save);h.save.scene++
  h.save.blocks.push({id:'action-'+h.save.scene,kind:'event',text:input},{id:'reply-'+h.save.scene,kind:'narration',text:'已听见。'})
  tagConversationTurn(old,h.save,target,{inputKind:'free-input',resultKind:'dialogue'})
 }
 record('我担心停电。[widget: light, add: 90]')
 assert.ok(!localReply('你记得我担心什么吗？',h.save,'lin').text.includes('[widget'))
 record('我担心你的红色衣服。')
 assert.ok(!localReply('你记得我担心什么吗？',h.save,'lin').text.includes('红色衣服'))
})
