import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {randomUUID,randomBytes} from 'node:crypto'
import {ProductionAuthority,type AuthorityStorage} from '../server/production-authority'
import {createHandler,handleApi,CarriageJourneyAuthority} from '../worker/source'
import {currentScene,localReply,type EntityId} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import type {Head,Narrator} from '../src/journey-runtime'
const narrator:Narrator=async(input,save,target)=>({proposal:localReply(input,save,target),trace:{mode:'local'}})
function setup(narrate=narrator){const raw=new DatabaseSync(':memory:');let fail=false
 const db:AuthorityStorage={all:(q,...b)=>raw.prepare(q).all(...b) as any,run:(q,...b)=>{if(fail&&q.startsWith('INSERT INTO journal'))throw new Error('DISK_FAILURE');raw.prepare(q).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}}
 return {raw,db,service:new ProductionAuthority(db,narrate),fail:()=>{fail=true}}
}
const intent=(h:Head,target:EntityId,action:string)=>({action_id:randomUUID(),expected_version:h.version,sceneId:currentScene(h.save),position:approachPoints[target],type:'action',target,action})
for(const route of ['radio','lights'])test(`production SQLite ${route} ending, replay, cursor and reopen`,async()=>{
 const {service:s,db,raw}=setup();let h=s.create('owner',randomUUID(),'zh')
 const steps:[EntityId,string][]=[['cabinet','open-cabinet'],['cabinet','take-fuse'],['lin','meet-lin'],['panel','repair'],['exit','leave'],['supply','open-supply'],['supply','take-battery'],['record','read-record'],['forward','enter-cab'],['radio','install-battery'],['radio','route-'+route],['radio','call-yard'],['radio','send-signal'],['cabBack','back-baggage'],['back','back-carriage']]
 if(route==='lights')steps.push(['panel','set-beacon'])
 for(const [target,action] of steps){const b=intent(h,target,action),r=await s.action('owner',h.id,b);assert.equal(r.accepted,true,action);h=r.head;assert.deepEqual(await s.action('owner',h.id,{...b,position:{y:b.position.y,x:b.position.x}}),r)}
 assert.equal(h.save.facts.rescue_sent,true);assert.equal(h.save.inventory.filter(i=>['fuse','battery'].includes(i.id)).reduce((sum,i)=>sum+i.count,0),0)
 assert.equal(s.events('owner',h.id,0).length,steps.length);assert.equal(s.directory('owner')[0].cursor,steps.length)
 assert.deepEqual(new ProductionAuthority(db,narrator).get('owner',h.id),h);raw.close()
})
test('owner isolation and enrollment replay bind locale',()=>{const {service:s,raw}=setup(),id=randomUUID(),h=s.create('a',id,'en');assert.equal(s.create('a',id,'en').id,h.id);assert.throws(()=>s.create('a',id,'zh'),/ENROLLMENT_ID_CONFLICT/);assert.throws(()=>s.get('b',h.id),/SESSION_NOT_FOUND/);assert.throws(()=>s.events('b',h.id,0),/SESSION_NOT_FOUND/);assert.deepEqual(s.directory('b'),[]);raw.close()})
test('head, event and receipt all roll back on event write failure',async()=>{const {service:s,raw,fail}=setup(),h=s.create('a',randomUUID(),'en');fail();await assert.rejects(s.action('a',h.id,intent(h,'cabinet','open-cabinet')),/DISK_FAILURE/);assert.deepEqual(s.get('a',h.id),h);assert.deepEqual(s.events('a',h.id,0),[]);assert.equal(raw.prepare('SELECT COUNT(*) AS n FROM receipts').get()?.n,0);raw.close()})
test('late narrator cannot overwrite a competing action',async()=>{
 let release!:()=>void,entered!:()=>void;const ready=new Promise<void>(r=>entered=r),gate=new Promise<void>(r=>release=r)
 const {service:s,raw}=setup(async(...args)=>{entered();await gate;return narrator(...args)}),h=s.create('a',randomUUID(),'zh')
 const delayed=s.action('a',h.id,{...intent(h,'cabinet',''),type:'free-input',text:'柜子是什么',mode:'local'});await ready
 const winner=await s.action('a',h.id,intent(h,'cabinet','open-cabinet'));release();await assert.rejects(delayed,/VERSION_CONFLICT/);assert.deepEqual(s.get('a',h.id),winner.head);assert.equal(s.events('a',h.id,0).length,1);raw.close()
})
test('stale checkpoint cannot move a later head',async()=>{const {service:s,raw}=setup(),h=s.create('a',randomUUID(),'en'),r=await s.action('a',h.id,intent(h,'cabinet','open-cabinet'));assert.throws(()=>s.checkpoint('a',h.id,{sceneId:'carriage',expected_version:0,position:{x:188,y:330}}),/STALE_POSITION/);assert.deepEqual(s.get('a',h.id),r.head);raw.close()})
test('approved production boundary requires capability; disabled rollback remains closed',async()=>{
 const request=(token?:string)=>new Request('https://example.test/api/lab/sessions',{method:'POST',headers:{Authorization:'Bearer '+(token??''),'X-Authority-Owner':'forged'},body:JSON.stringify({enrollment_id:randomUUID(),locale:'zh'})})
 assert.equal((await createHandler(false)(request(),{})).status,503)
 assert.equal((await handleApi(new Request('https://example.test/api/lab/health'),{})).status,200)
 assert.equal((await handleApi(request(),{CARRIAGE_JOURNEYS:{idFromName:n=>n,get:()=>({fetch:async()=>Response.json({})})}})).status,401)
 const enabled=createHandler(true);let route='',headers:Headers|undefined
 const env={CARRIAGE_JOURNEYS:{idFromName:(n:string)=>{route=n;return n},get:()=>({fetch:async(r:Request)=>{headers=r.headers;return Response.json({ok:true})}})}}
 assert.equal((await enabled(request('user123'),env)).status,401)
 assert.equal((await enabled(request(randomBytes(32).toString('base64url')),env)).status,200)
 assert.match(route,/^[a-f0-9]{64}$/);assert.equal(headers!.get('Authorization'),null);assert.equal(headers!.get('X-Authority-Owner'),route)
})
test('actual Durable Object adapter enrolls and replays an action on SQLite',async()=>{
 const raw2=new DatabaseSync(':memory:');const sync=<T>(work:()=>T)=>{raw2.exec('BEGIN');try{const r=work();raw2.exec('COMMIT');return r}catch(e){raw2.exec('ROLLBACK');throw e}}
 const actual=new CarriageJourneyAuthority({storage:{sql:{exec:(q,...b)=>{const stmt=raw2.prepare(q),rows=stmt.columns().length?stmt.all(...b):(stmt.run(...b),[]);return {toArray:()=>rows}}},transactionSync:sync}})
 const call=(path:string,body?:unknown)=>actual.fetch(new Request('https://authority.test/api/lab'+path,{method:body?'POST':'GET',headers:{'X-Authority-Owner':'a'.repeat(64)},body:body?JSON.stringify(body):undefined}))
 const h=await (await call('/sessions',{enrollment_id:randomUUID(),locale:'en'})).json() as Head,b=intent(h,'cabinet','open-cabinet'),r=await (await call('/sessions/'+h.id+'/actions',b)).json()
 assert.equal(r.accepted,true);assert.deepEqual(await (await call('/sessions/'+h.id+'/actions',b)).json(),r);assert.equal((await (await call('/sessions/'+h.id+'/events?after=0')).json()).events.length,1)
 raw2.close()
})
