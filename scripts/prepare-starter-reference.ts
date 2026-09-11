import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
// Authorized frame splitting only. Keep the platform source unchanged.
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=readFileSync('doc/platform-art-candidates/20260911/starter-edit-02/candidate.png')
const sha=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(sha(source)!=='8eb32bb26a859cf20c1647bddb0896c3f8821b53f5aff1e6a71641b1adcde8da')throw Error('STARTER_REFERENCE_CHANGED')
const input=PNG.sync.read(source),out=new PNG({width:320,height:640})
for(let y=0;y<640;y++)out.data.set(input.data.subarray((y*960+320)*4,(y*960+640)*4),y*320*4)
const bytes=PNG.sync.write(out),path='public/art/references/starter-open-source-v1.png'
mkdirSync(dirname(path),{recursive:true})
if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('STARTER_REFERENCE_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
console.log(JSON.stringify({path,sha256:sha(bytes),width:320,height:640,originalRetained:true}))
