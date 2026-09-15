/** Authorized source-preserving preparation through the creator's shared kernel.
 * Prepare the movable crate group without changing its collision footprint. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-crates',bytes=readFileSync(root+'/candidate.png')
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
if(hash(bytes)!=='8a4368414975a05674555070cfe51e6eeb220b5aa298261ece721ed2d6c30d7e')throw Error('SOURCE_CHANGED')
const source=PNG.sync.read(bytes),spec={columns:1,rows:1,cellWidth:512,cellHeight:512,foot:{x:256,y:448},kind:'actor' as const,backgroundMode:'magenta' as const,neutralMin:200,chromaMax:20}
// This source uses muted purple rather than the requested pure magenta.
// Remove only border-connected purple; the brown crate has blue below green.
const count=source.width*source.height,seen=new Uint8Array(count),queue=new Int32Array(count);let first=0,last=0
const visit=(p:number)=>{const i=p*4;if(!seen[p]&&Math.min(source.data[i],source.data[i+2])>=100&&Math.min(source.data[i],source.data[i+2])-source.data[i+1]>=60){seen[p]=1;queue[last++]=p}}
for(let x=0;x<source.width;x++){visit(x);visit(count-source.width+x)}
for(let y=0;y<source.height;y++){visit(y*source.width);visit(y*source.width+source.width-1)}
while(first<last){const p=queue[first++],x=p%source.width;if(x)visit(p-1);if(x<source.width-1)visit(p+1);if(p>=source.width)visit(p-source.width);if(p+source.width<count)visit(p+source.width)}
if(last<count*.3)throw Error('MATTE_NOT_FOUND')
for(let p=0;p<count;p++)if(seen[p])source.data[p*4+3]=0
const result=prepareSpritePixels({width:source.width,height:source.height,rgba:new Uint8ClampedArray(source.data)},spec)
const out=PNG.sync.write({width:result.raster.width,height:result.raster.height,data:Buffer.from(result.raster.rgba)})
writeFileSync(root+'/cutout.png',out)
writeFileSync(root+'/preparation.json',JSON.stringify({sourceRetained:true,sourceSha256:hash(bytes),sha256:hash(out),spec,sourceMatte:{mode:"border-connected-purple",minRB:100,minDifference:60,removed:last},algorithm:result.algorithm,metrics:result.metrics,frames:result.frames,walkingAdmitted:false,productionAdmitted:false},null,2)+'\n')
console.log(JSON.stringify({algorithm:result.algorithm,metrics:result.metrics,frames:result.frames.length}))
