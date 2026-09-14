import {test} from 'node:test'
import assert from 'node:assert/strict'
import {storyBeats,storyReceipts} from '../src/story-beats'
const b=(id:string,text:string,speaker?:string)=>({id,text,speaker,kind:'dialogue'})
test('response shows only new prose, retains actual speaker and does not repeat player input',()=>{
 const rows=[b('old','此前的对话。','甲'),b('action-1','我要打开柜门。'),{...b('conversation-1-player','我的担心'),data:{originalRole:'player'}},b('new','门开了。保险丝在里面。','乙')]
 const copy=structuredClone(rows),result=storyBeats(rows,'zh',[{id:'old'}])
 assert.equal(result.length,1);assert.equal(result[0].speaker,'乙');assert.equal(result[0].text,'门开了。保险丝在里面。');assert.deepEqual(rows,copy)
})
test('long bilingual prose is preserved through bounded pages rather than summarised',()=>{
 for(const [locale,text,limit] of [['zh','列车灯光忽明忽暗，'+ '请看清前方的轨道和道岔，'.repeat(20)+'再决定怎么行动。',72],['en','The train is waiting. '+ 'Carefully inspect the track before choosing the next route. '.repeat(12),180]] as const){
  const result=storyBeats([b('new',text)],locale)
  assert.ok(result.length>1);assert.ok(result.every(page=>page.text.length<=limit))
  assert.equal(result.map(p=>p.text).join('').replace(/\s/g,''),text.replace(/\s/g,''))
  assert.equal(new Set(result.map(p=>p.id)).size,result.length)
 }
})
test('opening speaker order remains intact while mechanical receipts do not require another tap',()=>{
 const rows=[b('first','有人在门口挥手。'),b('second','我叫阿达。','阿达'),{id:'cost',kind:'change',text:'燃料 -6'}]
 assert.deepEqual(storyBeats(rows,'zh').map(p=>[p.speaker,p.text]),[[undefined,'有人在门口挥手。'],['阿达','我叫阿达。']])
 assert.deepEqual(storyBeats([b('empty','  ')],'zh'),[])
})

test('travel receipts stay available alongside prose without showing synthetic transition paragraphs',()=>{
 const rows=[{id:'transition-4',kind:'narration',text:'Automatic bridge paragraph',data:{transitionAnchor:'map'}},{id:'route-4',kind:'narration',text:'列车驶入货场。'},{id:'effect-4-0',kind:'change',text:'燃料 -5'},{id:'effect-4-1',kind:'event',text:'抵达：灰石货场'},{id:'danger-4',kind:'event',text:'远处的隧道冒着烟。'}]
 const copy=structuredClone(rows)
 assert.deepEqual(storyBeats(rows,'zh').map(b=>b.text),['列车驶入货场。','远处的隧道冒着烟。'])
 assert.deepEqual(storyReceipts(rows).map(b=>b.text),['燃料 -5','抵达：灰石货场'])
 assert.deepEqual(storyReceipts(rows,rows),[])
 assert.deepEqual(rows,copy)
})
