/** Source-preserving preparation of the user-requested blocking-crate replacement. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-crates/threshold-redesign',bytes=readFileSync(root+'/candidate.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(bytes)!=='fcf795eaa14354d1b20d7e4f5fb4b53cc0d5b167af58f2d0974e165794ad2673')throw Error('SOURCE_CHANGED')
const source=PNG.sync.read(bytes)
const spec={columns:1,rows:1,cellWidth:768,cellHeight:512,foot:{x:384,y:448},kind:'actor' as const,backgroundMode:'magenta' as const,neutralMin:200,chromaMax:20}
const result=prepareSpritePixels({width:source.width,height:source.height,rgba:new Uint8ClampedArray(source.data)},spec)
const out=PNG.sync.write({width:result.raster.width,height:result.raster.height,data:Buffer.from(result.raster.rgba)})
writeFileSync(root+'/cutout.png',out)
writeFileSync(root+'/preparation.json',JSON.stringify({sourceRetained:true,sourceSha256:hash(bytes),sha256:hash(out),spec,algorithm:result.algorithm,metrics:result.metrics,frames:result.frames,redraw:false,resize:false,productionAdmitted:false},null,2)+'\n')
console.log(JSON.stringify({frames:result.frames,metrics:result.metrics}))
