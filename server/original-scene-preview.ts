import {Resvg} from '@resvg/resvg-js'
import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {originalTrainObstaclesFor,originalTrainRoom,originalTrainSpatialPlan,originalTrainChapterSpatialPlan} from '../src/original-train-spatial-plan'
import type {SceneResourceManifest} from '../src/scene-readiness'
import {originalBackgroundReleases,ORIGINAL_BACKGROUND_BASELINE,ORIGINAL_BACKGROUND_PLATFORM} from '../src/original-asset-releases'
const candidates=[{location:'dead-station',file:'north-cape-v2.png',asset:'original-north-cape'},{location:'river-valley',file:'river-valley-v1.png',asset:'original-river-valley'}]
export function originalReleasedBackgroundBytes(){
 return [[ORIGINAL_BACKGROUND_BASELINE,'../doc/original-train-candidates/20260911/north-cape-v2.png'],[ORIGINAL_BACKGROUND_PLATFORM,'../doc/platform-art-candidates/20260911/environment-edit-02/candidate.png']].map(([id,file])=>{
  const release=originalBackgroundReleases[id],data=readFileSync(new URL(file,import.meta.url))
  if(data.byteLength!==release.bytes||createHash('sha256').update(data).digest('hex')!==release.sha256||data.readUInt32BE(16)!==release.width||data.readUInt32BE(20)!==release.height)throw Error('ORIGINAL_RELEASE_BYTES_CHANGED:'+id)
  return {release,data}
 })
}
function platformBackground(){const data=readFileSync(new URL('../doc/platform-art-candidates/20260911/environment-edit-01/candidate.png',import.meta.url));return {kind:'background' as const,path:'./art/platform-north-cape-candidate.png',data,width:data.readUInt32BE(16),height:data.readUInt32BE(20)}}
function previewAssets(authoring=false){const all=authoring?originalTrainChapterSpatialPlan().scenes.map(room=>candidates.find(c=>originalTrainRoom(c.location)===room.id)??{location:room.id.slice('train-at-'.length),file:'',asset:room.id+'-whitebox'}):candidates;return all.map(c=>{
 const sceneId=originalTrainRoom(c.location),data=c.file?readFileSync(new URL('../doc/original-train-candidates/20260911/'+c.file,import.meta.url)):new Resvg(`<svg xmlns="http://www.w3.org/2000/svg" width="384" height="576"><rect width="384" height="576" fill="#33434a"/>${originalTrainObstaclesFor(sceneId).map(o=>`<rect x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}" fill="#18252d" stroke="#718087"/>`).join('')}</svg>`).render().asPng()
 const objects=originalTrainObstaclesFor(sceneId).map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 const map=Buffer.from(`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="18" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="carriage.tsx"/><layer id="1" name="floor" width="12" height="18"><data encoding="csv">${Array(216).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
 return {sceneId,assets:[{kind:'map' as const,path:'./map/'+sceneId+'.tmx',data:map},{kind:'background' as const,path:'./art/'+c.asset+'.png',data,width:data.readUInt32BE(16),height:data.readUInt32BE(20)}]}
})}
export function originalScenePreviewDefinition(){
 const version=originalTrainSpatialPlan().mapVersion
 const resources:SceneResourceManifest={version,scenes:Object.fromEntries(previewAssets().map(s=>[s.sceneId,{version,assets:s.assets.map(({data,...asset})=>({...asset,bytes:data.byteLength,sha256:createHash('sha256').update(data).digest('hex')}))}]))}
 const initialScene=originalTrainRoom('dead-station'),{data,...asset}=platformBackground(),platformResources=structuredClone(resources)
 platformResources.scenes[initialScene].assets=platformResources.scenes[initialScene].assets.map(a=>a.kind==='background'?{...asset,bytes:data.byteLength,sha256:createHash('sha256').update(data).digest('hex')}:a)
 return {initialScene,resources,platformResources}
}
export function originalStoryPreviewDefinition(){const version=originalTrainChapterSpatialPlan().mapVersion;return {version,scenes:Object.fromEntries(previewAssets(true).map(s=>[s.sceneId,{version,assets:s.assets.map(({data,...a})=>({...a,bytes:data.byteLength,sha256:createHash('sha256').update(data).digest('hex')}))}]))}}
export function originalScenePreviewPlugin(authoring=false){return {name:'original-scene-preview-assets',generateBundle(this:any){for(const {release,data} of originalReleasedBackgroundBytes())if(release.source==='alteru-media')this.emitFile({type:'asset',fileName:release.path.slice(2),source:data});for(const s of previewAssets(authoring))for(const a of s.assets)this.emitFile({type:'asset',fileName:a.path.slice(2),source:a.data});const a=platformBackground();this.emitFile({type:'asset',fileName:a.path.slice(2),source:a.data})}}}
