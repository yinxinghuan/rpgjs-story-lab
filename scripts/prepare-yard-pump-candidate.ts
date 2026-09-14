/** Default retains the reviewed partial sheet; --complete adds the new guard-open
 * candidate. Neither output is automatically admitted to production. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {composeStateFrames} from '../src/sprite-composition'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/platform-art-candidates/20260914'
const sources=[{folder:'yard-pump-base-02',state:'stopped',sha256:'55e856d34dd96b6339dba5fd75ab0db52cd99f465619f6b2eeb7186621542a3a'},{folder:'yard-pump-repaired-03',state:'repaired',sha256:'17663f050a0a1a18552690957562ab862f29e84bf2850150f60169b9b0831889'}]
const complete=process.argv.includes('--complete')
if(complete)sources.push({folder:'yard-pump-open-barrier-07',state:'forced',sha256:'15f7cd15455b6547b829f1af45f4bbe7c35ec7e65841189315e703e9190e9994'})
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
const inputs=sources.map(s=>{const b=readFileSync(root+'/'+s.folder+'/candidate.png');assert.equal(hash(b),s.sha256);const p=PNG.sync.read(b);return {raster:{width:p.width,height:p.height,rgba:new Uint8ClampedArray(p.data)},columns:1,column:0}})
// The repaired coupling encloses a separate white background island. Its seed
// is verified against the source pixel (253,253,253); it is not machine metal.
const spec={columns:2,rows:1,cellWidth:512,cellHeight:640,foot:{x:256,y:500},kind:'states' as const,backgroundMode:'pale-neutral' as const,neutralMin:240,chromaMax:12,sourceAnchors:[{x:244,y:472},{x:244,y:480}],matteSeeds:[{x:250,y:430},{x:450,y:350},{x:762,y:430},{x:962,y:350},{x:762,y:310}]}
if(complete){spec.columns=3;spec.sourceAnchors.push({x:244,y:485});spec.matteSeeds.push({x:1474,y:350},{x:1274,y:310})}
const prepared=prepareSpritePixels(composeStateFrames(inputs),spec),out=root+(complete?'/yard-pump-prepared-08':'/yard-pump-prepared-06');mkdirSync(out,{recursive:true})
const png=PNG.sync.write({width:prepared.raster.width,height:prepared.raster.height,data:Buffer.from(prepared.raster.rgba)})
writeFileSync(out+'/candidate.png',png)
const report={sources,spec,frames:prepared.frames,metrics:prepared.metrics,sha256:hash(png),bytes:png.length,productionAdopted:false,missingStates:complete?[]:['forced'],operations:['lossless source frame composition','connected neutral background removal with reviewed hose and guard interior seeds','translation aligning front support feet; no scaling or repainting']}
writeFileSync(out+'/preparation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({sha256:report.sha256,bytes:report.bytes,metrics:report.metrics}))
