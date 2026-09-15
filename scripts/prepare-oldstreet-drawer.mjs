/** Authorized deterministic candidate repair. Source PNG remains untouched. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-drawer-guided',raw=readFileSync(`${root}/revised/candidate.png`)
if(createHash('sha256').update(raw).digest('hex')!=='767b86bbe3cb9a6a05f5933ac8a30f6b80a98dfe0c1f4b775090572db4b80fce')throw Error('SOURCE_CHANGED')
const source=PNG.sync.read(raw),p=PNG.sync.read(raw),w=p.width,h=p.height
// Preserve the receipt, moved box and table by copying the open frame.
for(let y=0;y<h;y++)source.data.copy(p.data,(y*w+1024)*4,(y*w+512)*4,(y*w+1024)*4)
// Empty wood under the lens comes from the source empty drawer, with its
// measured horizontal table displacement (+9px). No synthesized pixels.
for(let y=375;y<440;y++)for(let x=176;x<329;x++)source.data.copy(p.data,(y*w+1024+x)*4,(y*w+1024+x+9)*4,(y*w+1024+x+10)*4)
const paper=[[174,381],[215,374],[232,428],[187,439]]
const inside=(x,y)=>{let hit=false;for(let i=0,j=paper.length-1;i<paper.length;j=i++){const a=paper[i],b=paper[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit}return hit}
for(let y=374;y<440;y++)for(let x=174;x<233;x++)if(inside(x,y))source.data.copy(p.data,(y*w+1024+x)*4,(y*w+512+x)*4,(y*w+512+x+1)*4)
const mask=new Uint8Array(w*h),q=new Int32Array(w*h);let a=0,b=0
const visit=i=>{const j=i*4;if(!mask[i]&&Math.min(p.data[j],p.data[j+2])>70&&Math.min(p.data[j],p.data[j+2])-p.data[j+1]>65){mask[i]=1;q[b++]=i}}
for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1)}
while(a<b){const i=q[a++],x=i%w;if(x)visit(i-1);if(x<w-1)visit(i+1);if(i>=w)visit(i-w);if(i+w<w*h)visit(i+w)}
for(let i=0;i<w*h;i++)if(mask[i])p.data.fill(0,i*4,i*4+4)
const bytes=PNG.sync.write(p);writeFileSync(`${root}/states.png`,bytes)
writeFileSync(`${root}/preparation.json`,JSON.stringify({sourceRetained:true,sourceSha256:createHash('sha256').update(raw).digest('hex'),outputSha256:createHash('sha256').update(bytes).digest('hex'),repair:{baseFrame:1,targetFrame:2,emptyWoodSourceFrame:2,region:[176,375,329,440],receiptPolygon:paper,sourceOffset:[9,0]},removedPixels:b,productionAdmitted:false,limitations:['Third-frame empty wood patch requires seam review','Candidate texture style is flatter than B character detail']},null,2)+'\n')
