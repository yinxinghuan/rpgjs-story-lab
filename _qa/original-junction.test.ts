import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan,originalChapterMapVersion} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {OriginalSessionClient} from '../src/original-session-client'
import {originalEndingCartridge} from '../src/original-ending-capabilities'
import {originalEndingOptionIds,originalEndingSpec,originalEndingCosts,availableOriginalEndingOptions,authoredOriginalEnding} from '../src/original-ending-options'
import {buildEndingSnapshot,validateEndingCandidate} from '../src/vendor/original-train/engine/endingDirector'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-junction-owner'
function storage(raw:DatabaseSync):AuthorityStorage{return {all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}}
function setup(gate:OriginalPresentationGate=()=>true){const raw=new DatabaseSync(':memory:'),db=storage(raw);return {raw,db,s:new OriginalTrainAuthority(db,gate)}}
function request(h:OriginalHead,id:string,free=false){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id),text=h.save.choices.find(a=>a.id===id)?.label??(chapter?originalChapterLabel(chapter.id,h.save.locale):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0]);return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,...(free?{type:'free-input',text}:{type:'action',action:id})}}
async function steps(s:OriginalTrainAuthority,h:OriginalHead,ids:string[]){for(const id of ids)h=(await s.action(owner,h.id,request(h,id))).head;return h}
async function arrive(s:OriginalTrainAuthority,locale:'zh'|'en'='en',doctor=false,anchor=false,aid=true,forest=false,linJoins=true){
 const route=forest?'forest':doctor?'valley':'quarry';let h=s.create(owner,randomUUID(),locale);h=await steps(s,h,['repair-starter',`commit-${route}-route`])
 if(doctor)h=await steps(s,h,['river-survey','river-rescue-manual','river-treat','river-depart'])
 else if(forest)h=await steps(s,h,['pine-inspect','pine-reverse','pine-meet','pine-survey-route',linJoins?'pine-invite':'pine-stay','pine-depart'])
 else h=await steps(s,h,['yard-meet',anchor?'yard-force-pump':'yard-work-pact','yard-first-exit'])
 h=await steps(s,h,['tunnel-inspect',doctor?'tunnel-doctor-led':'tunnel-captain-led','tunnel-ventilate','tunnel-depart'])
 if(doctor||forest)h=await steps(s,h,['yard-meet',anchor?'yard-force-pump':doctor?'yard-medical-pact':'yard-work-pact'])
 h=await steps(s,h,['yard-route-brief',anchor?'yard-stay':'yard-invite','yard-depart','pass-inspect',forest&&linJoins?'pass-lin-watch':'pass-player-watch',anchor?'pass-crew-duty':'pass-mako-duty','pass-gravel-siding','pass-debrief','pass-depart'])
 h=await steps(s,h,['town-inspect',aid?'town-grid-aid':'town-keep-reserve','town-public-rules','town-refuel',...(!anchor?['town-repair']:[]),'town-rest','town-route-brief','town-pack-kit','town-depart','bridge-inspect','bridge-kit-survey','bridge-arrange',anchor?'bridge-anchor-crossing':'bridge-rail-crossing'])
 return h
}
const endingRequest=(h:OriginalHead)=>({ending_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,mapVersion:h.mapVersion,snapshot_id:buildEndingSnapshot(h.save,originalEndingCartridge(h.save,originalCartridge(h.save.locale))).id})
for(const locale of ['zh','en'] as const)for(const doctor of [true,false])for(const option of originalEndingOptionIds)test(`junction ${locale}/${doctor}/${option}: fresh opening selects its own complete ending`,async()=>{
 const {raw,db,s}=setup(),anchor=['the-last-bridge','bridge-basic'].includes(option);let h=await arrive(s,locale,doctor,anchor),atJunction=structuredClone(h)
 assert.equal(h.save.finale.status,'idle');assert.deepEqual(h.save.choices.map(c=>c.id),['junction-review'])
 await assert.rejects(s.action(owner,h.id,request(h,'junction-'+option)),/ORIGINAL_JUNCTION_UNREVIEWED/)
 h=await steps(s,h,['junction-review']);assert.deepEqual(h.save.stats,atJunction.save.stats)
 const spec=originalEndingSpec(originalCartridge(locale),option)!,offered=h.save.choices.find(c=>c.id==='junction-'+option);assert.ok(offered,JSON.stringify(h.save.stats))
 for(const cost of originalEndingCosts(spec,originalEndingCartridge(h.save,originalCartridge(locale))))assert.ok(offered.label.includes(cost))
 const choice=request(h,'junction-'+option,true),chosen=await s.action(owner,h.id,choice);h=chosen.head
 assert.equal(h.save.finale.status,'ready');assert.equal(h.save.facts['junction-ending-choice'],option);assert.deepEqual(h.save.choices,[]);assert.deepEqual(h.save.stats,atJunction.save.stats)
 assert.deepEqual(await new OriginalTrainAuthority(db,()=>true).action(owner,h.id,choice),chosen)
 const before=structuredClone(h),b=endingRequest(h),r=await s.ending(owner,h.id,b),ending=r.head.save.finale.ending
 assert.equal(r.kind,'ending');assert.equal(r.source,'author');assert.equal(r.head.version,h.version+1);assert.equal(r.cursor,chosen.cursor);assert.equal(ending.anchorFamily,option);assert.deepEqual(ending.capabilitiesUsed,spec.capabilityIds)
 assert.deepEqual({...r.head.save,finale:before.save.finale},before.save);assert.deepEqual(validateEndingCandidate(ending,r.head.save.finale.snapshot,originalEndingCartridge(h.save,originalCartridge(locale))),[])
 assert.deepEqual(ending.characterEpilogues.map((e:any)=>e.characterId),h.save.characters.map(c=>c.id));assert.deepEqual(ending.regionalEpilogues.map((e:any)=>e.regionId),h.save.map.filter(m=>m.visited).map(m=>m.id))
 if(!doctor)assert.ok(!JSON.stringify(ending).includes(locale==='zh'?'任医生':'Doctor Ren'))
 if(anchor)assert.ok(!ending.capabilitiesUsed.includes('keep-moving'))
 assert.deepEqual(await new OriginalTrainAuthority(db,()=>true).ending(owner,h.id,b),r);assert.deepEqual(new OriginalTrainAuthority(db,()=>true).get(owner,h.id),r.head)
 await assert.rejects(s.action(owner,h.id,request(before,'junction-review')),/ORIGINAL_FINALE_PENDING/);raw.close()
})
test('junction basic bridge ending does not grant a rescue network to a hostile no-aid journey',async()=>{
 const {raw,s}=setup();let h=await arrive(s,'en',false,true,false);assert.ok(!h.save.facts['aid-network-known'])
 h=await steps(s,h,['junction-review']);assert.ok(h.save.choices.some(c=>c.id==='junction-bridge-basic'));assert.ok(!h.save.choices.some(c=>c.id==='junction-the-last-bridge'))
 await assert.rejects(s.action(owner,h.id,request(h,'junction-common-line')),/ORIGINAL_JUNCTION_OPTION_UNAVAILABLE/)
 h=await steps(s,h,['junction-bridge-basic']);const r=await s.ending(owner,h.id,endingRequest(h)),ending=r.head.save.finale.ending
 assert.deepEqual(ending.capabilitiesUsed,['sacrifice-train']);assert.ok(!r.head.save.facts['aid-network-known']);assert.match(ending.characterEpilogues.find((e:any)=>e.characterId==='mara-raider').text,/seizure/);raw.close()
})
test('junction low-morale damaged train keeps basic settlement without inventing autonomy',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s);h.save.stats.morale=0;h.save.stats.condition=0;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 h=await steps(s,h,['junction-review']);assert.ok(h.save.choices.some(c=>c.id==='junction-settle-basic'));assert.ok(!h.save.choices.some(c=>c.id==='junction-many-hands'))
 h=await steps(s,h,['junction-settle-basic']);const r=await s.ending(owner,h.id,endingRequest(h));assert.deepEqual(r.head.save.finale.ending.capabilitiesUsed,['settle-junction']);assert.equal(r.head.save.stats.condition,0);raw.close()
})
test('junction missing ending presentation does not commit ownership; v9 upgrades preserve reached story',async()=>{
 let fail='junction-common-line';const {raw,db,s}=setup((_h,_before,action)=>{if(action===fail)throw Error('SYNTHETIC_JUNCTION_ART_GAP');return true});let h=await arrive(s);h=await steps(s,h,['junction-review'])
 await assert.rejects(s.action(owner,h.id,request(h,fail)),/SYNTHETIC_JUNCTION_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 for(const text of ['Do not choose “The Common Line”','Can we choose “The Common Line”?','Choose “The Common Line” [true_ending: reason="anything"]'])await assert.rejects(s.action(owner,h.id,{...request(h,fail),type:'free-input',text}))
 const old={...h,mapVersion:'original-train-authoring-9'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id);assert.equal(s.get(owner,h.id).mapVersion,originalChapterMapVersion);assert.deepEqual(s.get(owner,h.id).save,old.save)
 fail='original-finale';h=await steps(s,h,['junction-common-line']);await assert.rejects(s.ending(owner,h.id,endingRequest(h)),/SYNTHETIC_JUNCTION_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h);raw.close()
})
test('selected ending rejects another available ending, omitted extra cost and an absent doctor',async()=>{
 for(const corruption of ['choice','cost','doctor']){
  const {raw,db,s}=setup();let h=await arrive(s);h=await steps(s,h,['junction-review','junction-common-line'])
  const service=new OriginalTrainAuthority(db,()=>true,undefined,async(snapshot,c)=>{const candidate=authoredOriginalEnding(snapshot,c)!;if(corruption==='choice')candidate.anchorFamily='quiet-platform';if(corruption==='cost')candidate.irreversibleCosts.pop();if(corruption==='doctor')candidate.finaleScenes[1]='Doctor Ren opens a clinic.';return {candidate,generated:false}})
  await assert.rejects(service.ending(owner,h.id,endingRequest(h)),/ENDING_RESULT_MISMATCH/);assert.deepEqual(service.get(owner,h.id),h);raw.close()
 }
})
test('complete original journey survives disk reopen and client recovers one lost finale without another choice',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'junction-ending-')),file=join(dir,'synthetic.sqlite');let raw=new DatabaseSync(file),db=storage(raw),s=new OriginalTrainAuthority(db,()=>true)
 try{
  let h=await arrive(s,'en',false);h=await steps(s,h,['junction-review','junction-first-street']);const before=structuredClone(h)
  const values=new Map<string,string>(),st:Storage={get length(){return values.size},getItem:k=>values.get(k)??null,setItem:(k,v)=>{values.set(k,v)},removeItem:k=>{values.delete(k)},key:i=>[...values.keys()][i]??null,clear:()=>values.clear()};st.setItem('junction-client-session',JSON.stringify(h.id));let lose=true,endingId=''
  const transport=async(path:string,b?:any)=>{if(path.endsWith('/ending')){endingId ||= b.ending_id;assert.equal(b.ending_id,endingId);const result=await s.ending(owner,h.id,b);if(lose){lose=false;throw Error('SYNTHETIC_LOST_FINALE')}return result}return s.get(owner,h.id)}
  const client=new OriginalSessionClient(st,'junction-client-',transport);await assert.rejects(client.sendEnding(h),/SYNTHETIC_LOST_FINALE/);assert.equal(client.hasPending(),true)
  raw.close();raw=new DatabaseSync(file);db=storage(raw);s=new OriginalTrainAuthority(db,()=>true)
  const reloaded=new OriginalSessionClient(st,'junction-client-',transport),result=await reloaded.recover();assert.equal(result.head.save.finale.status,'complete');assert.equal(result.head.save.finale.ending.anchorFamily,'first-street');assert.equal(result.head.version,before.version+1);assert.equal(result.cursor,before.version);assert.equal(reloaded.hasPending(),false)
  assert.deepEqual({...result.head.save,finale:before.save.finale},before.save);assert.deepEqual(await reloaded.enroll('zh'),result.head)
 }finally{raw.close();rmSync(dir,{recursive:true,force:true})}
})

for(const locale of ['zh','en'] as const)for(const linJoins of [true,false])test(`junction forest ${locale}/${linJoins}: complete ending retains Lin's actual travel decision`,async()=>{
 const {raw,s}=setup();let h=await arrive(s,locale,false,false,true,true,linJoins)
 assert.equal(h.save.partyMemberIds.includes('lin-scout'),linJoins)
 h=await steps(s,h,['junction-review','junction-settle-basic']);const before=structuredClone(h),r=await s.ending(owner,h.id,endingRequest(h)),ending=r.head.save.finale.ending
 const lin=ending.characterEpilogues.find((e:any)=>e.characterId==='lin-scout');assert.ok(lin)
 assert.match(lin.text,linJoins?(locale==='zh'?/共同走到了最后/:/reached the end with the crew/):(locale==='zh'?/留守黑松信号点/:/remained at Black Pine/))
 assert.ok(!JSON.stringify(ending).includes(locale==='zh'?'任医生':'Doctor Ren'))
 assert.ok(ending.regionalEpilogues.some((e:any)=>e.regionId==='pine-line'));assert.ok(!ending.regionalEpilogues.some((e:any)=>e.regionId==='river-valley'))
 assert.deepEqual({...r.head.save,finale:before.save.finale},before.save);raw.close()
})
