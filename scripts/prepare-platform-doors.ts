/** Reviewed platform candidates: remove only connected exterior matte + magenta aperture. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import assert from 'node:assert/strict'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/door-platform-20260918',hash=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex')
const name=process.argv[2],config=JSON.parse(readFileSync(`${root}/${name}/preparation.json`,'utf8'))
const bytes=readFileSync(`${root}/${name}/candidate.png`),state=JSON.parse(readFileSync(`${root}/${name}/state.json`,'utf8'))
assert.equal(hash(bytes),state.asset.sha256)
const p=PNG.sync.read(bytes);assert.equal(p.width,768);assert.equal(p.height,512)
const rgba=new Uint8ClampedArray(p.data),visited=new Uint8Array(p.width*p.height),queue:number[]=[]
// Background is sampled from the reviewed outer corner, not from the wood or aperture.
const bg=[...rgba.slice(0,3)],near=(i:number)=>bg.every((v,c)=>Math.abs(rgba[i*4+c]-v)<=config.exteriorTolerance)
const seed=(i:number)=>{if(!visited[i]&&near(i)){visited[i]=1;queue.push(i)}}
for(let x=0;x<p.width;x++){seed(x);seed((p.height-1)*p.width+x)}
for(let y=0;y<p.height;y++){seed(y*p.width);seed(y*p.width+p.width-1)}
for(let k=0;k<queue.length;k++){const i=queue[k],x=i%p.width,y=Math.floor(i/p.width);if(x)seed(i-1);if(x<p.width-1)seed(i+1);if(y)seed(i-p.width);if(y<p.height-1)seed(i+p.width)}
for(const i of queue)rgba[i*4+3]=0
for(let i=0;i<rgba.length;i+=4){const r=rgba[i],g=rgba[i+1],b=rgba[i+2];if(r>15&&b>15&&r-g>12&&b-g>12){rgba[i]=255;rgba[i+1]=0;rgba[i+2]=255;rgba[i+3]=0}}
const spec={columns:2,rows:1,cellWidth:384,cellHeight:512,foot:config.foot??{x:192,y:450},kind:'states' as const,backgroundMode:'magenta' as const,neutralMin:240,chromaMax:12,sourceAnchors:config.anchors,matteSeeds:config.seeds}
const result=prepareSpritePixels({width:p.width,height:p.height,rgba},spec),out=PNG.sync.write({width:768,height:512,data:Buffer.from(result.raster.rgba)})
mkdirSync(`${root}/prepared`,{recursive:true});writeFileSync(`${root}/prepared/${name}.png`,out)
writeFileSync(`${root}/prepared/${name}.json`,JSON.stringify({source:`${root}/${name}/candidate.png`,sourceSha256:hash(bytes),sha256:hash(out),provider:'alteru-media',taskId:state.task.task_id,spec,metrics:result.metrics,exteriorRemoved:queue.length,operations:['connected corner-color exterior matte removal','reviewed magenta aperture removal','integer translation to shared threshold anchor; no warping or redraw']},null,2)+'\n')
console.log(name,hash(out))
