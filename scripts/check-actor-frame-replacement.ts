import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {prepareSpritePixels,type PixelRaster} from '../src/sprite-preparation'
import {replaceActorFrame} from '../src/sprite-composition'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const base='doc/platform-art-candidates/20260912/hero-reproduce-01/candidate.png',patch='doc/platform-art-candidates/20260912/hero-left-opposite-04/candidate.png'
const decode=(path:string):PixelRaster=>{const p=PNG.sync.read(readFileSync(path));return {width:p.width,height:p.height,rgba:new Uint8ClampedArray(p.data)}}
const common={cellWidth:320,cellHeight:320,foot:{x:160,y:300},kind:'actor' as const,backgroundMode:'pale-neutral' as const,neutralMin:240,chromaMax:12}
const original=prepareSpritePixels(decode(base),{...common,columns:3,rows:4}),replacement=prepareSpritePixels(decode(patch),{...common,columns:1,rows:1})
const result=replaceActorFrame(original.raster,replacement.raster,1,2)
let changedTarget=0,changedOutside=0
for(let y=0;y<result.height;y++)for(let x=0;x<result.width;x++)for(let c=0;c<4;c++){
 const offset=(y*result.width+x)*4+c
 if(result.rgba[offset]!==original.raster.rgba[offset]){if(y>=320&&y<640&&x>=640)changedTarget++;else changedOutside++}
}
assert.equal(changedOutside,0);assert.ok(changedTarget>0)
const out='_qa/actor-frame-replacement';mkdirSync(out,{recursive:true})
writeFileSync(out+'/candidate.png',PNG.sync.write({width:result.width,height:result.height,data:Buffer.from(result.rgba)}))
const hash=(path:string)=>createHash('sha256').update(readFileSync(path)).digest('hex')
const report={base,baseSha256:hash(base),patch,patchSha256:hash(patch),outputSha256:hash(out+'/candidate.png'),cell:{row:1,column:2},changedOutside,changedTarget,sourceBoxes:{base:original.frames[5].sourceBox,patch:replacement.frames[0].sourceBox},anchors:{base:original.frames[5].sourceAnchor,patch:replacement.frames[0].sourceAnchor,target:common.foot},runtimeAdmission:false,limits:['Only deterministic matte preparation, translation and cell replacement verified','No rescaling, mirroring or repainting','Input pose remains rejected for anatomy/scale; composition is not approval','No creator archive or runtime binding changed']}
writeFileSync(out+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report))
