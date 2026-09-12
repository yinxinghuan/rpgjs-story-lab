import test from 'node:test'
import assert from 'node:assert/strict'
import {createServer} from 'node:http'
import {mkdtempSync,rmSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {tmpdir} from 'node:os'
import {randomUUID} from 'node:crypto'
import {PreflightStorage} from '../server/preflight-storage'
import {CreatorSpriteArchive} from '../server/creator-sprites'
import {createHandler,CarriageJourneyAuthority} from '../worker/source'
import {creatorCloudTransport} from '../src/creator-cloud'
import {SpriteCloudArchive} from '../src/sprite-cloud'
import {newSpriteSource,inspectSpritePng,type SpriteDraft,type SpritePng} from '../src/sprite-draft'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
import {inspectActorMapCandidate,verifyPublishedActorPixels} from '../src/sprite-map-candidate'
import {ACTOR_MAP_CHECKS,actorMapReview} from '../src/actor-map-review'
import {ACTOR_DIRECTIONS,ACTOR_ROW_CHECKS,emptyActorAnswers,saveActorSheetReview,saveActorMapReview} from '../src/actor-sheet-review'
import {actorReviewId} from '../src/actor-review-archive'
import {assertPublishedActor,actorReleasePath} from '../src/actor-publication'
import {originalSessionHttp} from '../src/original-session-http'
import {originalTrainRuntime} from '../server/original-train-runtime'
import {originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import {originalActorRelease,originalStarterRelease,originalEnrollmentAssets,originalBackgroundVersion,originalBackgroundReleases,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
import {originalActorResource,originalStandingSheet,originalActorDirection,originalCharacterArtAnimation} from '../src/original-character-art'
import {originalEquipmentBodies} from '../src/original-equipment-art'
import {DEVICE_LAYOUT,DEVICE_CHECKS,deviceGeometry,type PublishedDevice} from '../src/device-publication'
import {BACKGROUND_LAYOUT,BACKGROUND_CHECKS,type PublishedBackground} from '../src/background-publication'
import {GAME_ID} from '../src/game-id'
import {spriteManifest,spritePartText,SPRITE_ARCHIVE_PART} from '../src/sprite-archive-contract'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
export async function diagnosticActorDraft(){
 const width=72,height=96,rgba=new Uint8ClampedArray(width*height*4).fill(255)
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x%24>=7&&x%24<17&&y%24>=4&&y%24<20)rgba.set([[25,80,100,255],[145,85,25,255],[30,85,170,255],[125,45,145,255]][Math.floor(y/24)],(y*width+x)*4)
 const source=await encode({width,height,rgba}),spec={kind:'actor' as const,columns:3,rows:4,cellWidth:24,cellHeight:24,foot:{x:12,y:20},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20},p=prepareSpritePixels(await decode(source),spec)
 let d:SpriteDraft={...newSpriteSource(source,'synthetic diagnostic, not qualified art','actor'),spec,state:'candidate',result:{png:await encode(p.raster),frames:p.frames,metrics:p.metrics,algorithm:p.algorithm}}
 const repo={get:async()=>d,list:async()=>[d],save:async(n:SpriteDraft)=>{d=n}},answers=emptyActorAnswers()
 for(const direction of ACTOR_DIRECTIONS)for(const c of ACTOR_ROW_CHECKS)answers[direction][c]='pass'
 d=await saveActorSheetReview(repo,d,answers);const candidate=await inspectActorMapCandidate(d,d.id,decode)
 return saveActorMapReview(repo,d,actorMapReview(candidate,[...ACTOR_MAP_CHECKS]),candidate,decode)
}
class Memory implements Storage{v=new Map<string,string>();get length(){return this.v.size}key(i:number){return [...this.v.keys()][i]??null}getItem(k:string){return this.v.get(k)??null}setItem(k:string,v:string){this.v.set(k,v)}removeItem(k:string){this.v.delete(k)}clear(){this.v.clear()}}
const lock=async<T>(_n:string,w:()=>Promise<T>)=>w()
export async function actorPublicationFixture(){
 const dir=mkdtempSync(join(tmpdir(),'published-actor-')),pool=new PreflightStorage(dir),objects=new Map<string,CarriageJourneyAuthority>();let lose=''
 const env={CARRIAGE_JOURNEYS:{idFromName:(s:string)=>s,get:(id:unknown)=>({fetch:(r:Request)=>{const key=String(id);let o=objects.get(key);if(!o){o=new CarriageJourneyAuthority(pool.context(key),env,undefined,undefined,undefined);objects.set(key,o)}return o.fetch(r)}})}}
 const handle=createHandler(true,false,true,undefined,undefined,true)
 const server=createServer(async(req,res)=>{try{const chunks:Buffer[]=[];for await(const c of req)chunks.push(Buffer.from(c));const headers=new Headers();for(const [k,v]of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v)
  const path=(req.url??'/').replace('/'+GAME_ID+'/api/','/api/'),r=await handle(new Request('http://localhost'+path,{method:req.method,headers,body:req.method==='GET'?undefined:Buffer.concat(chunks)}),env)
  if(lose&&path.endsWith(lose)&&req.method==='POST'&&r.ok){lose='';res.destroy();return}res.writeHead(r.status,Object.fromEntries(r.headers));res.end(Buffer.from(await r.arrayBuffer()))
 }catch{res.writeHead(503);res.end('{}')}})
 await new Promise<void>((r,j)=>{server.once('error',j);server.listen(0,'127.0.0.1',r)})
 const base='http://127.0.0.1:'+(server.address() as any).port,creatorStore=new Memory(),playerStore=new Memory(),api=creatorCloudTransport(creatorStore,lock,fetch,base)
 return {base,api,cloud:new SpriteCloudArchive(api),lose:(s:string)=>{lose=s},player:(actor?:string,hero?:string)=>originalSessionHttp(playerStore,lock,fetch,base,undefined,undefined,undefined,actor,undefined,hero),restart:()=>{objects.clear();pool.close()},close:async()=>{server.closeAllConnections();await new Promise<void>(r=>server.close(()=>r()));pool.close();rmSync(dir,{recursive:true,force:true})}}
}
