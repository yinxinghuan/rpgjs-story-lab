import test from 'node:test';import assert from 'node:assert/strict';import {oldStreetUpstream} from '../worker/oldstreet-upstream';import {GAME_ID} from '../src/game-id';import {OLD_STREET_RUNTIME_HEADER,OLD_STREET_RUNTIME_CONTRACT} from '../src/old-street-runtime-contract';import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract';
import {readFileSync} from 'node:fs'
test('shared Old Street edge preserves capability identity and PNG; fails closed on Remix/config/origin',async t=>{
 const env={OLDSTREET_GAME_ID:GAME_ID,OLDSTREET_UPSTREAM_ORIGIN:'https://upstream.invalid',OLDSTREET_EDGE_TOKEN:'a'.repeat(64),OLDSTREET_EXPIRES_AT:String(Date.now()+60000)};
 const seen:any[]=[];t.mock.method(globalThis,'fetch',async(url:any,init:any)=>{seen.push({url,init});return new Response(new Uint8Array([137,80,78,71]),{headers:{'Content-Type':'image/png'}})});
 const headers={Authorization:'Bearer '+'b'.repeat(42)+'A',[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT,[RUNTIME_HEADER]:RUNTIME_CONTRACT};
 const request=(extra:Record<string,string>={},method='GET',body?:string)=>new Request('https://game.aiwaves.tech/api/oldstreet/sessions',{method,headers:{...headers,...extra},body});
 const a=await oldStreetUpstream(request({'X-Rpg-Owner':'forged'}),env);assert.equal(a.status,200);assert.equal(a.headers.get('Content-Type'),'image/png');assert.match(seen[0].init.headers.get('X-Rpg-Owner'),/^[a-f0-9]{64}$/);assert.equal(seen[0].init.headers.get('Authorization'),null);assert.equal(seen[0].url,env.OLDSTREET_UPSTREAM_ORIGIN+'/'+GAME_ID+'/oldstreet/sessions');
 assert.equal((await oldStreetUpstream(request(),{...env,OLDSTREET_GAME_ID:'other'})).status,503);
 assert.equal((await oldStreetUpstream(request(),{...env,OLDSTREET_EXPIRES_AT:'1'})).status,410);
 assert.equal((await oldStreetUpstream(request({Origin:'https://other.invalid'}),env)).status,403);
 assert.equal((await oldStreetUpstream(request({Authorization:'Bearer wrong'}),env)).status,401);
 assert.equal((await oldStreetUpstream(request({'Content-Type':'application/json'},'POST','{}'),env)).status,403);
 assert.equal((await oldStreetUpstream(request({'Content-Type':'application/json',Origin:'https://game.aiwaves.tech'},'POST','{}'),env)).status,200);
});
test('compiled production Worker routes Old Street only to configured shared upstream',async t=>{
 const worker=await import('data:text/javascript;base64,'+Buffer.from(readFileSync('worker/index.js')).toString('base64'))
 const headers={Authorization:'Bearer '+'c'.repeat(42)+'A',[OLD_STREET_RUNTIME_HEADER]:OLD_STREET_RUNTIME_CONTRACT,[RUNTIME_HEADER]:RUNTIME_CONTRACT}
 const request=new Request('https://game.aiwaves.tech/api/oldstreet/health',{headers})
 assert.equal((await worker.handleApi(request,{})).status,503)
 let calls=0;t.mock.method(globalThis,'fetch',async()=>{calls++;return Response.json({ok:true,runtimeContract:OLD_STREET_RUNTIME_CONTRACT})})
 const response=await worker.handleApi(request,{OLDSTREET_GAME_ID:GAME_ID,OLDSTREET_UPSTREAM_ORIGIN:'https://upstream.invalid',OLDSTREET_EDGE_TOKEN:'a'.repeat(64),OLDSTREET_EXPIRES_AT:String(Date.now()+60000),CARRIAGE_JOURNEYS:{idFromName(){throw Error('LEGACY_MUST_NOT_BE_USED')}}})
 assert.equal(response.status,200);assert.equal(calls,1);assert.equal((await response.json()).runtimeContract,OLD_STREET_RUNTIME_CONTRACT)
})
