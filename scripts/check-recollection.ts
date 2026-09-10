/** New synthetic journey only. Never log or persist capabilities or save bodies. */
import assert from 'node:assert/strict'
import {randomBytes,randomUUID} from 'node:crypto'
import {RUNTIME_HEADER,RUNTIME_CONTRACT,RELEASE_ID} from '../src/runtime-contract'
import {approachPoints} from '../src/scene-layout'
import {recentConversation} from '../src/conversation-context'
import type {Head} from '../src/journey-runtime'
const base=process.argv[2]
if(!base||!process.argv.includes('--allow-new-test-journeys'))throw Error('Explicit base and --allow-new-test-journeys required')
const url=new URL(base)
if(url.search||url.hash||(url.protocol!=='https:'&&!(process.argv.includes('--loopback')&&url.protocol==='http:'&&['127.0.0.1','localhost'].includes(url.hostname))))throw Error('Invalid test origin')
const api=new URL('./api/lab',url.href.endsWith('/')?url.href:url.href+'/').href
const owner=randomBytes(32).toString('base64url')
let calls=0
async function call(path:string,body?:unknown){
 calls++
 const r=await fetch(api+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+owner,[RUNTIME_HEADER]:RUNTIME_CONTRACT},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(30000)})
 assert.equal(r.status,200);assert.equal(r.headers.get(RUNTIME_HEADER),RUNTIME_CONTRACT)
 return r.json()
}
assert.equal((await call('/health')).release,RELEASE_ID)
let head:Head=await call('/sessions',{enrollment_id:randomUUID(),locale:'zh'})
async function action(input:{type:'action';action:string}|{type:'free-input';text:string}){
 const body={action_id:randomUUID(),expected_version:head.version,sceneId:'carriage',target:'lin',position:approachPoints.lin,mode:'local',...input}
 const result=await call('/sessions/'+head.id+'/actions',body)
 assert.equal(result.accepted,input.type==='action');assert.equal(result.kind,input.type==='action'?'action':'dialogue');assert.equal(result.head.version,head.version+1);head=result.head
 assert.deepEqual(await call('/sessions/'+head.id+'/actions',body),result)
 return result
}
await action({type:'action',action:'meet-lin'})
const statement='我担心停电后找不到出口。'
for(const text of [statement,'今天的雨很久。','车里的灯色很暖。','我喜欢听列车的声音。','你一直守在这里。','这段路很安静。','窗外仍有雨声。'])await action({type:'free-input',text})
assert.ok(!JSON.stringify(recentConversation(head.save,'lin')).includes(statement))
const mechanics=(h:Head)=>({facts:h.save.facts,stats:h.save.stats,inventory:h.save.inventory,relationships:h.save.relationships,map:h.save.map})
const before=structuredClone(head)
await action({type:'free-input',text:'你还记得我之前担心什么吗？'})
assert.ok(head.save.blocks.some(b=>b.kind==='narration'&&b.text.includes('你之前跟我说过：“'+statement+'”')))
assert.deepEqual(mechanics(head),mechanics(before))
assert.deepEqual(await call('/sessions/'+head.id),head)
await action({type:'free-input',text:'你还记得我之前担心什么吗？'})
assert.ok(head.save.blocks.filter(b=>b.kind==='narration'&&b.text.includes('你之前跟我说过：“'+statement+'”')).length===2)
assert.deepEqual(mechanics(head),mechanics(before))
console.log(JSON.stringify({base:url.href,release:RELEASE_ID,calls,result:'pass',checks:['older-than-four-turns','exact-quote','same-speaker','local-mode-only','receipt-replay','authoritative-reopen','no-mechanical-effects']},null,2))
