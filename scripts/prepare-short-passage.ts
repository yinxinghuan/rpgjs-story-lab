/** Single reviewed platform sprite. Matte removal only; no crop, warp or repaint. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const dir='doc/door-platform-20260918/short-passage-high-view',hash=(v:Uint8Array)=>createHash('sha256').update(v).digest('hex'),raw=readFileSync(`${dir}/candidate.png`),state=JSON.parse(readFileSync(`${dir}/state.json`,'utf8'))
assert.equal(hash(raw),state.asset.sha256)
const p=PNG.sync.read(raw);let removed=0
for(let i=0;i<p.data.length;i+=4){const [r,g,b]=p.data.subarray(i,i+3);if(r-g>35&&b-g>35){p.data[i+3]=0;removed++}}
const out=PNG.sync.write(p);writeFileSync(`${dir}/cutout.png`,out)
writeFileSync(`${dir}/preparation.json`,JSON.stringify({provider:'alteru-media',taskId:state.task.task_id,sourceSha256:hash(raw),sha256:hash(out),operation:'magenta matte removal only',removed,width:p.width,height:p.height,groundAnchor:{x:384,y:307.5},scale:56/251,review:'local representative scene trial; not bulk library replacement'},null,2))
console.log({removed,sha256:hash(out)})
