import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID} from 'node:crypto'
import 'fake-indexeddb/auto'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {upgradeHead} from '../server/head-migration'
import {initialStory,runRule,type Locale} from '../src/story'
import {prepareAction,type Head,type Narrator} from '../src/journey-runtime'
import {BrowserJourney} from '../src/browser-journey'
import {currentScene,actionTarget,localReply,sceneContract,states,MAP_VERSION,walkable} from '../src/contract'
import {approachPoints,scenes,sceneObstacles} from '../src/scene-layout'
import {findPath} from '../src/pathfinding'
import {departureActions,departureLabels,departureObjective} from '../src/departure'
import {radioDescription,radioStatus} from '../src/power-choice'
import {chapterResult} from '../src/chapter-result'
import {recentConversation} from '../src/conversation-context'
import {projectWorldObjects} from '../src/world-objects'
const narrator:Narrator=async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'authored'}})
function setup(){const raw=new DatabaseSync(':memory:');const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{raw.prepare(q).run(...b)},transaction:f=>{raw.exec('BEGIN');try{const r=f();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};return {raw,db}}
const intent=(h:Head,id:string,free=false)=>{const target=actionTarget[id];return {action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),target,position:approachPoints[target],type:free?'free-input':'action',...(free?{text:departureLabels[id][h.save.locale==='zh'?0:1]}:{action:id})}}
export const toHandover=(route:string)=>['open-cabinet','take-fuse','meet-lin','repair','leave','open-supply','take-battery','read-record','enter-cab','install-battery','route-'+route,'send-signal',...(route==='lights'?['back-baggage','back-carriage','set-beacon','go-baggage','enter-cab']:[]),'begin-reception','back-baggage','meet-attendant','check-aisle','read-arrival-code','back-carriage','check-circuit','go-baggage','enter-cab','confirm-arrival','back-baggage','back-carriage','complete-handover']
for(const locale of ['zh','en'] as Locale[])for(const route of ['radio','lights'])test(`whole authored journey ${locale}/${route}: reach new scene, preserve choice, end once and return`,async()=>{
 const {raw,db}=setup();let service=new ProductionAuthority(db,narrator),h=service.create('complete-journey',randomUUID(),locale)
 async function act(id:string,free=false){const body=intent(h,id,free),r=await service.action('complete-journey',h.id,body);h=r.head;assert.deepEqual(await service.action('complete-journey',h.id,body),r);return r}
 for(const id of toHandover(route))assert.equal((await act(id)).accepted,true,id)
 const before=structuredClone(h.save),oldPosition={...h.position}
 const denied=await act('enter-walkway');assert.equal(denied.accepted,false);assert.equal(currentScene(h.save),'carriage');assert.ok(!h.save.facts.journey_complete)
 assert.deepEqual(departureActions(h.save,'radio'),['receive-clearance'])
 for(const id of ['go-baggage','enter-cab','receive-clearance','back-baggage','back-carriage'])assert.equal((await act(id,id==='receive-clearance')).accepted,true,id)
 assert.equal(states(h.save).rearExit,'locked');assert.equal((await act('enter-walkway')).accepted,false)
 const light=h.save.stats.light;assert.equal(light,route==='radio'?35:100)
 assert.equal((await act('release-guidance',true)).accepted,true);assert.equal(h.save.stats.light,100)
 assert.equal(states(h.save).panel,'repaired');assert.equal(states(h.save).rearExit,'open')
 assert.doesNotMatch(radioDescription(h.save,locale),/保留应急光|has emergency light/);assert.match(radioStatus(h.save,locale),locale==='zh'?/常亮/:/Steady/);
 assert.equal(sceneContract(h.save,'panel').power.sceneLight,'full');assert.equal(sceneContract(h.save,'panel').power.guideLight,false)
 assert.ok(projectWorldObjects('carriage',h.save).every(o=>o.tint!=='#b8b8b8'))
 assert.equal((await act('release-guidance')).accepted,false);assert.equal(h.save.stats.light,100)
 assert.equal((await act('enter-walkway',true)).accepted,true);assert.equal(currentScene(h.save),'walkway')
 assert.equal(h.save.map.filter(m=>m.current).length,1);assert.deepEqual(h.position,scenes.walkway.spawn)
 assert.equal(h.save.facts.power_radio,before.facts.power_radio);assert.equal(h.save.facts.beacon_set,before.facts.beacon_set)
 assert.deepEqual(h.save.characters,before.characters);assert.deepEqual(h.save.relationships,before.relationships)
 service=new ProductionAuthority(db,narrator);assert.deepEqual(service.get('complete-journey',h.id),h)
 const contact=sceneContract(h.save,'callpoint');assert.equal(contact.contacts[0].id,'xu-lan');assert.equal(contact.conversation.speakerId,'xu-lan')
 assert.ok(contact.entities.every(e=>!['lin','zhou-yu'].includes(e.id)))
 assert.equal((await act('report-safe-arrival',true)).accepted,true);assert.equal(chapterResult(h.save,locale)?.route,'complete')
 assert.ok(recentConversation(h.save,'callpoint').some(t=>t.input.includes(departureLabels['report-safe-arrival'][locale==='zh'?0:1])))
 const endVersion=h.version,endRelations=structuredClone(h.save.relationships)
 assert.equal((await act('report-safe-arrival')).accepted,false)
 assert.equal((await act('return-carriage')).accepted,true);assert.equal(currentScene(h.save),'carriage')
 assert.equal(chapterResult(h.save,locale)?.route,'complete');assert.deepEqual(h.save.relationships,endRelations)
 assert.ok(departureObjective(h.save,locale));assert.ok(!h.save.blocks.slice(0,before.blocks.length).some((b,i)=>JSON.stringify(b)!==JSON.stringify(before.blocks[i])))
 assert.ok(h.version>endVersion);assert.equal(h.mapVersion,MAP_VERSION);assert.ok(oldPosition)
 raw.close()
})
test('finale rejects early rules and remotely reported arrival with no partial changes',async()=>{
 const save=initialStory('zh');for(const id of ['receive-clearance','release-guidance','enter-walkway','report-safe-arrival']){const r=runRule(save,id);assert.equal(r.accepted,false,id);assert.deepEqual(r.save,save)}
 const h:Head={id:randomUUID(),version:0,save,mapVersion:MAP_VERSION,position:scenes.carriage.spawn}
 await assert.rejects(prepareAction(h,{...intent(h,'report-safe-arrival'),sceneId:'carriage'},narrator),/OFF_SCENE_ENTITY/)
 assert.equal(departureObjective(save,'zh'),null);assert.equal(chapterResult(save,'zh'),null)
})
test('new walkway preserves old map position and facts and has collision-bounded reachable targets',()=>{
 const h:Head={id:randomUUID(),version:12,save:initialStory('en'),mapVersion:'train-scenes-2',position:{x:188,y:488}}
 h.save.map=h.save.map.filter(n=>n.id!=='walkway');h.save.facts.handover_complete=true;h.save.facts.power_chosen=false;h.save.stats.light=42
 const old=structuredClone(h),updated=upgradeHead(h)
 assert.equal(updated.version,12);assert.deepEqual(updated.position,old.position);assert.deepEqual(updated.save.blocks,old.save.blocks)
 assert.equal(updated.save.stats.light,42);assert.ok(!updated.save.facts.access_cleared);assert.ok(!updated.save.facts.journey_complete)
 assert.deepEqual(updated.save.map.find(n=>n.id==='walkway'),{id:'walkway',label:'Trackside reception walkway',current:false,visited:false})
 assert.deepEqual(upgradeHead(structuredClone(updated)),updated)
 for(const target of ['callpoint','walkwayBack'] as const){assert.ok(walkable(approachPoints[target],'walkway'));assert.ok(findPath(scenes.walkway.spawn,approachPoints[target],'walkway').length)}
 for(const point of [{x:140,y:200},{x:238,y:200},{x:188,y:90}])assert.equal(walkable(point,'walkway'),false)
 assert.ok(sceneObstacles('walkway').length)
})
test('browser v2 save adds walkway without resetting inventory, choice, history or position',async()=>{
 const name=randomUUID(),store=new BrowserJourney(name),h=await store.create(randomUUID(),'en')
 h.mapVersion='train-scenes-2';h.save.map=h.save.map.filter(n=>n.id!=='walkway');h.save.facts.power_radio=true;h.save.inventory=[{id:'fuse',label:'Fuse',count:1,rarity:'common',detail:'existing',effect:'repair'}]
 // Test fixture inserted only into this new isolated fake IndexedDB database.
 const db=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(name);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})
 await new Promise<void>((resolve,reject)=>{const tx=db.transaction('heads','readwrite');tx.objectStore('heads').put(h,h.id);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})
 const next=await store.get(h.id);assert.equal(next.mapVersion,MAP_VERSION);assert.deepEqual(next.save.inventory,h.save.inventory);assert.deepEqual(next.save.blocks,h.save.blocks);assert.deepEqual(next.position,h.position);assert.equal(next.save.facts.power_radio,true);assert.equal(next.save.map.filter(m=>m.id==='walkway').length,1)
 await store.close();db.close()
})
