import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const candidates={
 'hero-leg-layer-08':{sha256:'c8769255e3b9943c0358f4fcf5f5850feedf7d7ea43b5e11ea6cfd1159185404',anchors:[{x:155,y:305},{x:155,y:305}]},
 'hero-leg-neutral-09':{sha256:'e342a40ebc4d72dd87ad952a3d1d8d232c3a0e2fb516581233db95da88c12518',anchors:[{x:152,y:306},{x:168,y:306}]},
}
const name=process.argv[2]??'hero-leg-layer-08'
if(!Object.hasOwn(candidates,name))throw Error('UNKNOWN_LEG_CANDIDATE')
const candidate=candidates[name as keyof typeof candidates]
const dir='doc/platform-art-candidates/20260913/'+name
const source=readFileSync(dir+'/candidate.png'),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(source)!==candidate.sha256)throw Error('LEG_SOURCE_CHANGED')
const input=PNG.sync.read(source)
// Only matte/edge cleanup and explicitly inspected anchor alignment; mirrored
// motion remains a read-only renderer experiment, never baked into this PNG.
const spec={columns:2,rows:1,cellWidth:320,cellHeight:320,foot:{x:155,y:305},sourceAnchors:candidate.anchors,kind:'states' as const,backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
const prepared=prepareSpritePixels({width:input.width,height:input.height,rgba:new Uint8ClampedArray(input.data)},spec)
const bytes=PNG.sync.write({width:640,height:320,data:Buffer.from(prepared.raster.rgba)})
const path=dir+'/candidate-alpha.png'
if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('LEG_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
const report={path,sha256:hash(bytes),sourceSha256:hash(source),bytes:bytes.length,spec,metrics:prepared.metrics,frames:prepared.frames,sourceUnchanged:true,admitted:false}
writeFileSync(dir+'/preparation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report))
