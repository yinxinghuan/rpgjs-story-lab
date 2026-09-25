import test from 'node:test';import assert from 'node:assert/strict';import {randomUUID} from 'node:crypto';
import {oldStreetRuntime} from '../server/old-street-runtime';import {oldStreetDoors} from '../src/old-street-space';
const runtime=oldStreetRuntime(()=>true);
test('map travel rejects unseen rooms, commits only movement and rejects stale requests',async()=>{
 let h=runtime.initial('en',randomUUID());const request=(destination:string)=>({type:'map-travel',destination,action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position});
 await assert.rejects(runtime.prepare(h,request('shop'),()=>false),/MAP_ROUTE_UNAVAILABLE/);
 const door=oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='shop')!;
 h=(await runtime.prepare(h,{...request('shop'),type:'action',target:door.id,action:door.actionId,position:door.approach},()=>false)).head;
 const before=structuredClone(h),back=request('street');h=(await runtime.prepare(h,back,()=>false)).head;
 assert.equal(h.sceneId,'street');assert.equal(h.version,before.version+1);assert.deepEqual(h.save.inventory,before.save.inventory);assert.deepEqual(h.save.facts,before.save.facts);assert.deepEqual(h.save.characters,before.save.characters);assert.deepEqual(h.save.choices,before.save.choices);
 await assert.rejects(runtime.prepare(h,back,()=>false),/VERSION_CONFLICT/);
 await assert.rejects(runtime.prepare(h,request('bogus'),()=>false),/MAP_ROUTE_UNAVAILABLE/);
});
test('map travel cannot use a known but blocked connection',async()=>{
 let h=runtime.initial('en',randomUUID());for(const n of h.save.map)n.visited=['street','yard','cellar'].includes(n.id);
 await assert.rejects(runtime.prepare(h,{type:'map-travel',destination:'cellar',action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position},()=>false),/MAP_ROUTE_UNAVAILABLE/);
});

import {DatabaseSync} from 'node:sqlite';import {SessionAuthority,type AuthorityStorage} from '../server/session-authority';
test('authority commits shortcut once and replays it after authority reopens',async()=>{
 const raw=new DatabaseSync(':memory:');const db:AuthorityStorage={all:(sql,...b)=>raw.prepare(sql).all(...b) as any,run:(sql,...b)=>{raw.prepare(sql).run(...b)},transaction:work=>{raw.exec('BEGIN IMMEDIATE');try{const r=work();raw.exec('COMMIT');return r}catch(e){raw.exec('ROLLBACK');throw e}}};
 let service=new SessionAuthority(db,runtime),h=service.create('owner',randomUUID(),'en');
 const door=oldStreetDoors().find(d=>d.room==='street'&&d.destination.room==='shop')!;
 h=(await service.action('owner',h.id,{type:'action',action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,target:door.id,action:door.actionId,position:door.approach})).head;
 const request={type:'map-travel',destination:'street',action_id:randomUUID(),expected_version:h.version,sceneId:h.sceneId,position:h.position},r=await service.action('owner',h.id,request);
 assert.equal(r.head.sceneId,'street');assert.deepEqual(await service.action('owner',h.id,request),r);service=new SessionAuthority(db,runtime);assert.deepEqual(service.get('owner',h.id),r.head);assert.deepEqual(await service.action('owner',h.id,request),r);assert.equal(service.events('owner',h.id,0).length,2);raw.close();
});
