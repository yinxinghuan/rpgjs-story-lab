/** Authorized source-preserving preparation through the creator's shared kernel.
 * This candidate has failed pose review; processing never admits it to the game. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-lan-walking',bytes=readFileSync(root+'/candidate.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(bytes)!=='647e87615a1db8f8b75e4e575fa3fd35ff1f3ae78b66026219d855195ce69019')throw Error('SOURCE_CHANGED')
const source=PNG.sync.read(bytes),spec={columns:3,rows:4,cellWidth:320,cellHeight:352,foot:{x:160,y:328},kind:'actor' as const,backgroundMode:'magenta' as const,neutralMin:200,chromaMax:20}
const result=prepareSpritePixels({width:source.width,height:source.height,rgba:new Uint8ClampedArray(source.data)},spec)
const out=PNG.sync.write({width:result.raster.width,height:result.raster.height,data:Buffer.from(result.raster.rgba)})
writeFileSync(root+'/cutout.png',out)
writeFileSync(root+'/preparation.json',JSON.stringify({sourceRetained:true,sourceSha256:hash(bytes),sha256:hash(out),spec,algorithm:result.algorithm,metrics:result.metrics,frames:result.frames,walkingAdmitted:false,productionAdmitted:false},null,2)+'\n')
console.log(JSON.stringify({algorithm:result.algorithm,metrics:result.metrics,frames:result.frames.length}))
