import {originalTrainObstaclesFor} from './original-train-spatial-plan'
import type {SceneResource} from './scene-readiness'
export const GRAYSTONE_BACKGROUND='graystone-yard-platform-78f22e9b'
export const PINE_BACKGROUND='pine-line-platform-90af55e7'
export const TOWN_BACKGROUND='sleeping-town-platform-f9922760'
export const TUNNEL_BACKGROUND='tunnel-platform-b084000a'
// Reserve measured roof and foliage silhouettes only for journeys bound to
// each reviewed image. Legacy whitebox maps retain their original geometry.
export const originalEnvironmentLayouts:Record<string,{scene:string;obstacles:Array<{x:number;y:number;w:number;h:number}>;map:SceneResource}>={
 [GRAYSTONE_BACKGROUND]:{scene:'train-at-graystone-yard',obstacles:[...originalTrainObstaclesFor('train-at-graystone-yard'),{x:60,y:246,w:14,h:14},{x:60,y:394,w:14,h:4}],map:{kind:'map',path:'./map/graystone-yard-78f22e9b.tmx',sha256:'9b40680fa3a59445354e3246771f85f139c3124e5780a1e16e5f93c05defdbdc',bytes:1893}},
 [PINE_BACKGROUND]:{scene:'train-at-pine-line',obstacles:[...originalTrainObstaclesFor('train-at-pine-line'),{"x":60,"y":16,"w":32,"h":30},{"x":294,"y":16,"w":42,"h":20},{"x":318,"y":36,"w":18,"h":200},{"x":318,"y":338,"w":18,"h":222},{"x":60,"y":516,"w":14,"h":44},{"x":60,"y":250,"w":14,"h":10},{"x":60,"y":394,"w":14,"h":12},{"x":146,"y":248,"w":90,"h":4}],map:{kind:'map',path:'./map/pine-line-90af55e7.tmx',sha256:'ce021febc59e0076a35c63ea3be728a45f9870a0028ad095fee167c733f6a98d',bytes:2741}},
 [TOWN_BACKGROUND]:{scene:'train-at-sleeping-town',obstacles:[...originalTrainObstaclesFor('train-at-sleeping-town'),{"x":60,"y":244,"w":14,"h":16},{"x":60,"y":394,"w":14,"h":12}],map:{kind:'map',path:'./map/sleeping-town-f9922760.tmx',sha256:'f96630477170d3aaf32ccf23c6714f5fe5197cb8a186f00718f40fb62a2e7d46',bytes:1894}},
 [TUNNEL_BACKGROUND]:{scene:'train-at-tunnel',obstacles:[...originalTrainObstaclesFor('train-at-tunnel'),{"x":60,"y":248,"w":14,"h":12},{"x":60,"y":394,"w":14,"h":4}],map:{kind:'map',path:'./map/tunnel-b084000a.tmx',sha256:'c7fed701ad0cf363b7b2f60c8bf8fe9e2b5f6b5b120c285389cd5a4e8906a4b5',bytes:1893}},
}
export function originalEnvironmentMapXml(id:string){const layout=originalEnvironmentLayouts[id];if(!layout)throw Error('ORIGINAL_ENVIRONMENT_LAYOUT_UNKNOWN');const objects=layout.obstacles.map((o,i)=>`<object id="${i+1}" x="${o.x}" y="${o.y}" width="${o.w}" height="${o.h}"><properties><property name="collision" type="bool" value="true"/></properties></object>`).join('');return `<?xml version="1.0"?><map version="1.10" orientation="orthogonal" renderorder="right-down" width="12" height="18" tilewidth="32" tileheight="32" infinite="0"><tileset firstgid="1" source="carriage.tsx"/><layer id="1" name="floor" width="12" height="18"><data encoding="csv">${Array(216).fill(1).join(',')}</data></layer><objectgroup id="2" name="collision">${objects}</objectgroup></map>`}
export function originalEnvironmentWalkable(id:string|undefined,scene:string,p:{x:number;y:number}){const layout=id?originalEnvironmentLayouts[id]:undefined;if(!layout)return true;if(layout.scene!==scene)return false;return !layout.obstacles.some(o=>p.x+9>o.x&&p.x<o.x+o.w&&p.y+15>o.y&&p.y<o.y+o.h)}
