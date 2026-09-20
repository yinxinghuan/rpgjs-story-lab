/** Matte removal only: no resizing, warping, cropping, or repainting door pixels. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import assert from 'node:assert/strict'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const catalogPath='src/material-library/side-door-catalog.json'
const catalog=JSON.parse(readFileSync(catalogPath,'utf8'))
const variants={'shop-photo':'platform-reference-2','shop-clock':'shop-clock-left',clock:'clock',plain:'plain'}
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
for(const [id,name] of Object.entries(variants)){
 const dir=`doc/door-projection-20260920/${name}`,raw=readFileSync(`${dir}/candidate.png`),state=JSON.parse(readFileSync(`${dir}/state.json`,'utf8'))
 assert.equal(hash(raw),state.asset.sha256)
 const png=PNG.sync.read(raw);let removed=0,minX=png.width,minY=png.height,maxX=-1,maxY=-1
 for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++){
  const i=(y*png.width+x)*4,[r,g,b]=png.data.subarray(i,i+3)
  if(r-g>35&&b-g>35){png.data[i+3]=0;removed++}
  else {minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y)}
 }
 assert.ok(minX>0&&minY>0&&maxX<png.width-1&&maxY<png.height-1,'complete isolated silhouette')
 const bounds={x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1},bytes=PNG.sync.write(png)
 const preparation={provider:'alteru-media',taskId:state.task.task_id,sourceSha256:hash(raw),sha256:hash(bytes),operation:'magenta matte removal only; native aspect ratio and thickness preserved',removed,width:png.width,height:png.height,bounds}
 writeFileSync(`${dir}/cutout.png`,bytes)
 writeFileSync(`${dir}/preparation.json`,JSON.stringify(preparation,null,2)+'\n')
 catalog.leaves[id]={...catalog.leaves[id],...preparation,status:'admitted-native-thickness',asset:`../../${dir}/cutout.png`}
 console.log(id,JSON.stringify(bounds),'projectedHeight',48*bounds.height/bounds.width)
}
catalog.version=2
catalog.projection='native-elevated-orthographic-20260921'
delete catalog.slab
catalog.note='Platform-generated complete door slabs include their own top and edge thickness. Only magenta matte removal; uniform render scaling preserves native projection. Native left-hinge watch-shop lettering never mirrors. Requests, raw PNGs and task hashes retained under doc/door-projection-20260920.'
writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n')
