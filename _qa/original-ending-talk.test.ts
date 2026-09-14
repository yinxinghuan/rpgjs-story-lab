import test from 'node:test'
import assert from 'node:assert/strict'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalDialogueContext,originalLocalDialogue} from '../server/original-dialogue'
import {originalEndingTalkContext,originalTalkTopics} from '../src/original-talk-topics'

for(const locale of ['zh','en'] as const)test(`ending topics use only completed saved choices and costs (${locale})`,()=>{
 const h=originalTrainRuntime(()=>true).initial(locale,'12345678-1234-1234-1234-123456789012')
 const title=locale==='zh'?'在枢纽安顿':'Settle at the junction',thesis=locale==='zh'?'先让抵达的人有地方生活。':'Give those who arrived a place to live.',costs=locale==='zh'?['列车不再自由旅行','交出剩余燃料']:['The train no longer travels freely','Hand over the remaining fuel']
 h.save.finale={status:'complete',ending:{id:'test-ending',snapshotId:'test-snapshot',generated:false,anchorFamily:'settle',title,thesis,irreversibleCosts:costs,capabilitiesUsed:[],preserved:[],lost:[],unresolved:[],finaleScenes:[],characterEpilogues:[],regionalEpilogues:[],finalImagePrompt:''}}
 const before=structuredClone(h.save),context=originalDialogueContext(h,'ada-mechanic'),topics=originalTalkTopics(context)
 assert.equal(topics.length,3);assert.ok(topics[0].reply.includes(title));assert.ok(topics[0].reply.includes(thesis));assert.deepEqual(topics.slice(1).map(t=>t.reply),costs)
 for(const topic of topics){assert.equal(topic.actionId,undefined);assert.equal(originalLocalDialogue(topic.text,context),topic.reply)}
 assert.ok(!topics.some(t=>/road ahead|接下来的路|启动机/.test(t.text)))
 assert.deepEqual(h.save,before)
 h.save.finale.status='ready';assert.equal(originalEndingTalkContext(h.save),undefined)
 h.save.finale.status='failed';assert.equal(originalEndingTalkContext(h.save),undefined)
})
