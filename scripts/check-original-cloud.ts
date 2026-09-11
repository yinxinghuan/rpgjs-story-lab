import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {originalSessionHttp} from '../src/original-session-http'
import {originalGameEntities} from '../src/original-game-projection'
import {environmentStoryRoute} from '../_qa/environment-story-route'
import {GAME_ID} from '../src/game-id'
const base=(process.argv[2]??'').replace(/\/$/,'')
if(!process.argv.includes('--allow-new-test-journeys')||base!=='https://game.aiwaves.tech/'+GAME_ID)throw Error('EXPLICIT_CANONICAL_SYNTHETIC_TEST_REQUIRED')
const output:any[]=[]
for(const locale of ['zh','en']as const){
 const values=new Map<string,string>(),store={get length(){return values.size},getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>{values.delete(k)},key:(i:number)=>[...values.keys()][i]??null,clear:()=>values.clear()} as Storage
 const lock=async<T>(_key:string,fn:()=>Promise<T>)=>fn();let lose='',calls=0
 const request:typeof fetch=async(input,init)=>{calls++;const r=await fetch(input,init);if(lose&&init?.method==='POST'&&String(input).endsWith(lose)&&r.ok){lose='';await r.arrayBuffer();throw new TypeError('SYNTHETIC_LOST_RESPONSE')}return r}
 const connection=originalSessionHttp(store,lock,request,base)
 const health=await connection.api('/health');assert.equal(health.production,true)
 lose='/sessions';await assert.rejects(connection.client.enroll(locale));let head=await connection.client.enroll(locale),initial=head.id
 const steps=locale==='zh'?[...environmentStoryRoute]:['repair-starter','commit-valley-route','river-survey','river-rescue-manual','river-treat','river-depart',...environmentStoryRoute.slice(9).map(a=>a==='tunnel-captain-led'?'tunnel-doctor-led':a==='pass-lin-watch'?'pass-player-watch':a==='yard-work-pact'?'yard-medical-pact':a)]
 for(const [i,id]of steps.entries()){
  const entity=originalGameEntities(head).find(e=>e.actions.some(a=>a.id===id));assert.ok(entity,id)
  const body={target:entity.id,position:entity.approach,type:'action',action:id}
  if(i===0){lose='/actions';await assert.rejects(connection.client.send(head,body));head=(await connection.client.recover()).head}else head=(await connection.client.send(head,body)).head
  assert.equal(head.id,initial);assert.equal(head.version,i+1)
 }
 assert.equal(head.save.finale.status,'ready');lose='/ending';await assert.rejects(connection.client.sendEnding(head));head=(await connection.client.recover()).head;assert.equal(head.save.finale.status,'complete');assert.deepEqual(await connection.client.enroll(locale),head)
 output.push({locale,journey:initial,version:head.version,scenes:head.save.map.filter(m=>m.visited).map(m=>m.id),ending:head.save.finale.ending?.anchorFamily,stats:head.save.stats,requests:calls,lostEnrollmentActionEndingRecovered:true})
}
console.log(JSON.stringify({at:new Date().toISOString(),base,modelRequests:0,syntheticOnly:true,results:output},null,2))
