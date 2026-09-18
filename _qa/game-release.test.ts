import {test} from 'node:test'
import assert from 'node:assert/strict'
import {createReleaseProbe,releaseReloadUrl} from '../src/game-release'
const current='a'.repeat(24),next='b'.repeat(24)
const json=(version:string)=>Response.json({schema:1,version})
test('unchanged release never prompts; two new responses confirm a release and use same-origin cache-busted manifest',async()=>{
 const changes:string[]=[],requests:{url:string;init:RequestInit|undefined}[]=[];let v=current
 const probe=createReleaseProbe(current,v=>changes.push(v),(async(url,init)=>{requests.push({url:String(url),init});return json(v)}) as typeof fetch,'https://example.test/game-uuid/?story=original')
 assert.equal(await probe.check(),false);assert.deepEqual(changes,[])
 v=next;assert.equal(await probe.check(),true);assert.deepEqual(changes,[])
 assert.equal(await probe.check(),false);assert.deepEqual(changes,[next])
 const u=new URL(requests[0].url);assert.equal(u.pathname,'/game-uuid/release.json');assert.ok(u.searchParams.has('_check'));assert.equal(requests[0].init?.cache,'no-store');assert.equal(requests[0].init?.credentials,'omit')
})
test('offline, wrong schema, deployment error and rollback to current do not force update',async()=>{
 let value:Response|Error=json(next);const changes:string[]=[]
 const probe=createReleaseProbe(current,v=>changes.push(v),(async()=>{if(value instanceof Error)throw value;return value.clone()}) as typeof fetch,'https://example.test/game/')
 await probe.check();value=new Error('offline');assert.equal(await probe.check(),false)
 value=json(next);assert.equal(await probe.check(),true);assert.deepEqual(changes,[])
 value=json(current);await probe.check();value=json(next);assert.equal(await probe.check(),true)
 value=Response.json({schema:3,version:next});await probe.check();value=new Response('not found',{status:404});await probe.check();assert.deepEqual(changes,[])
})
test('requests are single-flight and disposed probes cannot prompt',async()=>{
 let release!:(r:Response)=>void,calls=0;const changes:string[]=[]
 const probe=createReleaseProbe(current,v=>changes.push(v),(()=>{calls++;return new Promise<Response>(r=>release=r)}) as typeof fetch,'https://example.test/game/')
 const first=probe.check();assert.equal(await probe.check(),false);assert.equal(calls,1);probe.dispose();release(json(next));await first;assert.equal(await probe.check(),false);assert.deepEqual(changes,[])
})
test('reload preserves route, game UUID and existing query; only cache-busting release changes',()=>{
 const u=new URL(releaseReloadUrl('https://example.test/uuid/?story=original&lang=zh#journal',next))
 assert.equal(u.pathname,'/uuid/');assert.equal(u.searchParams.get('story'),'original');assert.equal(u.searchParams.get('lang'),'zh');assert.equal(u.searchParams.get('_release'),next);assert.equal(u.hash,'#journal')
})
