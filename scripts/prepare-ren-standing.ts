import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=readFileSync('doc/platform-art-candidates/20260912/ren-standing-02/candidate.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(source)!=='db7701d7cda3510a6500242abb9bafd719d3ac5b7f252d096b94e9a79d4eb4d5')throw Error('REN_SOURCE_CHANGED')
const input=PNG.sync.read(source)
const spec={columns:1,rows:1,cellWidth:640,cellHeight:640,foot:{x:320,y:600},kind:'actor' as const,backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
const prepared=prepareSpritePixels({width:input.width,height:input.height,rgba:new Uint8ClampedArray(input.data)},spec)
const frame=new PNG({width:640,height:640});frame.data.set(prepared.raster.rgba)
const bytes=PNG.sync.write(frame),path='public/art/ren-standing-v1.png'
if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('REN_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
console.log(JSON.stringify({path,sha256:hash(bytes),bytes:bytes.length,spec,frame:prepared.frames[0],sourceRetained:true}))
