import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source='doc/platform-art-candidates/20260912/brake-parts-02/candidate.png',bytes=readFileSync(source),sha256=createHash('sha256').update(bytes).digest('hex')
if(sha256!=='80196c51b93ed7e4a6e5457b3fa996a2ed839dc4ce77f400782fb9655bc62fa7')throw Error('BRAKE_SOURCE_CHANGED')
const png=PNG.sync.read(bytes),rgba=new Uint8ClampedArray(912*640*4)
// Discard only each cell's eight-pixel blank margin, which contains the unwanted
// divider lines. No subject pixels are rescaled, painted or synthesized.
for(let column=0;column<3;column++)for(let y=0;y<640;y++)rgba.set(png.data.subarray((y*960+column*320+8)*4,(y*960+column*320+312)*4),(y*912+column*304)*4)
const spec={kind:'states' as const,columns:3,rows:1,cellWidth:304,cellHeight:640,foot:{x:152,y:544},backgroundMode:'pale-neutral' as const,neutralMin:200,chromaMax:20,sourceAnchors:[{x:152,y:478},{x:152,y:431},{x:152,y:431}]}
const prepared=prepareSpritePixels({width:912,height:640,rgba},spec),out=PNG.sync.write({width:912,height:640,data:Buffer.from(prepared.raster.rgba)}),path='public/art/brake-parts-v1.png'
if(existsSync(path)){if(!readFileSync(path).equals(out))throw Error('BRAKE_OUTPUT_EXISTS')}else writeFileSync(path,out,{flag:'wx'})
console.log(JSON.stringify({source,sourceSha256:sha256,path,sha256:createHash('sha256').update(out).digest('hex'),bytes:out.length,spec,frames:prepared.frames,metrics:prepared.metrics,originalRetained:true},null,2))
