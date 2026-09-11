import {originalTrainObstaclesFor} from './original-train-spatial-plan'
import type {SceneResource} from './scene-readiness'
export const GRAYSTONE_BACKGROUND='graystone-yard-platform-78f22e9b'
// This sheet retained a 12–14 world-unit roof overhang. Reserve that silhouette
// only for journeys bound to this image, without changing legacy whitebox maps.
export const originalEnvironmentLayouts:Record<string,{scene:string;obstacles:Array<{x:number;y:number;w:number;h:number}>;map:SceneResource}>={
 [GRAYSTONE_BACKGROUND]:{scene:'train-at-graystone-yard',obstacles:[...originalTrainObstaclesFor('train-at-graystone-yard'),{x:60,y:246,w:14,h:14},{x:60,y:394,w:14,h:4}],map:{kind:'map',path:'./map/graystone-yard-78f22e9b.tmx',sha256:'9b40680fa3a59445354e3246771f85f139c3124e5780a1e16e5f93c05defdbdc',bytes:1893}},
}
export function originalEnvironmentMapXml(id:string){const layout=originalEnvironmentLayouts[id];if(!layout)throw Error('ORIGINAL_ENVIRONMENT_LAYOUT_UNKNOWN');const objects=layout.obstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('');return `<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="18" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="carriage.tsx"/><layer id="1" name="floor" width="12" height="18"><data encoding="csv">${Array(216).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`}
export function originalEnvironmentWalkable(id:string|undefined,scene:string,p:{x:number;y:number}){const layout=id?originalEnvironmentLayouts[id]:undefined;if(!layout)return true;if(layout.scene!==scene)return false;return !layout.obstacles.some(o=>p.x+9>o.x&&p.x<o.x+o.w&&p.y+15>o.y&&p.y<o.y+o.h)}
