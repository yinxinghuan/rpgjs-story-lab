/** User-authorized offline cutout of reviewed candidate. Original retained. */
import {readFileSync,writeFileSync,existsSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-xu-candidate',raw=readFileSync(`${root}/correction/candidate.png`)
if(createHash('sha256').update(raw).digest('hex')!=='d951095683154f9b52c6896ad92addb29a82314f9adead7e17f162bc273ecbdb')throw Error('SOURCE_CHANGED')
const p=PNG.sync.read(raw),w=p.width,h=p.height,n=w*h,mask=new Uint8Array(n),queue=new Int32Array(n);let head=0,tail=0
const matte=i=>{i*=4;return Math.min(p.data[i],p.data[i+2])>70&&Math.min(p.data[i],p.data[i+2])-p.data[i+1]>65}
const visit=i=>{if(!mask[i]&&matte(i)){mask[i]=1;queue[tail++]=i}}
for(let x=0;x<w;x++){visit(x);visit((h-1)*w+x)}for(let y=0;y<h;y++){visit(y*w);visit(y*w+w-1)}
while(head<tail){const i=queue[head++],x=i%w;if(x)visit(i-1);if(x<w-1)visit(i+1);if(i>=w)visit(i-w);if(i+w<n)visit(i+w)}
if(tail<n*.35)throw Error('MATTE_NOT_FOUND')
for(let i=0;i<n;i++)if(mask[i])p.data.fill(0,i*4,i*4+4)
const out=new PNG({width:1024,height:352}),frames=[]
for(let frame=0;frame<4;frame++){
 const row=[0,2,2,3][frame],mirrored=frame===1
 let l=683,t=(row+1)*352,r=341,b=row*352
 for(let y=row*352;y<(row+1)*352;y++)for(let x=341;x<683;x++)if(p.data[(y*w+x)*4+3]){l=Math.min(l,x);r=Math.max(r,x+1);t=Math.min(t,y);b=Math.max(b,y+1)}
 if(l<=341||r>=683||t<=row*352||b>=(row+1)*352||r-l>252)throw Error('CLIPPED_FRAME')
 const dx=128-Math.round((l+r)/2),dy=328-b
 for(let y=t;y<b;y++)for(let x=l;x<r;x++)p.data.copy(out.data,((y+dy)*1024+frame*256+(mirrored?255-(x+dx):x+dx))*4,(y*w+x)*4,(y*w+x)*4+4)
 frames.push({direction:['down','left','right','up'][frame],mirrored,sourceBox:[l,t,r,b],offset:[dx,dy],foot:[128,328]})
}
const bytes=PNG.sync.write(out),path=`${root}/standing.png`
if(existsSync(path)&&!readFileSync(path).equals(bytes))throw Error('OUTPUT_CHANGED')
writeFileSync(path,bytes)
writeFileSync(`${root}/preparation.json`,JSON.stringify({algorithm:'reviewed-magenta-connected-matte-no-scale-1',sourceRetained:true,removed:tail,frames,width:1024,height:352,sha256:createHash('sha256').update(bytes).digest('hex'),productionAdmitted:false,limitations:['West idle is a mirror of east idle; no independent west pose','Walking frames contain wrong directions; excluded','Hairstyle consistency remains candidate quality','No generative repair performed by cutout']},null,2)+'\n')
console.log(JSON.stringify({path,frames}))
