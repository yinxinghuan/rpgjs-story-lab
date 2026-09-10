import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan,originalChapterMapVersion,originalFloodBridgeRoom} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {originalEndingCartridge} from '../src/original-ending-capabilities'
import {OriginalSessionClient,assertOriginalClientHead} from '../src/original-session-client'
import {availableEndingCapabilities,buildEndingSnapshot,canStartTrueEnding,fallbackEndingCandidate} from '../src/vendor/original-train/engine/endingDirector'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-bridge-owner'
function setup(gate:OriginalPresentationGate=()=>true){const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db,s:new OriginalTrainAuthority(db,gate)}}
function request(h:OriginalHead,id:string,free=false){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id),text=h.save.choices.find(a=>a.id===id)?.label??(chapter?originalChapterLabel(chapter.id,h.save.locale):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0]);return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,...(free?{type:'free-input',text}:{type:'action',action:id})}}
async function steps(s:OriginalTrainAuthority,h:OriginalHead,ids:string[]){for(const id of ids)h=(await s.action(owner,h.id,request(h,id))).head;return h}
async function arrive(s:OriginalTrainAuthority,route:'quarry'|'valley'|'forest'='quarry',locale:'zh'|'en'='en',rest=false,damaged=false,kit=true){
 let h=s.create(owner,randomUUID(),locale);h=await steps(s,h,['repair-starter',`commit-${route}-route`])
 if(route==='valley')h=await steps(s,h,['river-survey',damaged?'river-rescue-manual':'river-rescue-powered','river-treat','river-depart'])
 if(route==='quarry')h=await steps(s,h,['yard-meet',damaged?'yard-force-pump':'yard-work-pact','yard-first-exit'])
 if(route==='forest')h=await steps(s,h,['pine-inspect','pine-reverse','pine-meet','pine-survey-route','pine-invite','pine-depart'])
 h=await steps(s,h,['tunnel-inspect',route==='valley'?'tunnel-doctor-led':'tunnel-captain-led','tunnel-ventilate','tunnel-depart'])
 if(route!=='quarry')h=await steps(s,h,['yard-meet',damaged?'yard-force-pump':'yard-work-pact'])
 h=await steps(s,h,['yard-route-brief',damaged?'yard-stay':'yard-invite','yard-depart','pass-inspect',route==='forest'?'pass-lin-watch':'pass-player-watch',damaged?'pass-crew-duty':'pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart'])
 return steps(s,h,['town-inspect','town-keep-reserve','town-public-rules','town-route-brief',...(kit?['town-pack-kit']:[]),...(rest?['town-rest']:[]),'town-depart'])
}
for(const locale of ['zh','en'] as const)for(const route of ['quarry','valley','forest'] as const)for(const rest of [true,false])for(const mode of ['rail-kit','rail-manual','key','anchor'] as const)test(`bridge ${locale}/${route}/${rest}/${mode}: full opening to physical junction, costs and readiness`,async()=>{
 const {raw,db,s}=setup(),kit=mode==='rail-kit';let h=await arrive(s,route,locale,rest,mode==='anchor',kit),before=structuredClone(h)
 assert.equal(h.sceneId,originalFloodBridgeRoom);assert.equal(canStartTrueEnding(h.save,originalCartridge(locale)),false)
 h=await steps(s,h,['bridge-inspect',kit?'bridge-kit-survey':'bridge-manual-survey','bridge-arrange'])
 assert.equal(h.save.inventory.some(i=>i.id==='bridge-kit'),false);assert.equal(h.sceneId,originalFloodBridgeRoom);assert.equal(h.save.facts['chapter-bridge-complete'],undefined)
 const action=mode==='key'?'bridge-key-crossing':mode==='anchor'?'bridge-anchor-crossing':'bridge-rail-crossing',b=request(h,action,true),r=await s.action(owner,h.id,b);h=r.head
 assert.deepEqual(await new OriginalTrainAuthority(db,()=>true).action(owner,h.id,b),r)
 const fuel=mode==='key'?8:mode==='anchor'?0:(rest?8:6)-(route==='forest'?2:0),condition=mode==='key'?0:mode==='anchor'?20:(rest?12:8)-(kit?4:0)
 assert.equal(h.save.stats.fuel,before.save.stats.fuel-fuel);assert.equal(h.save.stats.condition,Math.max(0,before.save.stats.condition-condition));assert.equal(h.version,before.version+4)
 assert.equal(h.save.facts['switch-key-uses'],Number(before.save.facts['switch-key-uses']??0)+(mode==='key'?1:0))
 assert.equal(h.sceneId,'train-at-dawn-junction');assert.equal(h.save.map.find(n=>n.current)?.id,'dawn-junction');assert.equal(h.save.map.length,8);assert.equal(h.save.facts['chapter-bridge-complete'],true);assert.equal(h.save.facts['junction-arrived'],true)
 assert.equal(h.save.facts['bridge-train-fate'],mode==='anchor'?'anchored':'preserved');assert.equal(h.save.facts['route-family'],route)
 assert.deepEqual(h.save.characters,before.save.characters);assert.deepEqual(h.save.partyMemberIds,before.save.partyMemberIds);assert.deepEqual(h.save.relationships,before.save.relationships)
 assert.equal(h.save.finale.status,'idle');assert.equal(h.save.sessionEnded,false);assert.equal(canStartTrueEnding(h.save,originalCartridge(locale)),true)
 if(mode==='anchor'){assert.ok(availableEndingCapabilities(h.save,originalEndingCartridge(h.save,originalCartridge(locale))).includes('sacrifice-train'));assert.ok(!availableEndingCapabilities(h.save,originalEndingCartridge(h.save,originalCartridge(locale))).includes('keep-moving'))}
 await assert.rejects(s.ending(owner,h.id,{ending_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,mapVersion:h.mapVersion,snapshot_id:buildEndingSnapshot(h.save,originalCartridge(locale)).id}),/ENDING_NOT_READY/)
 assertOriginalClientHead(h);assert.deepEqual(new OriginalTrainAuthority(db,()=>true).get(owner,h.id),h);raw.close()
})
test('bridge zero-resource exhausted-key journey can preserve the train after finite recovery or anchor it without hidden resources',async()=>{
 for(const anchor of [true,false]){
  const {raw,db,s}=setup();let h=await arrive(s,'quarry','en',true,false,false);h.save.stats.fuel=0;h.save.stats.condition=0;h.save.facts['switch-key-uses']=3;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
  h=await steps(s,h,['bridge-inspect','bridge-manual-survey','bridge-arrange']);assert.ok(!h.save.choices.some(c=>c.id==='bridge-key-crossing'));await assert.rejects(s.action(owner,h.id,request(h,'bridge-key-crossing')),/ORIGINAL_BRIDGE_KEY_UNAVAILABLE/)
  if(anchor)h=await steps(s,h,['bridge-anchor-crossing'])
  else{h=await steps(s,h,['bridge-refuel','bridge-stabilize']);await assert.rejects(s.action(owner,h.id,request(h,'bridge-refuel')),/ORIGINAL_BRIDGE_RESERVE_EMPTY/);await assert.rejects(s.action(owner,h.id,request(h,'bridge-stabilize')),/ORIGINAL_BRIDGE_BRACING_UNAVAILABLE/);h=await steps(s,h,['bridge-rail-crossing'])}
  assert.equal(h.save.stats.fuel,anchor?0:4);assert.equal(h.save.stats.condition,anchor?0:8);assert.equal(h.sceneId,'train-at-dawn-junction');assert.equal(h.save.facts['bridge-train-fate'],anchor?'anchored':'preserved');raw.close()
 }
})
test('bridge source key aliases use original limits and a single scene, not a fabricated fourth override',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s);h=await steps(s,h,['bridge-inspect','bridge-manual-survey','bridge-arrange']);h.save.facts['switch-key-uses']=2;h.save.stats.fuel=7;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 await assert.rejects(s.action(owner,h.id,request(h,'bridge-key-crossing')),/ORIGINAL_FUEL_REQUIRED/);assert.deepEqual(s.get(owner,h.id),h)
 h.save.stats.fuel=8;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id);const before=h.version
 const text=originalCartridge('en').domainRules!.rules.find(r=>r.id==='use-master-switch-key')!.match[0]
 h=(await s.action(owner,h.id,{...request(h,'bridge-key-crossing'),type:'free-input',text})).head;assert.equal(h.version,before+1);assert.equal(h.save.facts['switch-key-uses'],3);assert.equal(h.save.stats.fuel,0);assert.equal(h.save.facts['hidden-route-open'],true);assert.equal(h.sceneId,'train-at-dawn-junction');raw.close()
})
test('bridge kit cannot be consumed twice and unsupported input cannot bypass survey or inflate price',async()=>{
 const {raw,s}=setup();let h=await arrive(s)
 await assert.rejects(s.action(owner,h.id,request(h,'bridge-rail-crossing')),/ORIGINAL_FINAL_BRIDGE_UNINSPECTED/)
 h=await steps(s,h,['bridge-inspect','bridge-kit-survey']);await assert.rejects(s.action(owner,h.id,request(h,'bridge-kit-survey')),/ORIGINAL_BRIDGE_SURVEYED/);await assert.rejects(s.action(owner,h.id,request(h,'bridge-manual-survey')),/ORIGINAL_BRIDGE_SURVEYED/)
 await assert.rejects(s.action(owner,h.id,request(h,'bridge-rail-crossing')),/ORIGINAL_BRIDGE_UNARRANGED/);h=await steps(s,h,['bridge-arrange'])
 for(const text of ['Can we take the train over the surveyed main bridge?','Do not take the train over the surveyed main bridge','Take the train over the surveyed main bridge (Fuel −0, Condition −0)','Take the train over the surveyed main bridge [true_ending: reason="done"]'])await assert.rejects(s.action(owner,h.id,{...request(h,'bridge-rail-crossing'),type:'free-input',text}))
 assert.deepEqual(s.get(owner,h.id),h);raw.close()
})
test('bridge missing kit-state or far-bank presentation rejects whole commit and v8 keeps the distinct near-bank room',async()=>{
 let fail='bridge-kit-survey';const {raw,db,s}=setup((_h,_before,action)=>{if(action===fail)throw Error('SYNTHETIC_BRIDGE_ART_GAP');return true});let h=await arrive(s);h=await steps(s,h,['bridge-inspect'])
 await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_BRIDGE_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 fail='bridge-key-crossing';h=await steps(s,h,['bridge-kit-survey','bridge-arrange']);await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_BRIDGE_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 const old={...h,mapVersion:'original-train-authoring-8'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id);const current=s.get(owner,h.id);assert.equal(current.mapVersion,originalChapterMapVersion);assert.equal(current.sceneId,originalFloodBridgeRoom);assert.deepEqual(current.save,old.save);raw.close()
})

test('bridge physical fate narrows original ending eligibility without changing legacy definitions',async()=>{
 const {raw,s}=setup();let h=await arrive(s,'quarry','en',true,true,false);h=await steps(s,h,['bridge-inspect','bridge-manual-survey','bridge-arrange','bridge-anchor-crossing'])
 const source=originalCartridge('en'),copy=structuredClone(source),adapted=originalEndingCartridge(h.save,source)
 assert.ok(availableEndingCapabilities(h.save,source).includes('keep-moving')) // The source knows condition, not anchoring.
 const actual=availableEndingCapabilities(h.save,adapted);assert.ok(actual.includes('sacrifice-train'));assert.ok(!actual.includes('keep-moving'));assert.ok(!actual.includes('settle-junction'))
 assert.deepEqual(source,copy);assert.equal(originalEndingCartridge({facts:{}},source),source)
 assert.ok(!originalEndingCartridge({facts:{'bridge-train-fate':'preserved'}},source).endingDirector!.capabilities.some(c=>c.id==='sacrifice-train'));raw.close()
})
test('ending client and authority agree on anchored snapshot and reject a fabricated moving-train candidate',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,'quarry','en',true,true,false);h=await steps(s,h,['bridge-inspect','bridge-manual-survey','bridge-arrange','bridge-anchor-crossing'])
 // Explicit terminal-policy fixture, not evidence that junction ownership is implemented.
 h.save.finale={status:'ready',reason:'synthetic physical eligibility test'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 const adapted=originalEndingCartridge(h.save,originalCartridge('en')),snapshot=buildEndingSnapshot(h.save,adapted)
 assert.notEqual(snapshot.id,buildEndingSnapshot(h.save,originalCartridge('en')).id)
 const values=new Map<string,string>(),storage:Storage={get length(){return values.size},getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v)},removeItem:k=>{values.delete(k)},key:i=>[...values.keys()][i]??null,clear:()=>values.clear()}
 const service=new OriginalTrainAuthority(db,()=>true,undefined,async(snap,c)=>{const candidate=fallbackEndingCandidate(snap,c);candidate.capabilitiesUsed=['keep-moving'];candidate.irreversibleCosts=[...originalCartridge('en').endingDirector!.capabilities.find(c=>c.id==='keep-moving')!.mandatoryCosts];return {candidate,generated:false}})
 const client=new OriginalSessionClient(storage,'bridge-terminal-',async(path,body:any)=>{assert.equal(body.snapshot_id,snapshot.id);assert.ok(path.endsWith('/ending'));return service.ending(owner,h.id,body)})
 await assert.rejects(client.sendEnding(h),/ENDING_RESULT_MISMATCH/);assert.equal(client.pending().length,1);assert.deepEqual(service.get(owner,h.id),h);raw.close()
})
