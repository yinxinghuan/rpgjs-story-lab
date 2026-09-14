import {writeFileSync,mkdirSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import assert from 'node:assert/strict'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalReleasedPresentation} from '../server/original-presentation'
import {originalGameEntities} from '../src/original-game-projection'
import {dieselReleases,dieselFacts} from '../src/original-diesel-art'
import {originalWorldWalkabilitySnapshot,originalWorldSafePosition} from '../src/original-world-space'
import {findGridPath} from '../src/grid-path'
const out=join(tmpdir(),'rpg-diesel-scenes');mkdirSync(out,{recursive:true})
const runtime=originalTrainRuntime(originalReleasedPresentation),captured=new Set<string>(),routes:any[]=[]
for(let seed=1;seed<=20&&captured.size<5;seed++){
 let h=runtime.initial('zh',crypto.randomUUID()),random=seed
 if(h.assets?.version!==1)throw Error('QA_BINDINGS')
 for(const [release,{entityId}] of Object.entries(dieselReleases))assert.equal(h.assets.fixedEquipment?.[entityId],release,'New journeys must enroll the reviewed default')
 const seen=new Set<string>(),path:string[]=[]
 for(let step=0;step<90&&h.save.finale.status==='idle';step++){
  const entities=originalGameEntities(h)
  for(const e of entities)if(Object.hasOwn(dieselFacts,e.id)&&!captured.has(e.id)){
   const snapshot=structuredClone(h);snapshot.position=e.approach
   writeFileSync(join(out,e.id+'.json'),JSON.stringify({head:snapshot,path:[...path]},null,2));captured.add(e.id)
  }
  const signature=JSON.stringify([h.sceneId,h.save.stats,h.save.facts,h.save.inventory,h.save.partyMemberIds])
  const offered=entities.flatMap(e=>e.actions.map(a=>({e,a}))).filter(({a})=>!seen.has(signature+'|'+a.id))
  if(!offered.length)break
  random=(Math.imul(random,1664525)+1013904223)>>>0
  const {e,a}=offered[random%offered.length];seen.add(signature+'|'+a.id)
  const walkable=originalWorldWalkabilitySnapshot(h),start=originalWorldSafePosition(h,h.position),route=findGridPath(start,e.approach,walkable)
  assert.ok(route.length,'UNREACHABLE '+h.sceneId+'/'+a.id)
  const points=[start,...route,e.approach]
  for(let i=1;i<points.length;i++){const from=points[i-1],to=points[i],n=Math.max(1,Math.ceil(Math.hypot(to.x-from.x,to.y-from.y)));for(let k=0;k<=n;k++)assert.ok(walkable({x:from.x+(to.x-from.x)*k/n,y:from.y+(to.y-from.y)*k/n}),a.id+' crosses obstacle')}
  const result=await runtime.prepare(h,{action_id:crypto.randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:e.approach,target:e.id,type:'action',action:a.id},()=>{throw Error('QA_EXTERNAL_MODEL_FORBIDDEN')})
  assert.equal(result.accepted,true);h=result.head;path.push(a.id)
 }
 routes.push({seed,path,scene:h.sceneId,finale:h.save.finale.status})
}
assert.equal(captured.size,5,'All reserve scenes need a real authored path')
writeFileSync(join(out,'report.json'),JSON.stringify({scope:'Authored routes with current new-journey diesel bindings; per-pixel collision verification, not rendered/mobile acceptance',captured:[...captured],routes},null,2))
console.log(JSON.stringify({out,captured:[...captured],journeys:routes.length,actions:routes.reduce((n,r)=>n+r.path.length,0)}))
