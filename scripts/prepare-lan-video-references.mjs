import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const source='doc/oldstreet-lan-candidate/standing.png',bytes=readFileSync(source),hash=b=>createHash('sha256').update(b).digest('hex')
if(hash(bytes)!=='004dc0d9959da5cb124348ab5e7c503492849bf8c24a505ffbe10221320ee3d9')throw Error('SOURCE_CHANGED')
const original=PNG.sync.read(bytes)
for(const [direction,column] of [['down',0],['right',2],['up',3]]){
 const output=new PNG({width:288,height:512})
 for(let i=0;i<output.data.length;i+=4){output.data[i]=255;output.data[i+1]=0;output.data[i+2]=255;output.data[i+3]=255}
 for(let y=0;y<352;y++)for(let x=0;x<256;x++){
  const si=(y*1024+column*256+x)*4,di=((y+80)*288+x+16)*4,a=original.data[si+3]/255
  for(let c=0;c<3;c++)output.data[di+c]=Math.round(original.data[si+c]*a+output.data[di+c]*(1-a))
 }
 const path='doc/oldstreet-lan-video-walk/'+direction;mkdirSync(path,{recursive:true})
 const encoded=PNG.sync.write(output);writeFileSync(path+'/reference.png',encoded)
 writeFileSync(path+'/reference.json',JSON.stringify({source,sourceSha256:hash(bytes),sourceRetained:true,direction,sourceRect:{x:column*256,y:0,width:256,height:352},canvas:{width:288,height:512},offset:{x:16,y:80},resize:false,redraw:false,referenceSha256:hash(encoded),purpose:'experimental video keyframe, not a game asset'},null,2)+'\n')
}
