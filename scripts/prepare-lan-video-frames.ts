/** Authorized, source-preserving frame preparation; never admits art to runtime. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url)
const {PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/oldstreet-lan-video-walk/cdn-retry'
const hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
const video=readFileSync(root+'/candidate.mp4')
if(hash(video)!=='3765eecc9d16f07b50d9257a8b7c2d2da0c1cd28c44978abfa1c6b73d00a25be')throw Error('VIDEO_CHANGED')
mkdirSync(root+'/prepared',{recursive:true})
const spec={columns:1,rows:1,cellWidth:256,cellHeight:352,foot:{x:128,y:328},kind:'actor' as const,backgroundMode:'magenta' as const,neutralMin:200,chromaMax:20}
const frames=[]
for(let index=1;index<=20;index++){
 const id=String(index).padStart(2,'0'),bytes=readFileSync(root+'/frames-roi/'+id+'.png'),source=PNG.sync.read(bytes)
 if(source.width!==288||source.height!==512)throw Error('ROI_CHANGED')
 // Reviewed outer matte only: remove the video encoder's dark edge, not the actor.
 const crop={x:3,y:3,width:282,height:506},rgba=new Uint8ClampedArray(crop.width*crop.height*4)
 for(let y=0;y<crop.height;y++)rgba.set(source.data.subarray(((y+crop.y)*288+crop.x)*4,((y+crop.y)*288+crop.x+crop.width)*4),y*crop.width*4)
 const result=prepareSpritePixels({width:crop.width,height:crop.height,rgba},spec)
 const output=PNG.sync.write({width:256,height:352,data:Buffer.from(result.raster.rgba)})
 writeFileSync(root+'/prepared/'+id+'.png',output)
 frames.push({id,inputSha256:hash(bytes),outputSha256:hash(output),crop,alignment:result.frames[0],metrics:result.metrics})
}
writeFileSync(root+'/preparation.json',JSON.stringify({sourceRetained:true,sourceSha256:hash(video),extraction:'ffmpeg crop=288:512:0:0,fps=4; 20 frames',spec,algorithm:'magenta-matte-unmix-1',redraw:false,resize:false,walkingAdmitted:false,productionAdmitted:false,frames},null,2)+'\n')
console.log(JSON.stringify({prepared:frames.length,admitted:false}))
