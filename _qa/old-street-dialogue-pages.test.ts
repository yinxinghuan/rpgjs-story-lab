import test from 'node:test'
import assert from 'node:assert/strict'
import {oldStreetDialoguePages} from '../src/old-street-dialogue-pages'
import type {StoryBlock} from '../src/vendor/original-train/types'
for(const locale of ['zh','en'] as const)test(`dialogue pagination preserves introduction and reply verbatim (${locale})`,()=>{
 const text=locale==='zh'?'她扶了扶眼镜：“我是诺拉。照片放在那张桌子上，你可以慢慢看看。”'.repeat(5):'Nora adjusts her glasses. The photographs are on the table. Take your time looking through them. '.repeat(5)
 const blocks:StoryBlock[]=[{id:'intro',kind:'narration',text},{id:'question',kind:'dialogue',text:'Already typed',data:{oldStreetRole:'player'}},{id:'answer',kind:'dialogue',speaker:'Nora',text:'Here is the reply.'}]
 const saved=JSON.stringify(blocks),pages=oldStreetDialoguePages(blocks,locale)
 assert.equal(pages.filter(p=>p.id.startsWith('intro:')).map(p=>p.text).join(''),text)
 assert.equal(pages.at(-1)?.speaker,'Nora');assert.equal(pages.at(-1)?.text,'Here is the reply.')
 assert.ok(!pages.some(p=>p.text==='Already typed'));assert.equal(JSON.stringify(blocks),saved)
 assert.ok(pages.filter(p=>p.id.startsWith('intro:')).every(p=>p.text.length<=(locale==='zh'?64:180)))
 assert.deepEqual(oldStreetDialoguePages([],locale),[])
})
