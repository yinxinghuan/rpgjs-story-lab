/** Offline postprocessing authorized for platform object PNGs; source remains intact. */
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-trolley-candidate',source=readFileSync(`${root}/correction/candidate.png`),hash=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex')
if(hash(source)!=='4932eebf408b4a429a8623a1e5e13546259c343e6e72298d4809d31f9c9147bd')throw Error('SOURCE_CHANGED')
const input=PNG.sync.read(source),spec={columns:1,rows:1,cellWidth:512,cellHeight:640,foot:{x:256,y:580},kind:'actor' as const,backgroundMode:'pale-neutral' as const,neutralMin:225,chromaMax:20,matteSeeds:[{x:256,y:160}]}
const prepared=prepareSpritePixels({width:input.width,height:input.height,rgba:new Uint8ClampedArray(input.data)},spec)
const out=new PNG({width:512,height:640});out.data.set(prepared.raster.rgba)
const bytes=PNG.sync.write(out),path=`${root}/cutout.png`
if(existsSync(path)&&process.argv.includes('--check')&&!readFileSync(path).equals(bytes))throw Error('OUTPUT_CHANGED')
writeFileSync(path,bytes)
writeFileSync(`${root}/preparation.json`,JSON.stringify({sourceRetained:true,sha256:hash(bytes),spec,frames:prepared.frames,metrics:prepared.metrics,productionAdmitted:false},null,2)+'\n')
console.log(JSON.stringify({path,frames:prepared.frames}))
