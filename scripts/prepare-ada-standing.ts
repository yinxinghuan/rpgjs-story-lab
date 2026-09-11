import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
// Offline reproducibility of the creator's authorized processing, PNG codec only.
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=readFileSync('doc/platform-art-candidates/20260911/actor-edit-03/candidate.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(source)!=='43ba101c2bc5903ae6df9efef0067c1a753c44df2079285a74e7d3a3fb6144dd')throw Error('ADA_SOURCE_CHANGED')
const input=PNG.sync.read(source)
const spec={columns:3,rows:4,cellWidth:320,cellHeight:320,foot:{x:160,y:300},kind:'actor' as const,backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
const prepared=prepareSpritePixels({width:input.width,height:input.height,rgba:new Uint8ClampedArray(input.data)},spec)
// Only the front stationary frame is under review. No incorrect directions ship.
const frame=new PNG({width:320,height:320})
for(let y=0;y<320;y++)frame.data.set(prepared.raster.rgba.subarray((y*960+320)*4,(y*960+640)*4),y*320*4)
const bytes=PNG.sync.write(frame),path='public/art/ada-standing-v1.png'
if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('ADA_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
console.log(JSON.stringify({path,sha256:hash(bytes),bytes:bytes.length,spec,frame:prepared.frames[1],sourceRetained:true}))
