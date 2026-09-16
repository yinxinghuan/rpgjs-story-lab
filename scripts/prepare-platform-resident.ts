/** User-authorized matte removal and foot alignment of the accepted-range candidate.
 * No repainting, rescaling, pose changes or production admission. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
export function preparePlatformResident(root:string,sourceHash:string){
const raw=readFileSync(root+'/candidate.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(raw)!==sourceHash)throw Error('SOURCE_CHANGED')
const source=PNG.sync.read(raw)
if(source.width!==1024||source.height!==1408)throw Error('EXPECTED_REVIEWED_1024_BY_1408_GRID')
// 1024 is not divisible by three. Pad two background columns on the right,
// without stretching the source; all figures remain inside their 342px cells.
const padded=new PNG({width:1026,height:1408})
for(let y=0;y<1408;y++)for(let x=0;x<1026;x++){
 const si=(y*1024+Math.min(x,1023))*4,di=(y*1026+x)*4
 source.data.copy(padded.data,di,si,si+4)
}
const spec={columns:3,rows:4,cellWidth:320,cellHeight:352,foot:{x:160,y:328},kind:'actor' as const,backgroundMode:'magenta' as const,neutralMin:200,chromaMax:20}
const prepared=prepareSpritePixels({width:1026,height:1408,rgba:new Uint8ClampedArray(padded.data)},spec)
const bytes=PNG.sync.write({width:prepared.raster.width,height:prepared.raster.height,data:Buffer.from(prepared.raster.rgba)})
writeFileSync(root+'/actor-atlas.png',bytes)
writeFileSync(root+'/preparation.json',JSON.stringify({sourceSha256:hash(raw),sha256:hash(bytes),sourceRetained:true,padding:{right:2},spec,algorithm:prepared.algorithm,metrics:prepared.metrics,frames:prepared.frames,redraw:false,resize:false,walkingAdmitted:false,productionAdmitted:false},null,2)+'\n')
console.log(JSON.stringify({width:prepared.raster.width,height:prepared.raster.height,frames:prepared.frames.length,metrics:prepared.metrics}))
}
