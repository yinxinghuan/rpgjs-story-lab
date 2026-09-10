import {test} from 'node:test'
import assert from 'node:assert/strict'
import {narrationMode} from '../src/narration-policy'
import {createHandler} from '../worker/source'
test('online mode requires an explicit valid preference and is unavailable in static browser edition',async()=>{
 for(const value of [undefined,null,'invalid','local',{},true])assert.equal(narrationMode(value),'local')
 assert.equal(narrationMode('live'),'live');assert.equal(narrationMode('live',true),'local')
 const health=await (await createHandler(true)(new Request('https://example.test/api/lab/health'),{})).json()
 assert.equal(health.liveModelAvailable,true);assert.equal(health.narrationMode,'opt-in')
})
