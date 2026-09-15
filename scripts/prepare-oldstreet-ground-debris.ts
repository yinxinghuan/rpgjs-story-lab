/** Authorized source-preserving preparation through the creator's shared kernel.
 * Prepare noninteractive ground detail decals; preserve source. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-ground-debris',bytes=readFileSync(root+'/candidate.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(bytes)!=='7273c81a9e521eb99ea3a0f09adb8b33cdf63cfac8c823d8f41fe2ae3fc50e52')throw Error('SOURCE_CHANGED')
const source=PNG.sync.read(bytes),spec={columns:2,rows:2,cellWidth:512,cellHeight:512,foot:{x:256,y:448},kind:'actor' as const,backgroundMode:'magenta' as const,neutralMin:200,chromaMax:20}
const result=prepareSpritePixels({width:source.width,height:source.height,rgba:new Uint8ClampedArray(source.data)},spec)
const out=PNG.sync.write({width:result.raster.width,height:result.raster.height,data:Buffer.from(result.raster.rgba)})
writeFileSync(root+'/cutout.png',out)
writeFileSync(root+'/preparation.json',JSON.stringify({sourceRetained:true,sourceSha256:hash(bytes),sha256:hash(out),spec,algorithm:result.algorithm,metrics:result.metrics,frames:result.frames,walkingAdmitted:false,productionAdmitted:false},null,2)+'\n')
console.log(JSON.stringify({algorithm:result.algorithm,metrics:result.metrics,frames:result.frames.length}))
