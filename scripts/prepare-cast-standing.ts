import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const sources={lin:'ef0812b156b9a7fb33cbab8c30b65c51a6ef008d0972f1181fd4302fa6d12cc5',mako:'c9dc59436248818e2755e26f58c7352f08b8ba620889e6cd5f285b5784f75b11'} as const
const id=process.argv[2];if(id!=='lin'&&id!=='mako')throw Error('Pass lin or mako; no unreviewed source accepted')
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=readFileSync(`doc/platform-art-candidates/20260912/${id}-standing-01/candidate.png`),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(source)!==sources[id])throw Error('CAST_SOURCE_CHANGED')
const input=PNG.sync.read(source),spec={columns:1,rows:1,cellWidth:640,cellHeight:640,foot:{x:320,y:600},kind:'actor' as const,backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20}
const prepared=prepareSpritePixels({width:input.width,height:input.height,rgba:new Uint8ClampedArray(input.data)},spec),frame=new PNG({width:640,height:640});frame.data.set(prepared.raster.rgba)
const bytes=PNG.sync.write(frame),path=`public/art/${id}-standing-v1.png`
if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('CAST_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
console.log(JSON.stringify({path,sha256:hash(bytes),bytes:bytes.length,spec,frame:prepared.frames[0],sourceRetained:true}))
