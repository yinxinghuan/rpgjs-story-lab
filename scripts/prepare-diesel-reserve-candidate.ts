/** Explicitly selected generated frames, using the creator's existing pixel pipeline.
 * No scaling, mirroring, repainting, publication or runtime binding. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {composeRepairFrames} from '../src/sprite-composition'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/platform-art-candidates/20260914'
const sources=[
 {folder:'diesel-reserve-states-01',sha256:'3faa7453cdb91296f7bb5a686be1b6f31c88a68588885d035b5b8b15af2751c0',state:'full'},
 {folder:'diesel-reserve-gauge-02',sha256:'a8734396bca36df59161b758b7dfe5d6768f2b625f5afc6f7f267e24037497f0',state:'empty'},
]
const hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex')
const inputs=sources.map(source=>{
 const bytes=readFileSync(root+'/'+source.folder+'/candidate.png');assert.equal(hash(bytes),source.sha256)
 const p=PNG.sync.read(bytes);return {raster:{width:p.width,height:p.height,rgba:new Uint8ClampedArray(p.data)},columns:2,column:0}
})
const selected=composeRepairFrames(inputs)
const spec={columns:2,rows:1,cellWidth:320,cellHeight:640,foot:{x:160,y:550},kind:'states' as const,backgroundMode:'pale-neutral' as const,neutralMin:240,chromaMax:12,sourceAnchors:[{x:160,y:542},{x:160,y:545}],matteSeeds:[{x:292,y:300},{x:612,y:300}]}
const prepared=prepareSpritePixels(selected,spec),out=root+'/diesel-reserve-assembled-03';mkdirSync(out,{recursive:true})
const png=PNG.sync.write({width:prepared.raster.width,height:prepared.raster.height,data:Buffer.from(prepared.raster.rgba)})
writeFileSync(out+'/candidate.png',png)
const report={sources:sources.map(s=>({...s,column:0})),operations:['lossless left-column selection','pale neutral connected matte removal including reviewed hose gap seeds','translation to common tank-base anchor'],spec,frames:prepared.frames,metrics:prepared.metrics,sha256:hash(png),productionAdopted:false,scope:'Candidate preparation only; requires visual, in-map scale, collision and state-transition review'}
writeFileSync(out+'/preparation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
