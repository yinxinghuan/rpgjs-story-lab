/** Authorized cutout and alignment only. Keeps all source images/videos unchanged. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-lan-video-walk',out=root+'/four-way'
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
const sources=[
 ['down','down','adf55282e8e4e8876da4636d0cb9c0fdcff3e754a7c04074d1dc78204fe95796'],
 ['left','cdn-retry','3765eecc9d16f07b50d9257a8b7c2d2da0c1cd28c44978abfa1c6b73d00a25be'],
 ['right','right-fixed-side','5ff58d8dba40d884cfecbea8067a0adea6468b96a54413eb9a40c8cb5e750931'],
 ['up','up-fixed-back','d617adce09ccaf373dabdd0a79658e793f747a02945abb224554639417ae19f9'],
]
const atlas=new PNG({width:2816,height:1408})
const standingBytes=readFileSync('doc/oldstreet-lan-candidate/standing.png'),standing=PNG.sync.read(standingBytes)
if(hash(standingBytes)!=='004dc0d9959da5cb124348ab5e7c503492849bf8c24a505ffbe10221320ee3d9')throw Error('STANDING_CHANGED')
mkdirSync(out,{recursive:true})
const frames=[]
for(const [row,[direction,folder,sha]] of sources.entries()){
 if(hash(readFileSync(`${root}/${folder}/candidate.mp4`))!==sha)throw Error('VIDEO_CHANGED:'+folder)
 for(let y=0;y<352;y++)standing.data.copy(atlas.data,((row*352+y)*atlas.width)*4,(y*1024+row*256)*4,(y*1024+row*256+256)*4)
 for(let i=0;i<10;i++){
  const id=String(i+3).padStart(2,'0'),input=`${root}/${folder}/frames-roi/${id}.png`,bytes=readFileSync(input),source=PNG.sync.read(bytes)
  if(source.width!==288||source.height!==512)throw Error('ROI_CHANGED')
  const rgba=new Uint8ClampedArray(282*506*4)
  for(let y=0;y<506;y++)rgba.set(source.data.subarray(((y+3)*288+3)*4,((y+3)*288+285)*4),y*282*4)
  const prepared=prepareSpritePixels({width:282,height:506,rgba},{columns:1,rows:1,cellWidth:256,cellHeight:352,foot:{x:128,y:328},kind:'actor',backgroundMode:'magenta',neutralMin:200,chromaMax:20})
  const data=Buffer.from(prepared.raster.rgba)
  for(let y=0;y<352;y++)data.copy(atlas.data,((row*352+y)*atlas.width+(i+1)*256)*4,y*256*4,(y+1)*256*4)
  frames.push({direction,source:input,sha256:hash(bytes),alignment:prepared.frames[0],metrics:prepared.metrics})
 }
}
const bytes=PNG.sync.write(atlas)
writeFileSync(out+'/trial-atlas.png',bytes)
writeFileSync(out+'/preparation.json',JSON.stringify({productionAdmitted:false,sourceRetained:true,resize:false,redraw:false,mirror:false,atlas:{width:2816,height:1408,columns:11,rows:4,sha256:hash(bytes)},sources,frames},null,2)+'\n')
console.log('Prepared four-direction local trial; not production admitted.')
