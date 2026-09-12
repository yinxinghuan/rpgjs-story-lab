import {writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {originalTrainRuntime,originalCartridge} from '../server/original-train-runtime'
import {originalGameEntities} from '../src/original-game-projection'
import {originalEndingCartridge} from '../src/original-ending-capabilities'
import {buildEndingSnapshot} from '../src/vendor/original-train/engine/endingDirector'
import assert from 'node:assert/strict'
import {originalWorldWalkable,originalWorldSafePosition} from '../src/original-world-space'
import {findGridPath} from '../src/grid-path'
import {originalReleasedPresentation} from '../server/original-presentation'

// Bounded, deterministic offline exploration. Uses the real author policy and
// UI-offered actions; no injected resources, model calls, or production saves.
const spatial=process.argv.includes('--spatial'),sampleCount=Number(process.env.ORIGINAL_BRANCH_SAMPLES??120)
assert.ok(Number.isSafeInteger(sampleCount)&&sampleCount>0&&sampleCount<=120)
const runtime=originalTrainRuntime(spatial?originalReleasedPresentation:()=>true)
let walkedRoutes=0,walkedPixels=0
const results:any[]=[],coverage=new Set<string>()
for(let seed=1;seed<=sampleCount;seed++){
 let random=seed,head=runtime.initial(seed%2?'zh':'en',crypto.randomUUID())
 const path:string[]=[],seen=new Set<string>()
 const semantic=()=>JSON.stringify([head.sceneId,head.save.stats,head.save.facts,head.save.inventory,head.save.partyMemberIds])
 let failure=''
 for(let step=0;step<90&&head.save.finale.status==='idle';step++){
  const signature=semantic(),offered=originalGameEntities(head).flatMap(e=>e.actions.map(a=>({e,a}))).filter(({a})=>!seen.has(signature+'|'+a.id))
  if(!offered.length){failure='NO_UNTRIED_OFFERED_ACTION';break}
  random=(Math.imul(random,1664525)+1013904223)>>>0
  const {e,a}=offered[random%offered.length];seen.add(signature+'|'+a.id);path.push(a.id);coverage.add(a.id)
  try{
   if(spatial){
    const start=originalWorldSafePosition(head,head.position),canWalk=(p:{x:number;y:number})=>originalWorldWalkable(head,p)
    const route=findGridPath(start,e.approach,canWalk)
    assert.ok(route.length,`OFFERED_ACTION_UNREACHABLE: ${head.sceneId}/${e.id}/${a.id}`)
    const points=[start,...route,e.approach]
    for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i],steps=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)));for(let n=0;n<=steps;n++){assert.ok(canWalk({x:from.x+(to.x-from.x)*n/steps,y:from.y+(to.y-from.y)*n/steps}),`ROUTE_CROSSES_BODY: ${head.sceneId}/${e.id}/${a.id}`);walkedPixels++}}
    walkedRoutes++
   }
   const body={action_id:crypto.randomUUID(),expected_version:head.version,sceneId:head.sceneId,target:e.id,position:e.approach},noModel=()=>{throw Error('UNEXPECTED_MODEL_REQUEST')}
   const result=await runtime.prepare(head,{...body,type:'action',action:a.id},noModel)
   const typed=await runtime.prepare(head,{...body,type:'free-input',text:a.label},noModel)
   assert.equal(result.accepted,true);assert.equal(typed.accepted,true)
   for(const key of ['stats','facts','inventory','partyMemberIds','relationships','characters','map','danger','finale'] as const)assert.deepEqual(typed.head.save[key],result.head.save[key],key+' differs for typed action '+a.id)
   head=seed%2?result.head:typed.head
  }
  catch(error){failure=String(error);break}
 }
 if(!failure&&head.save.finale.status==='idle')failure='STEP_BOUND'
 if(!failure){try{const snapshot=buildEndingSnapshot(head.save,originalEndingCartridge(head.save,originalCartridge(head.save.locale)))
  head=(await runtime.ending!.prepare(head,{ending_id:crypto.randomUUID(),expected_version:head.version,sceneId:head.sceneId,mapVersion:head.mapVersion,snapshot_id:snapshot.id})).head
  assert.equal(head.save.finale.status,'complete')
 }catch(error){failure=String(error)}}
 results.push({seed,path,status:head.save.finale.status,scene:head.sceneId,stats:head.save.stats,failure})
 if(failure){console.log(JSON.stringify(results.at(-1)));break}
 if(seed%20===0)console.log(JSON.stringify({completed:seed,actions:coverage.size}))
}
writeFileSync(join(tmpdir(),spatial?'original-spatial-branch-exploration.json':'original-branch-exploration.json'),JSON.stringify({scope:sampleCount+' deterministic sampled offline journeys; not exhaustive, not renderer or persistence QA',spatial,walkedRoutes,walkedPixels,results,coverage:[...coverage].sort()},null,2))
console.log(JSON.stringify({journeys:results.length,failures:results.filter(r=>r.failure).length,actions:coverage.size}))
assert.equal(results.length,sampleCount,'Exploration stopped early; see the retained failing path')
assert.ok(results.every(r=>!r.failure&&r.status==='complete'),'A sampled journey did not complete')
