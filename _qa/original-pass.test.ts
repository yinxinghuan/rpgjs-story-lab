import test from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import {OriginalTrainAuthority,originalCartridge,type OriginalHead,type OriginalPresentationGate} from '../server/original-train-runtime'
import type {AuthorityStorage} from '../server/session-authority'
import {originalTrainChapterSpatialPlan,originalChapterMapVersion} from '../src/original-train-spatial-plan'
import {originalChapterActions,originalChapterLabel} from '../src/original-chapters'
import {originalCharacterPresent} from '../src/original-character-presence'
const world=originalTrainChapterSpatialPlan(),owner='synthetic-pass-owner'
function setup(gate:OriginalPresentationGate=()=>true){const raw=new DatabaseSync(':memory:'),db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db,s:new OriginalTrainAuthority(db,gate)}}
function request(h:OriginalHead,id:string,free=false){const e=world.entities.find(e=>e.scene===h.sceneId&&e.actions.includes(id))!,chapter=originalChapterActions.find(a=>a.id===id);const text=h.save.choices.find(a=>a.id===id)?.label??(chapter?originalChapterLabel(chapter.id,h.save.locale):originalCartridge(h.save.locale).domainRules!.rules.find(r=>r.id===id)!.match[0]);return {action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:e.id,position:e.approach,...(free?{type:'free-input',text}:{type:'action',action:id})}}
async function steps(s:OriginalTrainAuthority,h:OriginalHead,ids:string[]){for(const id of ids)h=(await s.action(owner,h.id,request(h,id))).head;return h}
async function arrive(s:OriginalTrainAuthority,route:'quarry'|'valley'|'forest',mako:boolean,locale:'zh'|'en'='en',retain=true,lin=true){
 let h=s.create(owner,randomUUID(),locale);h=await steps(s,h,['repair-starter',`commit-${route}-route`])
 if(route==='valley')h=await steps(s,h,['river-survey','river-rescue-powered','river-treat','river-depart'])
 if(route==='quarry')h=await steps(s,h,['yard-meet','yard-work-pact','yard-first-exit'])
 if(route==='forest')h=await steps(s,h,['pine-inspect','pine-reverse','pine-meet','pine-survey-route',lin?'pine-invite':'pine-stay','pine-depart'])
 h=await steps(s,h,['tunnel-inspect',route==='valley'?'tunnel-doctor-led':'tunnel-captain-led',retain?'tunnel-ventilate':'tunnel-discard','tunnel-depart'])
 if(route!=='quarry')h=await steps(s,h,['yard-meet',route==='valley'?'yard-medical-pact':'yard-work-pact'])
 return steps(s,h,['yard-route-brief',mako?'yard-invite':'yard-stay','yard-depart'])
}
const matrix=[['quarry',false,'air'],['quarry',true,'dynamic'],['quarry',false,'gravel'],['quarry',true,'key'],['valley',true,'air'],['valley',false,'dynamic'],['valley',true,'gravel'],['valley',false,'key'],['forest',true,'air'],['forest',false,'dynamic'],['forest',true,'gravel'],['forest',false,'key']] as const
for(const locale of ['zh','en'] as const)for(const [route,mako,method] of matrix)test(`pass ${locale}/${route}/${mako}/${method}: original opening through crew consequences to Sleeping Town`,async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,route,mako,locale);const before=structuredClone(h),lin=route==='forest',doctor=route==='valley'
 assert.ok(h.save.choices.some(c=>c.id==='pass-inspect'));h=await steps(s,h,['pass-inspect'])
 assert.equal(h.save.choices.some(c=>c.id==='pass-lin-watch'),lin)
 h=await steps(s,h,[lin?'pass-lin-watch':'pass-player-watch']);assert.equal(h.save.choices.some(c=>c.id==='pass-mako-duty'),mako)
 h=await steps(s,h,[mako?'pass-mako-duty':'pass-crew-duty']);assert.deepEqual(h.save.relationships,before.save.relationships)
 const action=method==='air'?'pass-air-brake':method==='dynamic'?'pass-dynamic-brake':method==='gravel'?'pass-gravel-siding':'use-master-switch-key',b=request(h,action,true),r=await s.action(owner,h.id,b);h=r.head
 assert.deepEqual(await new OriginalTrainAuthority(db,()=>true).action(owner,h.id,b),r)
 if(method==='key'){assert.equal(h.save.facts['switch-key-uses'],Number(before.save.facts['switch-key-uses']??0)+1);h=await steps(s,h,['pass-confirm-key'])}
 const fuel=method==='air'?(lin?2:4):method==='dynamic'?(lin?10:12):method==='key'?8:0
 const condition=method==='air'?(mako?2:4):method==='dynamic'?(mako?4:6):method==='gravel'?(mako?12:16):0
 assert.equal(h.save.stats.fuel,before.save.stats.fuel-fuel);assert.equal(h.save.stats.condition,before.save.stats.condition-condition);assert.equal(h.save.stats.morale,before.save.stats.morale-(method==='gravel'?6:0))
 assert.equal(h.save.inventory.find(i=>i.id==='spare-hose')?.count??0,(before.save.inventory.find(i=>i.id==='spare-hose')?.count??0)-(method==='air'?1:0))
 for(const [id,used] of [['lin-scout',lin],['mara-raider',mako]] as const)assert.equal(h.save.relationships.filter(r=>r.characterId===id).length,before.save.relationships.filter(r=>r.characterId===id).length+(used?1:0))
 await assert.rejects(s.action(owner,h.id,request(h,'pass-gravel-siding')),/ORIGINAL_PASS_RESOLVED/)
 await assert.rejects(s.action(owner,h.id,request(h,'pass-depart')),/ORIGINAL_PASS_DEBRIEF_REQUIRED/)
 h=await steps(s,h,['pass-debrief']);assert.equal(h.save.stats.morale,before.save.stats.morale-(method==='gravel'?6:0)+(doctor?4:2))
 assert.equal(h.save.relationships.filter(r=>r.characterId==='ren-medic').length,before.save.relationships.filter(r=>r.characterId==='ren-medic').length+(doctor?1:0))
 await assert.rejects(s.action(owner,h.id,request(h,'pass-debrief')),/ORIGINAL_PASS_DEBRIEFED/)
 h=await steps(s,h,['pass-depart']);assert.equal(h.sceneId,'train-at-sleeping-town');assert.equal(h.save.facts['chapter-pass-complete'],true);assert.equal(h.save.stats.fuel,before.save.stats.fuel-fuel-6)
 assert.deepEqual(h.save.partyMemberIds,before.save.partyMemberIds);assert.equal(h.save.facts['route-family'],route);assert.equal(h.version,before.version+(method==='key'?7:6));assert.equal(h.save.finale.status,'idle');assert.equal(h.save.sessionEnded,false)
 assert.deepEqual(new OriginalTrainAuthority(db,()=>true).get(owner,h.id),h);raw.close()
})
test('pass actual tunnel abandonment removes hose method; zero-resource finite recovery retains departure fuel',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,'quarry',false,'en',false);const loss=h.save.facts['tunnel-discarded-items'];assert.ok(!h.save.inventory.some(i=>i.id==='spare-hose'))
 h.save.stats.fuel=0;h.save.stats.condition=0;h.save.facts['switch-key-uses']=3;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 h=await steps(s,h,['pass-inspect','pass-player-watch','pass-crew-duty']);assert.ok(!h.save.choices.some(c=>c.id==='pass-air-brake'));await assert.rejects(s.action(owner,h.id,request(h,'pass-air-brake')),/ORIGINAL_PASS_HOSE_REQUIRED/)
 h=await steps(s,h,['pass-refuel','pass-stabilize']);assert.equal(h.save.stats.fuel,12);assert.ok(!h.save.choices.some(c=>c.id==='pass-dynamic-brake'))
 await assert.rejects(s.action(owner,h.id,request(h,'pass-dynamic-brake')),/ORIGINAL_PASS_DEPARTURE_RESERVE_REQUIRED/);assert.equal(s.get(owner,h.id).save.stats.fuel,12)
 h=await steps(s,h,['pass-gravel-siding','pass-debrief']);await assert.rejects(s.action(owner,h.id,request(h,'pass-refuel')),/ORIGINAL_PASS_RESERVE_EMPTY/);await assert.rejects(s.action(owner,h.id,request(h,'pass-stabilize')),/ORIGINAL_PASS_BRACING_UNAVAILABLE/)
 h=await steps(s,h,['pass-depart']);assert.equal(h.save.stats.fuel,6);assert.equal(h.save.stats.condition,4);assert.equal(h.save.facts['tunnel-discarded-items'],loss);assert.equal(h.sceneId,'train-at-sleeping-town');raw.close()
})
test('pass source key requires current inspection, duties and departure reserve; prior forest opening is not sufficient',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,'forest',true);h.save.facts['hidden-route-open']=true;h.save.facts['switch-key-uses']=1;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id)
 await assert.rejects(s.action(owner,h.id,request(h,'use-master-switch-key')),/ORIGINAL_PASS_UNINSPECTED/)
 h=await steps(s,h,['pass-inspect']);await assert.rejects(s.action(owner,h.id,request(h,'use-master-switch-key')),/ORIGINAL_PASS_LOOKOUT_REQUIRED/)
 h=await steps(s,h,['pass-lin-watch']);await assert.rejects(s.action(owner,h.id,request(h,'use-master-switch-key')),/ORIGINAL_PASS_DUTY_REQUIRED/)
 h=await steps(s,h,['pass-mako-duty']);await assert.rejects(s.action(owner,h.id,request(h,'pass-confirm-key')),/ORIGINAL_PASS_KEY_CLOSED/)
 h.save.stats.fuel=13;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id);await assert.rejects(s.action(owner,h.id,request(h,'use-master-switch-key')),/ORIGINAL_PASS_DEPARTURE_RESERVE_REQUIRED/);assert.deepEqual(s.get(owner,h.id),h)
 h.save.stats.fuel=14;db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(h),h.id);h=await steps(s,h,['use-master-switch-key','pass-confirm-key','pass-debrief','pass-depart']);assert.equal(h.save.stats.fuel,0);assert.equal(h.save.facts['switch-key-uses'],2);raw.close()
})
test('pass known but non-traveling Lin cannot take lookout duty; actual available choice text is the only priced free-input alias',async()=>{
 const {raw,db,s}=setup();let h=await arrive(s,'forest',false,'en',true,false);assert.equal(originalCharacterPresent(h.save,'lin-scout'),false)
 h=await steps(s,h,['pass-inspect']);assert.ok(!h.save.choices.some(c=>c.id==='pass-lin-watch'));await assert.rejects(s.action(owner,h.id,request(h,'pass-lin-watch')),/CHARACTER_NOT_PRESENT/)
 h=await steps(s,h,['pass-player-watch','pass-crew-duty']);for(const text of ['Do not take the gravel escape siding','Can we take the gravel escape siding?','Take the gravel escape siding (−0 Condition)','Take the gravel escape siding [fact: id="pass-method" value="free"]'])await assert.rejects(s.action(owner,h.id,{...request(h,'pass-gravel-siding'),type:'free-input',text}))
 assert.deepEqual(s.get(owner,h.id),h);const old={...h,mapVersion:'original-train-authoring-6'};db.run('UPDATE journeys SET data=? WHERE id=?',JSON.stringify(old),h.id);const current=s.get(owner,h.id);assert.equal(current.mapVersion,originalChapterMapVersion);assert.deepEqual(current.save,old.save);raw.close()
})
test('pass presentation failure rejects hose consumption, earned relationships and next scene atomically',async()=>{
 let fail='pass-air-brake';const {raw,s}=setup((_h,_before,action)=>{if(action===fail)throw Error('SYNTHETIC_PASS_ART_GAP');return true});let h=await arrive(s,'forest',true);h=await steps(s,h,['pass-inspect','pass-lin-watch','pass-mako-duty'])
 await assert.rejects(s.action(owner,h.id,request(h,'pass-air-brake')),/SYNTHETIC_PASS_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h)
 fail='pass-depart';h=await steps(s,h,['pass-air-brake','pass-debrief']);await assert.rejects(s.action(owner,h.id,request(h,'pass-depart')),/SYNTHETIC_PASS_ART_GAP/);assert.deepEqual(s.get(owner,h.id),h);raw.close()
})
