/** Reviewed platform entrance sheets. Preserve sources; deterministic matte removal only. */
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs'
import {createRequire} from 'node:module'
import {dirname,join} from 'node:path'
import {createHash} from 'node:crypto'
import assert from 'node:assert/strict'
import {prepareSpritePixels} from '../src/sprite-preparation'
const require=createRequire(import.meta.url),{PNG}=require(join(dirname(require.resolve('playwright-core/package.json')),'lib/utilsBundle.js'))
const root='doc/entrance-art-20260917',hash=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex')
const names=process.argv.slice(2)
for(const name of names.length?names:['wood-front-overhead','side-passage-final','passage-ground']){
 const folder=join(root,name),bytes=readFileSync(join(folder,'candidate.png')),state=JSON.parse(readFileSync(join(folder,'state.json'),'utf8'))
 assert.equal(hash(bytes),state.asset.sha256)
 const png=PNG.sync.read(bytes),rgba=new Uint8ClampedArray(png.data)
 // The ground sheet has a pale separator and outer stroke: discard only the
 // reviewed empty cell margin. No drawing or architectural pixels are replaced.
 if(name==='passage-ground')for(let y=0;y<png.height;y++)for(let x=0;x<png.width;x++)if(x%384<8||x%384>=376||y<8||y>=504){const p=(y*png.width+x)*4;rgba[p]=255;rgba[p+1]=0;rgba[p+2]=255;rgba[p+3]=255}
 const front=name==='wood-front-overhead'
 const spec={columns:2,rows:1,cellWidth:384,cellHeight:512,foot:{x:192,y:480},kind:'states' as const,backgroundMode:'magenta' as const,neutralMin:240,chromaMax:12,sourceAnchors:front?[{x:194,y:455},{x:188,y:455}]:[{x:192,y:480},{x:192,y:480}],matteSeeds:front?[{x:590,y:230},{x:477,y:250},{x:478,y:187},{x:476,y:356}]:[]}
 const result=prepareSpritePixels({width:png.width,height:png.height,rgba},spec)
 const output=PNG.sync.write({width:result.raster.width,height:result.raster.height,data:Buffer.from(result.raster.rgba)})
 mkdirSync(join(root,'prepared'),{recursive:true})
 writeFileSync(join(root,'prepared',name+'.png'),output)
 writeFileSync(join(root,'prepared',name+'.json'),JSON.stringify({source:name+'/candidate.png',sourceSha256:state.asset.sha256,sha256:hash(output),spec,frames:result.frames,metrics:result.metrics,operations:['reviewed empty-margin removal where present','connected magenta removal and edge unmix','translation only for shared front-door foot anchor']},null,2)+'\n')
 console.log(name,hash(output),JSON.stringify(result.metrics))
}
