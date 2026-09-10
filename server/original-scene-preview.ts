import {readFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {originalTrainObstacles,originalTrainRoom} from '../src/original-train-spatial-plan'
const candidate=new URL('../doc/original-train-candidates/20260911/north-cape-v2.png',import.meta.url)
export function originalScenePreviewDefinition(){const data=readFileSync(candidate);return {sceneId:originalTrainRoom('dead-station'),background:'./art/original-north-cape.png',sha256:createHash('sha256').update(data).digest('hex')}}
export function originalScenePreviewPlugin(){return {name:'original-scene-preview-assets',generateBundle(this:any){
 const sceneId=originalTrainRoom('dead-station')
 const objects=originalTrainObstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('')
 const map=`<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="18" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="carriage.tsx"/><layer id="1" name="floor" width="12" height="18"><data encoding="csv">${Array(216).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`
 this.emitFile({type:'asset',fileName:'map/'+sceneId+'.tmx',source:map})
 this.emitFile({type:'asset',fileName:'art/original-north-cape.png',source:readFileSync(candidate)})
}}}
