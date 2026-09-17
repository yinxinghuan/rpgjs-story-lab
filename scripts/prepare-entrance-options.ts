/** Local authoring candidates only; no default admission. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/entrance-options-20260917',hash=(b:Uint8Array)=>createHash('sha256').update(b).digest('hex')
const variants=[
 {name:'c-open-90',anchors:[{x:202,y:437},{x:182,y:437}],seeds:[],downsample:2,alphaFloor:8},
 {name:'c-inset-swing',anchors:[{x:202,y:437},{x:182,y:437}],seeds:[],downsample:2,alphaFloor:8},
 {name:'c-parallel-reference',anchors:[{x:202,y:437},{x:178,y:437}],seeds:[{x:548,y:264}],downsample:2},
 {name:'c-simple-frame',anchors:[{x:201,y:456},{x:176,y:455}],seeds:[{x:550,y:260}]},
 {name:'a-recessed-masonry-wide',anchors:[{x:222,y:434},{x:160,y:434}],seeds:[{x:535,y:250}]},
 {name:'b-roller-shutter-wide',anchors:[{x:213,y:424},{x:163,y:424}],seeds:[{x:530,y:270}]},
 {name:'c-covered-vestibule-wide',anchors:[{x:201,y:456},{x:176,y:455}],seeds:[{x:550,y:260}]},
 {name:'b-roller-shutter-side',anchors:[{x:192,y:480},{x:192,y:480}],seeds:[]},
 {name:'c-covered-vestibule-side',anchors:[{x:192,y:480},{x:192,y:480}],seeds:[]},
]
mkdirSync(root+'/prepared',{recursive:true})
for(const v of variants.filter(v=>!process.argv[2]||v.name===process.argv[2])){
 const file=root+'/'+v.name+'/candidate.png',bytes=readFileSync(file),state=JSON.parse(readFileSync(root+'/'+v.name+'/state.json','utf8'));assert.equal(hash(bytes),state.asset.sha256)
 const source=PNG.sync.read(bytes),factor=('downsample' in v?v.downsample:1)??1
 assert.equal(source.width,768*factor);assert.equal(source.height,512*factor)
 const p={width:source.width/factor,height:source.height/factor},rgba=new Uint8ClampedArray(p.width*p.height*4)
 for(let y=0;y<p.height;y++)for(let x=0;x<p.width;x++){const si=(y*factor*source.width+x*factor)*4;rgba.set(source.data.subarray(si,si+4),(y*p.width+x)*4)}
 // Native-alpha candidate has <=8/255 stray pixels outside the frame; discard only that reviewed near-invisible fringe.
 if('alphaFloor' in v)for(let i=3;i<rgba.length;i+=4)if(rgba[i]<=v.alphaFloor!)rgba[i]=0
 // This batch's reviewed matte varies from saturated magenta to muted violet.
 // Normalise that chroma only before the shared connected-matte routine.
 for(let i=0;i<rgba.length;i+=4){const[r,g,b]=rgba.slice(i,i+3);if(r>50&&b>50&&r-g>35&&b-g>35){rgba[i]=255;rgba[i+1]=0;rgba[i+2]=255;rgba[i+3]=0}}
 const spec={columns:2,rows:1,cellWidth:384,cellHeight:512,foot:{x:192,y:v.name.endsWith('-side')?480:450},kind:'states' as const,backgroundMode:'magenta' as const,neutralMin:240,chromaMax:12,sourceAnchors:v.anchors,matteSeeds:v.seeds}
 const prepared=prepareSpritePixels({width:p.width,height:p.height,rgba},spec)
 const out=PNG.sync.write({width:prepared.raster.width,height:prepared.raster.height,data:Buffer.from(prepared.raster.rgba)})
 writeFileSync(root+'/prepared/'+v.name+'.png',out)
 writeFileSync(root+'/prepared/'+v.name+'.json',JSON.stringify({source:file,sourceSha256:hash(bytes),sha256:hash(out),spec,metrics:prepared.metrics,admission:'comparison-only',operations:[...('alphaFloor' in v?[`discard native alpha <=${v.alphaFloor}/255 stray fringe`]:[]), `nearest-neighbour ${factor}:1 source sampling`, 'reviewed magenta/violet matte normalization','connected matte removal','translation for paired threshold anchors; no rescaling']},null,2)+'\n')
 console.log(v.name,hash(out))
}
