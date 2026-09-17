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
 {name:'a-recessed-masonry-wide',anchors:[{x:222,y:434},{x:160,y:434}],seeds:[{x:535,y:250}]},
 {name:'b-roller-shutter-wide',anchors:[{x:213,y:424},{x:163,y:424}],seeds:[{x:530,y:270}]},
 {name:'c-covered-vestibule-wide',anchors:[{x:201,y:456},{x:176,y:455}],seeds:[{x:550,y:260}]},
 {name:'b-roller-shutter-side',anchors:[{x:192,y:480},{x:192,y:480}],seeds:[]},
 {name:'c-covered-vestibule-side',anchors:[{x:192,y:480},{x:192,y:480}],seeds:[]},
]
mkdirSync(root+'/prepared',{recursive:true})
for(const v of variants){
 const file=root+'/'+v.name+'/candidate.png',bytes=readFileSync(file),state=JSON.parse(readFileSync(root+'/'+v.name+'/state.json','utf8'));assert.equal(hash(bytes),state.asset.sha256)
 const p=PNG.sync.read(bytes),rgba=new Uint8ClampedArray(p.data)
 // This batch's reviewed matte varies from saturated magenta to muted violet.
 // Normalise that chroma only before the shared connected-matte routine.
 for(let i=0;i<rgba.length;i+=4){const[r,g,b]=rgba.slice(i,i+3);if(r>50&&b>50&&r-g>35&&b-g>35){rgba[i]=255;rgba[i+1]=0;rgba[i+2]=255;rgba[i+3]=0}}
 const spec={columns:2,rows:1,cellWidth:384,cellHeight:512,foot:{x:192,y:v.name.endsWith('-wide')?450:480},kind:'states' as const,backgroundMode:'magenta' as const,neutralMin:240,chromaMax:12,sourceAnchors:v.anchors,matteSeeds:v.seeds}
 const prepared=prepareSpritePixels({width:p.width,height:p.height,rgba},spec)
 const out=PNG.sync.write({width:prepared.raster.width,height:prepared.raster.height,data:Buffer.from(prepared.raster.rgba)})
 writeFileSync(root+'/prepared/'+v.name+'.png',out)
 writeFileSync(root+'/prepared/'+v.name+'.json',JSON.stringify({source:file,sourceSha256:hash(bytes),sha256:hash(out),spec,metrics:prepared.metrics,admission:'comparison-only',operations:['reviewed magenta/violet matte normalization','connected matte removal','translation for paired threshold anchors; no rescaling']},null,2)+'\n')
 console.log(v.name,hash(out))
}
