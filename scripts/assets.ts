import { Resvg } from '@resvg/resvg-js'
import { writeFileSync } from 'node:fs'
import { sceneIds,sceneObstacles } from '../src/scene-layout'
// The original generated painting is rendered below the transparent RPG-JS map.
// TMX owns logical scale and matching collision objects; no raster resampling is needed.
writeFileSync('public/map/transparent.png',new Resvg('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"/>').render().asPng())
writeFileSync('public/map/carriage.tsx','<?xml version="1.0"?><tileset name="collision-floor" tilewidth="32" tileheight="32" tilecount="1" columns="1"><image source="transparent.png" width="32" height="32"/></tileset>')
for(const scene of sceneIds){
const objects=sceneObstacles(scene).map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
writeFileSync(`public/map/${scene}.tmx`,`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="18" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="carriage.tsx"/><layer id="1" name="floor" width="12" height="18"><data encoding="csv">${Array(216).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`)
}
console.log('Transparent logical map and image-aligned collision objects generated.')
