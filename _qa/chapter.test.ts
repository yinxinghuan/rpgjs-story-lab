import {test} from 'node:test'
import assert from 'node:assert/strict'
import {initialStory} from '../src/story'
import {chapterResult} from '../src/chapter-result'

test('a received short message is not chapter completion and results never mutate the save',()=>{
 const s=initialStory('zh');s.facts.repaired=true;s.facts.signal_acknowledged=true;s.facts.power_chosen=true
 const before=structuredClone(s);assert.equal(chapterResult(s,'zh'),null);assert.deepEqual(s,before)
 s.facts.beacon_set=true;s.facts.rescue_sent=true
 const completed=structuredClone(s),r=chapterResult(s,'zh')!
 assert.equal(r.route,'lights');assert.match(r.consequence,/返回开启/);assert.deepEqual(s,completed)
 s.facts.beacon_set=false;s.facts.power_radio=true
 assert.equal(chapterResult(s,'en')!.route,'radio');assert.match(chapterResult(s,'en')!.consequence,/emergency light/)
})
test('legacy completion does not invent a choice, character or unseen rescue arrival',()=>{
 const s=initialStory('zh');s.facts.rescue_sent=true
 for(const k of ['power_chosen','power_radio','beacon_set'])delete s.facts[k]
 const before=structuredClone(s)
 for(const locale of ['zh','en'] as const){const r=chapterResult(s,locale)!;assert.equal(r.route,'legacy');assert.equal(r.milestones.length,1);assert.doesNotMatch(JSON.stringify(r),/许岚|Xu Lan|林|Lin|已登车|arrived/)}
 assert.deepEqual(s,before)
})
