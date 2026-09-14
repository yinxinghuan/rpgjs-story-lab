/** Offline preparation of explicitly reviewed magenta-matte candidates only.
 * Never modifies source files or production bindings. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/companion-motion-20260915/ada-front-candidates'
const baseline=PNG.sync.read(readFileSync('public/art/ada-standing-v1.png'))
const bounds=p=>{let l=p.width,t=p.height,r=0,b=0;for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++)if(p.data[(y*p.width+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1)}return {l,t,r,b}}
const baseBox=bounds(baseline),report=[]
const frames=[]
for(const name of ['ada-front-contact','ada-front-opposite-arms']){
 const raw=readFileSync(`${root}/${name}.png`),p=PNG.sync.read(raw),{width:w,height:h}=p,n=w*h,mask=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0
 const matte=i=>{i*=4;return Math.min(p.data[i],p.data[i+2])>70&&Math.min(p.data[i],p.data[i+2])-p.data[i+1]>65}
 const visit=i=>{if(!mask[i]&&matte(i)){mask[i]=1;queue[tail++]=i}}
 for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1)}
 while(head<tail){const i=queue[head++],x=i%w;if(x)visit(i-1);if(x<w-1)visit(i+1);if(i>=w)visit(i-w);if(i+w<n)visit(i+w)}
 if(tail<n*.35)throw Error('Expected reviewed magenta matte not found')
 for(let i=0;i<n;i++)if(mask[i])p.data.fill(0,i*4,i*4+4)
 const box=bounds(p);if(box.l===0||box.t===0||box.r===w||box.b===h)throw Error('Clipped silhouette')
 writeFileSync(`${root}/${name}-cutout.png`,PNG.sync.write(p))
 const scale=(baseBox.b-baseBox.t)/(box.b-box.t),out=new PNG({width:320,height:320}),center=(box.l+box.r)/2
 for(let y=0;y<320;y++)for(let x=0;x<320;x++){
  const sx=Math.floor((x-160)/scale+center),sy=Math.floor((y-300)/scale+box.b)
  if(sx>=0&&sx<w&&sy>=0&&sy<h)p.data.copy(out.data,(y*320+x)*4,(sy*w+sx)*4,(sy*w+sx)*4+4)
 }
 writeFileSync(`${root}/${name}-frame.png`,PNG.sync.write(out));frames.push(out)
 report.push({name,sourceSha256:createHash('sha256').update(raw).digest('hex'),removed:tail,sourceBounds:box,scale,outputBounds:bounds(out)})
}
// Contact / neutral / opposite / neutral, kept separate from runtime admission.
const atlas=new PNG({width:1280,height:320})
for(const [col,frame] of [frames[0],baseline,frames[1],baseline].entries())for(let y=0;y<320;y++)frame.data.copy(atlas.data,(y*1280+col*320)*4,y*320*4,(y+1)*320*4)
writeFileSync(`${root}/front-cycle.png`,PNG.sync.write(atlas))
writeFileSync(`${root}/preparation.json`,JSON.stringify({algorithm:'reviewed-magenta-connected-matte-nearest-1',baselineBounds:baseBox,foot:{x:160,y:300},frames:report,runtimeAdmitted:false,limits:['Binary edge removal requires visual review on light and dark backgrounds','Height normalization is provisional; torso and head alignment require playback review','No direction or stride inferred from filenames; inspect actual poses']},null,2)+'\n')
console.log(JSON.stringify(report))
