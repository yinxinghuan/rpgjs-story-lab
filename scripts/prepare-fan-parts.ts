import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareLayeredPixels,fanPartsSpec,FAN_PARTS_SOURCE} from '../src/layered-device'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=readFileSync('doc/platform-art-candidates/20260912/tunnel-fan-parts-01/candidate.png'),hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(source)!=='8fdd576bd4bc1982436e99a93c04ef1e545ec890d046a75cb5a99e05304dc16a')throw Error('FAN_SOURCE_CHANGED')
const input=PNG.sync.read(source),parts=prepareLayeredPixels({width:input.width,height:input.height,rgba:new Uint8ClampedArray(input.data)},fanPartsSpec,FAN_PARTS_SOURCE)
for(const [index,name] of ['housing','rotor'].entries()){
 const prepared=parts[index],bytes=PNG.sync.write({width:320,height:640,data:Buffer.from(prepared.raster.rgba)}),path=`public/art/fan-${name}-v1.png`
 if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('FAN_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
 console.log(JSON.stringify({name,path,sha256:hash(bytes),bytes:bytes.length,spec:fanPartsSpec,frame:prepared.frames[0],sourceRetained:true}))
}
