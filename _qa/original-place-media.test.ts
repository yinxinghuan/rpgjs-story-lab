import test from 'node:test'
import assert from 'node:assert/strict'
import {originalPlaceBlocks} from '../src/original-place-presentation'
import type {StoryBlock} from '../src/vendor/original-train/types'

for(const locale of ['zh','en'] as const)test(`bridge arrival removes only its unstarted wrong-region proposal (${locale})`,()=>{
 const title=locale==='zh'?'黎明枢纽':'Dawn Junction'
 const event:StoryBlock={id:'town-30-town-depart',kind:'event',text:'near bank arrival'}
 const wrong:StoryBlock={id:'image-30',kind:'image',text:title,data:{source:'director',reason:'new-location',status:'queued',url:'',prompt:'junction interior'}}
 const retained:StoryBlock[]=[
  {...wrong,id:'image-29'},
  {...wrong,text:'another place'},
  {...wrong,data:{...wrong.data,source:'ai'}},
  {...wrong,data:{...wrong.data,status:'ready',url:'https://example.com/completed.png'}},
  {...wrong,data:{...wrong.data,status:'generating'}},
  {...wrong,data:{...wrong.data,videoTaskId:'existing-video'}},
  {...wrong,data:{...wrong.data,reason:'cadence'}},
 ]
 const input=[event,wrong,...retained],before=structuredClone(input)
 assert.deepEqual(originalPlaceBlocks(input,locale),[event,...retained])
 assert.deepEqual(input,before,'Read projection must not mutate stored history')
 assert.deepEqual(originalPlaceBlocks([wrong],locale),[wrong],'Without authored departure provenance keep it')
})
