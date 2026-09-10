import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {originalTrainObstaclesFor,originalTrainRoom,originalTrainSpatialPlan} from '../src/original-train-spatial-plan'
import type {SceneResourceManifest} from '../src/scene-readiness'
const candidates=[{location:'dead-station',file:'north-cape-v2.png',asset:'original-north-cape'},{location:'river-valley',file:'river-valley-v1.png',asset:'original-river-valley'}]
function previewAssets(){return candidates.map(c=>{
 const sceneId=originalTrainRoom(c.location),data=readFileSync(new URL('../doc/original-train-candidates/20260911/'+c.file,import.meta.url))
 const objects=originalTrainObstaclesFor(sceneId).map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 const map=Buffer.from(`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="18" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="carriage.tsx"/><layer id="1" name="floor" width="12" height="18"><data encoding="csv">${Array(216).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
 return {sceneId,assets:[{kind:'map' as const,path:'./map/'+sceneId+'.tmx',data:map},{kind:'background' as const,path:'./art/'+c.asset+'.png',data,width:data.readUInt32BE(16),height:data.readUInt32BE(20)}]}
})}
export function originalScenePreviewDefinition(){
 const version=originalTrainSpatialPlan().mapVersion
 const resources:SceneResourceManifest={version,scenes:Object.fromEntries(previewAssets().map(s=>[s.sceneId,{version,assets:s.assets.map(({data,...asset})=>({...asset,bytes:data.byteLength,sha256:createHash('sha256').update(data).digest('hex')}))}]))}
 return {initialScene:originalTrainRoom('dead-station'),resources}
}
export function originalScenePreviewPlugin(){return {name:'original-scene-preview-assets',generateBundle(this:any){for(const s of previewAssets())for(const a of s.assets)this.emitFile({type:'asset',fileName:a.path.slice(2),source:a.data})}}}
