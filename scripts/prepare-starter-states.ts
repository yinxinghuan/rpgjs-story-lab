import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
// Authorized splitting, matte removal and contact alignment. Keep both inputs.
// Do not admit the ceramic fuse in the rejected atlas's third column.
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
const inputs=[
 ['doc/platform-art-candidates/20260911/starter-edit-02/candidate.png','8eb32bb26a859cf20c1647bddb0896c3f8821b53f5aff1e6a71641b1adcde8da'],
 ['doc/platform-art-candidates/20260911/starter-repair-03/candidate.png','2a55ef71cf18431a9eff62336a265f11d4c4af2e93fc12c77ff0749b4bcd71b2']
].map(([path,sha256])=>{const bytes=readFileSync(path);if(hash(bytes)!==sha256)throw Error('STARTER_SOURCE_CHANGED');return {path,sha256,png:PNG.sync.read(bytes)}})
const rgba=new Uint8ClampedArray(640*640*4)
for(let y=0;y<640;y++){
 rgba.set(inputs[0].png.data.subarray((y*960+320)*4,(y*960+640)*4),y*640*4)
 rgba.set(inputs[1].png.data.subarray(y*320*4,(y+1)*320*4),(y*640+320)*4)
}
const spec={columns:2,rows:1,cellWidth:320,cellHeight:640,foot:{x:160,y:544},kind:'states' as const,backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20,sourceAnchors:[{x:173,y:463},{x:173,y:468}]}
const prepared=prepareSpritePixels({width:640,height:640,rgba},spec)
const bytes=PNG.sync.write({width:640,height:640,data:Buffer.from(prepared.raster.rgba)}),path='public/art/starter-states-v1.png'
if(existsSync(path)){if(!readFileSync(path).equals(bytes))throw Error('STARTER_OUTPUT_EXISTS')}else writeFileSync(path,bytes,{flag:'wx'})
console.log(JSON.stringify({path,sha256:hash(bytes),bytes:bytes.length,spec,frames:prepared.frames,metrics:prepared.metrics,sources:inputs.map(({path,sha256})=>({path,sha256})),originalsRetained:true},null,2))
