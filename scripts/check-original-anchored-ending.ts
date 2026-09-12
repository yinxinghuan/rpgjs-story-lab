/** One fresh synthetic production route; no model, media or old player data. */
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {existsSync,writeFileSync} from 'node:fs'
import {originalSessionHttp} from '../src/original-session-http'
import {RELEASE_ID} from '../src/runtime-contract'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalCartridge} from '../server/original-train-runtime'
import {originalEndingCartridge} from '../src/original-ending-capabilities'
import {buildEndingSnapshot} from '../src/vendor/original-train/engine/endingDirector'
const out=process.argv[2]
if(!out||existsSync(out)||process.argv[3]!=='--allow-new-test-journey')throw Error('FRESH_REPORT_AND_EXPLICIT_TEST_FLAG_REQUIRED')
const base='https://game.aiwaves.tech/cb90357b-fe01-48ab-b14b-0620eb0d556e',values=new Map<string,string>()
const storage={get length(){return values.size},getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>{values.set(k,v)},removeItem:(k:string)=>{values.delete(k)},key:(i:number)=>[...values.keys()][i]??null,clear:()=>values.clear()} as Storage
let requests=0
const request:typeof fetch=async(input,init)=>{requests++;return fetch(input,{...init,credentials:'omit',signal:AbortSignal.timeout(30000)})}
const health=await(await request(base+'/api/health')).json();assert.equal(health.release,RELEASE_ID)
const connection=originalSessionHttp(storage,async(_key,work)=>work(),request,base),world=originalTrainChapterSpatialPlan()
let head=await connection.client.enroll('en');const bindings=structuredClone(head.assets),id=head.id
const route=['repair-starter','commit-quarry-route','yard-meet','yard-force-pump','yard-first-exit','tunnel-inspect','tunnel-captain-led','tunnel-ventilate','tunnel-depart','yard-route-brief','yard-stay','yard-depart','pass-inspect','pass-player-watch','pass-crew-duty','pass-gravel-siding','pass-debrief','pass-depart','town-inspect','town-grid-aid','town-public-rules','town-refuel','town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange','bridge-anchor-crossing','junction-review','junction-the-last-bridge']
for(const action of route){
 const entity=world.entities.find(e=>e.scene===head.sceneId&&e.actions.includes(action));assert.ok(entity,action)
 const before=head,body={action_id:randomUUID(),expected_version:head.version,sceneId:head.sceneId,target:entity.id,position:entity.approach,type:'action',action}
 const result=await connection.api('/sessions/'+id+'/actions',body);head=result.head
 assert.equal(head.version,before.version+1);assert.deepEqual(head.assets,bindings)
 if(action==='yard-force-pump'){assert.equal(head.save.stats.fuel,before.save.stats.fuel+20);assert.equal(head.save.stats.condition,before.save.stats.condition-12);assert.equal(head.save.stats.morale,before.save.stats.morale-8);assert.deepEqual(await connection.api('/sessions/'+id+'/actions',body),result)}
 if(action==='junction-review')assert.ok(head.save.choices.find((c:any)=>c.id==='junction-the-last-bridge')?.label.includes('maintain the foot crossing'))
}
const before=structuredClone(head),body={ending_id:randomUUID(),expected_version:head.version,sceneId:head.sceneId,mapVersion:head.mapVersion,snapshot_id:buildEndingSnapshot(head.save,originalEndingCartridge(head.save,originalCartridge('en'))).id}
const result=await connection.api('/sessions/'+id+'/ending',body),ending=result.head.save.finale.ending
assert.equal(ending.anchorFamily,'the-last-bridge');assert.ok(ending.irreversibleCosts.some((s:string)=>s.includes('maintain the foot crossing')));assert.ok(!ending.irreversibleCosts.some((s:string)=>s.includes('reserve carriage space')))
assert.deepEqual({...result.head.save,finale:before.save.finale},before.save)
assert.deepEqual(await connection.api('/sessions/'+id+'/ending',body),result);assert.deepEqual(await connection.api('/sessions/'+id),result.head)
const backup=await connection.api('/sessions/'+id+'/backup');assert.equal(backup.payload.tables.narration_usage.length,0)
const report={release:RELEASE_ID,at:new Date().toISOString(),requests,newSyntheticJourneys:1,actions:route.length,finalVersion:result.head.version,ending:ending.anchorFamily,costs:ending.irreversibleCosts,forcedCostsRetained:true,sameReceipt:true,endingRestored:true,assetsRetained:true,narrationQuotaRows:0,modelOrMediaRequests:0,realPlayerDataRead:false}
writeFileSync(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
