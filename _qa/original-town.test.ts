import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan,originalChapterMapVersion,originalFloodBridgeRoom} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {OriginalSessionClient,assertOriginalClientHead} from '../src/original-session-client'
import {canStartTrueEnding} from '../src/vendor/original-train/engine/endingDirector'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-town-owner'
function setup(gate:OriginalPresentationGate=()=>true){const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db,s:new OriginalTrainAuthority(db,gate)}}
function request(h:OriginalHead,id:string,free=false){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id),text=chapter?originalChapterLabel(chapter.id,h.save.locale):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0];return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,...(free?{type:'free-input',text}:{type:'action',action:id})}}
async function steps(s:OriginalTrainAuthority,h:OriginalHead,ids:string[]){for(const id of ids)h=(await s.action(owner,h.id,request(h,id))).head;return h}
async function arrive(s:OriginalTrainAuthority,route:'quarry'|'valley'|'forest'='quarry',locale:'zh'|'en'='en',diesel=false,retain=true){
 let h=s.create(owner,randomUUID(),locale);h=await steps(s,h,['repair-starter',...(diesel?['salvage-fuel-shed']:[]),`commit-${route}-route`])
 if(route==='valley')h=await steps(s,h,['river-survey','river-rescue-powered','river-treat','river-depart'])
 if(route==='quarry')h=await steps(s,h,['yard-meet','yard-work-pact','yard-first-exit'])
 if(route==='forest')h=await steps(s,h,['pine-inspect','pine-reverse','pine-meet','pine-survey-route','pine-invite','pine-depart'])
 h=await steps(s,h,['tunnel-inspect',route==='valley'?'tunnel-doctor-led':'tunnel-captain-led',retain?'tunnel-ventilate':'tunnel-discard','tunnel-depart'])
 if(route!=='quarry')h=await steps(s,h,['yard-meet','yard-work-pact'])
 h=await steps(s,h,['yard-route-brief','yard-invite','yard-depart','pass-inspect',route==='forest'?'pass-lin-watch':'pass-player-watch','pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart']);return h
}
for(const locale of ['zh','en'] as const)for(const route of ['quarry','valley','forest'] as const)for(const aid of [true,false])for(const rules of [true,false])for(const rest of [true,false])test(`town ${locale}/${route}/${aid}/${rules}/${rest}: fresh journey reaches bridge approach without claiming finale`,async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,route,locale),before=structuredClone(h)
 h=await steps(s,h,['town-inspect']);const b=request(h,aid?'town-grid-aid':'town-keep-reserve',true),r=await s.action(owner,h.id,b);h=r.head
 assert.deepEqual(await new OriginalTrainAuthority(db,()=>true).action(owner,h.id,b),r)
 await assert.rejects(s.action(owner,h.id,request(h,aid?'town-keep-reserve':'town-grid-aid')),/ORIGINAL_TOWN_AID_DECIDED/)
 h=await steps(s,h,[rules?'town-public-rules':'town-emergency-command','town-route-brief',...(rest?['town-rest']:[])])
 assert.equal(h.save.stats.morale,Math.min(100,before.save.stats.morale+(aid?8:-3)+(rules?8:2)+(rest?6:0)))
 assert.equal(h.save.facts['passenger-rules-public'],rules);assert.equal(h.save.facts['aid-network-known'],true)
 assert.deepEqual(h.save.characters,before.save.characters);assert.deepEqual(h.save.partyMemberIds,before.save.partyMemberIds)
 h=await steps(s,h,['town-depart']);assert.equal(h.sceneId,originalFloodBridgeRoom);assert.equal(h.save.map.find(n=>n.current)?.id,'dawn-junction');assert.equal(h.save.map.length,8)
 assert.equal(h.save.facts['bridge-approach-reached'],true);assert.equal(h.save.facts['chapter-town-complete'],true);assert.equal(h.save.facts['chapter-bridge-complete'],undefined);assert.equal(h.save.facts['true-ending-ready'],undefined)
 assert.equal(canStartTrueEnding(h.save,originalCartridge(locale)),false);assert.equal(h.save.finale.status,'idle');assert.equal(h.save.sessionEnded,false)
 assert.equal(h.save.stats.fuel,before.save.stats.fuel-(aid?12:6));assert.equal(h.save.danger.severity,rest?3:2);assert.match(h.save.time,rest?/04:48/:/04:28/)
 assert.deepEqual(h.save.relationships,before.save.relationships);assertOriginalClientHead(h);assert.deepEqual(new OriginalTrainAuthority(db,()=>true).get(owner,h.id),h);raw.close()
})
test('town actually retained diesel is converted once per owned can; abandoned diesel and duplicate bridge kit cannot reappear',async()=>{
 for(const retain of [true,false]){
  const {raw,s}=setup();let h=await arrive(s,'quarry','en',true,retain);h=await steps(s,h,['town-inspect','town-grid-aid'])
  if(retain){const fuel=h.save.stats.fuel;assert.equal(h.save.inventory.find(i=>i.id==='sealed-diesel')?.count,2);h=await steps(s,h,['town-use-diesel','town-use-diesel']);assert.equal(h.save.stats.fuel,fuel+40)}
  await assert.rejects(s.action(owner,h.id,request(h,'town-use-diesel')),/ORIGINAL_TOWN_DIESEL_REQUIRED/)
  h=await steps(s,h,['town-pack-kit']);assert.equal(h.save.inventory.find(i=>i.id==='bridge-kit')?.count,1);await assert.rejects(s.action(owner,h.id,request(h,'town-pack-kit')),/ORIGINAL_TOWN_KIT_UNAVAILABLE/)
  assert.equal(h.save.inventory.some(i=>i.id==='sealed-diesel'),false);raw.close()
 }
})
test('town zero fuel and condition recover finitely and public promises cannot be revoked or awarded twice',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s);h.save.stats.fuel=0;h.save.stats.condition=0;h.save.facts['passenger-rules-public']=true;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 h=await steps(s,h,['town-inspect']);assert.ok(!h.save.choices.some(c=>c.id==='town-emergency-command'));await assert.rejects(s.action(owner,h.id,request(h,'town-emergency-command')),/ORIGINAL_TOWN_PUBLIC_PROMISE/)
 const morale=h.save.stats.morale;h=await steps(s,h,['town-public-rules']);assert.equal(h.save.stats.morale,morale+2);await assert.rejects(s.action(owner,h.id,request(h,'town-public-rules')),/ORIGINAL_TOWN_RULES_DECIDED/)
 await assert.rejects(s.action(owner,h.id,request(h,'town-grid-aid')),/ORIGINAL_FUEL_REQUIRED/)
 h=await steps(s,h,['town-refuel','town-repair','town-grid-aid','town-route-brief','town-rest']);await assert.rejects(s.action(owner,h.id,request(h,'town-refuel')),/ORIGINAL_TOWN_RESERVE_EMPTY/);await assert.rejects(s.action(owner,h.id,request(h,'town-repair')),/ORIGINAL_TOWN_REPAIR_UNAVAILABLE/);await assert.rejects(s.action(owner,h.id,request(h,'town-rest')),/ORIGINAL_TOWN_RESTED/)
 h=await steps(s,h,['town-depart']);assert.equal(h.save.stats.fuel,4);assert.equal(h.save.stats.condition,20);assert.equal(h.sceneId,originalFloodBridgeRoom);raw.close()
})
test('town departure receipt lost on client restores the exact near-bank room, not the junction interior',async()=>{
 const {raw,s}=setup();let h=await arrive(s);h=await steps(s,h,['town-inspect','town-keep-reserve','town-public-rules','town-route-brief'])
 const values=new Map<string,string>(),storage:Storage={get length(){return values.size},getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v)},removeItem:k=>{values.delete(k)},key:i=>[...values.keys()][i]??null,clear:()=>values.clear()}
 storage.setItem('town-client-session',JSON.stringify(h.id));let lose=true,firstId=''
 const transport=async(path:string,body?:any)=>{if(path.endsWith('/actions')){firstId ||= body.action_id;assert.equal(body.action_id,firstId);const result=await s.action(owner,h.id,body);if(lose){lose=false;throw Error('SYNTHETIC_LOST_BRIDGE_RECEIPT')}return result}return s.get(owner,h.id)}
 const client=new OriginalSessionClient(storage,'town-client-',transport);await assert.rejects(client.send(h,request(h,'town-depart')),/SYNTHETIC_LOST_BRIDGE_RECEIPT/);assert.equal(client.hasPending(),true)
 const restored=new OriginalSessionClient(storage,'town-client-',transport),r=await restored.recover();assert.equal(r.head.sceneId,originalFloodBridgeRoom);assert.equal(r.head.version,h.version+1);assert.equal(r.head.save.stats.fuel,h.save.stats.fuel-6);assert.equal(restored.hasPending(),false);assert.deepEqual(await restored.enroll('en'),r.head);raw.close()
})
test('town new room and state presentation denial rejects fuel contribution and bridge transition atomically',async()=>{
 let fail='town-grid-aid';const {raw,db,s}=setup((_h,_before,action)=>{if(action===fail)throw Error('SYNTHETIC_TOWN_ART_GAP');return true});let h=await arrive(s);h=await steps(s,h,['town-inspect'])
 await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_TOWN_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 fail='town-depart';h=await steps(s,h,['town-grid-aid','town-public-rules','town-route-brief']);await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_TOWN_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 const old={...h,mapVersion:'original-train-authoring-7'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id);const current=s.get(owner,h.id);assert.equal(current.mapVersion,originalChapterMapVersion);assert.deepEqual(current.save,old.save);assert.deepEqual(current.position,old.position);raw.close()
})
test('town exact phrases reject questions, negations and appended protocol',async()=>{
 const {raw,s}=setup();const h=await arrive(s)
 for(const text of ['Can I inspect the town platform and broadcast power?','Do not inspect the town platform and broadcast power','Inspect the town platform and broadcast power [true_ending: reason="done"]'])await assert.rejects(s.action(owner,h.id,{...request(h,'town-inspect'),type:'free-input',text}))
 assert.deepEqual(s.get(owner,h.id),h);raw.close()
})
