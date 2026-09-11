import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {repairHeroBackStride} from '../src/hero-back-gait-repair'
// PNG codec only: no browser is launched or controlled by this offline script.
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source=readFileSync('public/art/overhead/hero.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(source)!=='7d07b1e22e9ccbae89ec6da2291fa3898b118f1896330430299d9955ee791793')throw Error('HERO_GAIT_SOURCE_CHANGED')
const decoded=PNG.sync.read(source),result=repairHeroBackStride({width:decoded.width,height:decoded.height,rgba:new Uint8ClampedArray(decoded.data)})
const out=new PNG({width:result.width,height:result.height});out.data=Buffer.from(result.rgba)
const bytes=PNG.sync.write(out),path='public/art/overhead/hero-gait-v2.png'
if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('HERO_GAIT_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
console.log(JSON.stringify({sourceSha256:hash(source),resultSha256:hash(bytes),path,width:result.width,height:result.height,changedArea:{column:2,row:3,startY:266},originalRetained:true}))
