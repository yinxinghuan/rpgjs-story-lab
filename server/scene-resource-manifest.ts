import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import type {SceneResourceManifest,SceneResource} from '../src/scene-readiness'
import {sceneIds,scenes,sceneObstacles} from '../src/scene-layout'
const hash=(bytes:Uint8Array|string)=>createHash('sha256').update(bytes).digest('hex')
/** Build-time admission from the actual world, never a model-supplied inventory. */
export function sceneResourceManifest(root=process.cwd()):SceneResourceManifest{
 const entries=Object.fromEntries(sceneIds.map(id=>{
  const background=scenes[id].background,map=`./map/${id}.tmx`
  const png=readFileSync(root+'/public/'+background.slice(2)),xml=readFileSync(root+'/public/'+map.slice(2))
  if(png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a')throw Error('SCENE_BACKGROUND_NOT_PNG:'+id)
  const width=png.readUInt32BE(16),height=png.readUInt32BE(20)
  if(!width||!height||Math.abs(width/height-2/3)>.001)throw Error('SCENE_BACKGROUND_ASPECT:'+id)
  const text=xml.toString(),rects=[...text.matchAll(/<object id="\d+" x="([\d.-]+)" y="([\d.-]+)" width="([\d.-]+)" height="([\d.-]+)"/g)].map(m=>({x:+m[1],y:+m[2],w:+m[3],h:+m[4]}))
  if(!text.includes('orientation="orthogonal"')||!text.includes('width="12" height="18" tilewidth="32" tileheight="32"')||[...text.matchAll(/<property name="collision" type="bool" value="true"/g)].length!==rects.length||JSON.stringify(rects)!==JSON.stringify(sceneObstacles(id).map(({x,y,w,h})=>({x,y,w,h}))))throw Error('SCENE_COLLISION_SOURCE_MISMATCH:'+id)
  const assets:SceneResource[]=[{path:background,kind:'background',sha256:hash(png),bytes:png.length,width,height},{path:map,kind:'map',sha256:hash(xml),bytes:xml.length}]
  return [id,{version:hash(JSON.stringify({layout:scenes[id],assets})),assets}]
 }))
 return {version:hash(JSON.stringify(entries)),scenes:entries}
}
