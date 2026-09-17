/** Authorized matte cleanup of the two inspected platform leaves; preserve all painted pixels. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
for(const name of ['side-door-face','side-door-plain','shop-door-watch-left-v2','shop-door-photo-v1']){
 const dir=`doc/door-platform-20260918/${name}`,raw=readFileSync(`${dir}/candidate.png`),state=JSON.parse(readFileSync(`${dir}/state.json`,'utf8')),hash=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex')
 assert.equal(hash(raw),state.asset.sha256)
 const p=PNG.sync.read(raw);let removed=0
 for(let i=0;i<p.data.length;i+=4){const [r,g,b]=p.data.subarray(i,i+3);if(r-g>35&&b-g>35){p.data[i+3]=0;removed++}}
 let minX=p.width,minY=p.height,maxX=-1,maxY=-1;for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]){minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
 assert.ok(maxX>minX&&maxY>minY&&minX>0&&minY>0&&maxX<p.width-1&&maxY<p.height-1,'complete isolated leaf must fit canvas')
 const bounds={x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1};
 const out=PNG.sync.write(p);writeFileSync(`${dir}/cutout.png`,out)
 writeFileSync(`${dir}/preparation.json`,JSON.stringify({provider:'alteru-media',taskId:state.task.task_id,sourceSha256:hash(raw),sha256:hash(out),operation:'magenta matte removal only',removed,width:p.width,height:p.height,bounds},null,2))
 console.log(name,hash(out))
}
