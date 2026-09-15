/** Authorized cutout/framing only; preserve platform originals, no painted repairs. */
import {readFileSync,writeFileSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-pixel-study'
const digest=b=>createHash('sha256').update(b).digest('hex')
function prepare(name,clip){
 const path=`${root}/${name}`,raw=readFileSync(`${path}/candidate.png`),p=PNG.sync.read(raw),state=JSON.parse(readFileSync(`${path}/state.json`,'utf8'))
 if(digest(raw)!==state.asset.sha256)throw Error('SOURCE_CHANGED')
 let removed=0
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){
  const i=(y*p.width+x)*4,[r,g,b]=p.data.subarray(i,i+3)
  if((clip&&(y<clip[0]||y>clip[1]))||(Math.min(r,b)>30&&Math.min(r,b)-g>25)){
   p.data.fill(0,i,i+4);removed++
  }
 }
 const out=PNG.sync.write(p);writeFileSync(`${path}/cutout.png`,out)
 writeFileSync(`${path}/preparation.json`,JSON.stringify({sourceSha256:digest(raw),outputSha256:digest(out),sourceRetained:true,clipY:clip??null,removedPixels:removed,operation:'magenta removal and optional furniture-only framing',productionAdmitted:false},null,2)+'\n')
}
prepare('drawer',[190,502])
prepare('props/orthogonal')
