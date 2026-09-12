import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {PreflightStorage} from '../server/preflight-storage'
import {CarriageJourneyAuthority,handleApi} from '../worker/source'
import {CreatorCloudDrafts,creatorCloudTransport} from '../src/creator-cloud'
import {SpriteCloudArchive} from '../src/sprite-cloud'
import {LayeredCloudArchive} from '../src/layered-cloud'
import {loadAssemblyCatalog,assemblyJourneyHref,emptyAssembly,readAssembly} from '../src/creator-assembly'
import {originalSessionHttp} from '../src/original-session-http'
import {originalActorRelease,originalPublishedHero,originalStarterRelease,originalFanRelease,originalBackgroundVersion} from '../src/original-asset-releases'
import {assemblyBackgroundDraft,assemblyBackgroundBytes,assemblyDeviceDraft,assemblyActorDraft,assemblyLayerDraft} from './assembly-fixture'
import {originalGameEntities} from '../src/original-game-projection'
import {GAME_ID} from '../src/game-id'
class Memory implements Storage{v=new Map<string,string>();get length(){return this.v.size}key(i:number){return [...this.v.keys()][i]??null}getItem(k:string){return this.v.get(k)??null}setItem(k:string,v:string){this.v.set(k,v)}removeItem(k:string){this.v.delete(k)}clear(){this.v.clear()}}
const lock=async<T>(_n:string,w:()=>Promise<T>)=>w()
async function fixture(){const pool=new PreflightStorage(),objects=new Map<string,CarriageJourneyAuthority>();let lose=false
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key),env,undefined,undefined,undefined,undefined,undefined,async()=>assemblyBackgroundBytes());objects.set(key,o)}return o.fetch(r)}})}}
 const server=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const b of req)chunks.push(Buffer.from(b));const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);const path=(req.url??'/').replace('/'+GAME_ID+'/api/','/api/');const r=await handleApi(new Request('http://localhost'+path,{method:req.method,headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env);if(lose&&path.endsWith('/sessions')&&req.method==='POST'&&r.ok){lose=false;res.destroy();return}res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))}catch{res.writeHead(503);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)});const base='http://127.0.0.1:'+(server.address()as any).port,store=new Memory(),api=creatorCloudTransport(store,lock,fetch,base),playerStore=new Memory()
 return {base,api,playerStore,lose:()=>{lose=true},close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close()}}
}
test('five released slots assemble into one production journey; order independent resume, lost enrollment, private catalog and old journey retained',async()=>{
 const f=await fixture();try{
 const bg=new CreatorCloudDrafts(f.api),sp=new SpriteCloudArchive(f.api),la=new LayeredCloudArchive(f.api),d=await assemblyBackgroundDraft();await bg.save(d);assert.equal(await bg.publication(d.id),null)
 const hero=await sp.publishHero(await assemblyActorDraft());const b=await bg.publish(d),a=await sp.publishActor(await assemblyActorDraft()),e=await sp.publish(await assemblyDeviceDraft()),l=await la.publish(await assemblyLayerDraft())
 const catalog=await loadAssemblyCatalog(f.api);assert.deepEqual(Object.fromEntries(Object.entries(catalog).map(([k,v])=>[k,v.length])),{background:1,actor:1,device:1,fan:1,hero:1});assert.deepEqual(await bg.publication(d.id),b)
 const selection={hero:hero.id,background:b.id,actor:a.id,device:e.id,fan:l.id},href=assemblyJourneyHref(selection,catalog),q=new URL(href,'http://local').searchParams
 const connection=(query:URLSearchParams)=>originalSessionHttp(f.playerStore,lock,fetch,f.base,undefined,query.get('background_release')??undefined,query.get('device_release')??undefined,query.get('actor_release')??undefined,query.get('fan_release')??undefined,query.get('hero_release')??undefined)
 const old=await connection(new URLSearchParams()).client.enroll('en');f.lose();await assert.rejects(connection(q).client.enroll('en'));let h=await connection(q).client.enroll('en');assert.notEqual(h.id,old.id)
 const check=()=>{assert.equal(originalPublishedHero(h.assets)?.id,hero.id);assert.equal(originalActorRelease(h.assets)?.id,a.id);assert.equal(originalStarterRelease(h.assets)?.id,e.id);assert.equal(originalFanRelease(h.assets)?.id,l.id);assert.equal(originalBackgroundVersion(h.assets),b.id)};check()
 const entity=originalGameEntities(h).find(e=>e.actions.some(a=>a.id==='repair-starter'))!;h=(await connection(q).client.send(h,{target:entity.id,position:entity.approach,type:'action',action:'repair-starter'})).head;assert.equal(h.save.stats.condition,87);check()
 const reversed=new URLSearchParams([...q.entries()].reverse());assert.deepEqual(await connection(reversed).client.enroll('en'),h);assert.deepEqual(await connection(new URLSearchParams()).client.enroll('en'),old)
 const other=new URLSearchParams(q);other.delete('actor_release');const next=await connection(other).client.enroll('en');assert.notEqual(next.id,h.id);assert.equal(originalActorRelease(next.assets),undefined);assert.deepEqual(await connection(q).client.enroll('en'),h)
 const stranger=creatorCloudTransport(new Memory(),lock,fetch,f.base);assert.deepEqual(await loadAssemblyCatalog(stranger),{background:[],actor:[],device:[],fan:[],hero:[]});await assert.rejects(new CreatorCloudDrafts(stranger).publication(d.id));assert.equal((await fetch(f.base+'/api/creator/drafts/'+d.id+'/release')).status,401)
 await assert.rejects(loadAssemblyCatalog(async(p,b)=>{if(p==='/sprites')throw Error('NETWORK_DOWN');return f.api(p,b)}),/NETWORK_DOWN/)
 assert.throws(()=>assemblyJourneyHref({...selection,actor:b.id},catalog),/ASSEMBLY_RELEASE_UNAVAILABLE/);assert.deepEqual(readAssembly(JSON.stringify(selection)),selection);assert.deepEqual(readAssembly(JSON.stringify({background:'',actor:'',device:'',fan:''})),emptyAssembly());assert.equal(assemblyJourneyHref(emptyAssembly(),catalog),'./?story=original');assert.throws(()=>readAssembly('{"fan":"javascript:bad"}'))
 }finally{await f.close()}
})
