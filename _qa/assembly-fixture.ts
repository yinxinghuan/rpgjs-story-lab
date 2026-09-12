// Isolated diagnostic publications. These fixtures exercise contracts, not
// aesthetic approval; the actor is a deliberately synthetic directional grid.
import {readFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {newSpriteSource,inspectSpritePng,type SpriteDraft,type SpritePng} from '../src/sprite-draft'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
import {inspectActorMapCandidate} from '../src/sprite-map-candidate'
import {ACTOR_MAP_CHECKS,actorMapReview} from '../src/actor-map-review'
import {ACTOR_DIRECTIONS,ACTOR_ROW_CHECKS,emptyActorAnswers,saveActorSheetReview,saveActorMapReview} from '../src/actor-sheet-review'
import {inspectDeviceMapCandidate} from '../src/device-map-candidate'
import {DEVICE_LAYOUT,DEVICE_CHECKS,deviceGeometry} from '../src/device-publication'
import {BACKGROUND_LAYOUT,BACKGROUND_CHECKS} from '../src/background-publication'
import {inspectArtCandidate,planArtDraft,type ArtDraft} from '../src/art-draft'
import {fanPartsSpec,LAYER_CHECKS} from '../src/layered-device'
import {newLayeredSource,layerSignature,type LayeredDraft} from '../src/layered-draft'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const encode=async(r:PixelRaster)=>inspectSpritePng(PNG.sync.write({width:r.width,height:r.height,data:Buffer.from(r.rgba)}))
const decode=async(p:SpritePng)=>{const r=PNG.sync.read(Buffer.from(p.bytes));return {width:r.width,height:r.height,rgba:new Uint8ClampedArray(r.data)}}
const png=async(path:string)=>inspectSpritePng(new Uint8Array(readFileSync(path)))
export const assemblyBackgroundBytes=()=>new Uint8Array(readFileSync('doc/platform-art-candidates/20260911/environment-edit-02/candidate.png'))
export async function assemblyBackgroundDraft():Promise<ArtDraft>{const candidate=await inspectArtCandidate(assemblyBackgroundBytes());return {...planArtDraft('cool'),taskId:'mt_1a1c4492493eaf68a32331d43d91c207',candidate,state:'candidate',retryable:false,review:{sha256:candidate.sha256,layout:BACKGROUND_LAYOUT,checks:[...BACKGROUND_CHECKS],visualAccepted:true}}}

export async function assemblyActorDraft(){
 const width=72,height=96,rgba=new Uint8ClampedArray(width*height*4).fill(255)
 for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(x%24>=7&&x%24<17&&y%24>=4&&y%24<20)rgba.set([[25,80,100,255],[145,85,25,255],[30,85,170,255],[125,45,145,255]][Math.floor(y/24)],(y*width+x)*4)
 const source=await encode({width,height,rgba}),spec={kind:'actor' as const,columns:3,rows:4,cellWidth:24,cellHeight:24,foot:{x:12,y:20},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20},p=prepareSpritePixels(await decode(source),spec)
 let d:SpriteDraft={...newSpriteSource(source,'synthetic diagnostic, not qualified art','actor'),spec,state:'candidate',result:{png:await encode(p.raster),frames:p.frames,metrics:p.metrics,algorithm:p.algorithm}}
 const repo={get:async()=>d,list:async()=>[d],save:async(n:SpriteDraft)=>{d=n}},answers=emptyActorAnswers()
 for(const direction of ACTOR_DIRECTIONS)for(const c of ACTOR_ROW_CHECKS)answers[direction][c]='pass'
 d=await saveActorSheetReview(repo,d,answers);const candidate=await inspectActorMapCandidate(d,d.id,decode)
 return saveActorMapReview(repo,d,actorMapReview(candidate,[...ACTOR_MAP_CHECKS]),candidate,decode)
}

export async function assemblyDeviceDraft(){const source=await png('public/art/starter-states-v1.png');const spec={kind:'states' as const,columns:2,rows:1,cellWidth:320,cellHeight:640,foot:{x:160,y:544},backgroundMode:'alpha' as const,neutralMin:200,chromaMax:20,sourceAnchors:[{x:160,y:544},{x:160,y:544}]},p=prepareSpritePixels(await decode(source),spec)
 const d:SpriteDraft={...newSpriteSource(source,'platform repair states','states'),deviceStateSet:'repair',spec,state:'candidate',result:{png:await encode(p.raster),frames:p.frames,metrics:p.metrics,algorithm:p.algorithm}}
 const c=await inspectDeviceMapCandidate(d,d.id,decode);d.deviceReview={sha256:c.png.sha256,layout:DEVICE_LAYOUT,geometry:deviceGeometry(c.cellWidth,c.cellHeight,c.foot,c.bounds),checks:[...DEVICE_CHECKS],visualAccepted:true};return d
}

export async function assemblyLayerDraft(){const d:LayeredDraft={...newLayeredSource(await png('doc/platform-art-candidates/20260912/tunnel-fan-parts-01/candidate.png'),'platform-fan-test',fanPartsSpec),state:'candidate',result:{housing:await png('public/art/fan-housing-v1.png'),rotor:await png('public/art/fan-rotor-v1.png')}};d.review={signature:await layerSignature(d),layout:'layered-north-river-1',checks:[...LAYER_CHECKS],visualAccepted:true};return d}
