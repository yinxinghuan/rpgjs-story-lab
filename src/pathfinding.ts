import type {SceneId} from './scene-layout'
import {walkable,type Position} from './contract'
const step=4
const key=(p:Position)=>`${p.x},${p.y}`
export function findPath(start:Position,destination:Position,scene:SceneId='carriage'):Position[]{
 const goal={x:Math.round(destination.x/step)*step,y:Math.round(destination.y/step)*step}
 if(!walkable(goal,scene))return []
 let origin={x:Math.round(start.x/step)*step,y:Math.round(start.y/step)*step}
 if(!walkable(origin,scene)){const candidates=[{x:origin.x-4,y:origin.y},{x:origin.x+4,y:origin.y},{x:origin.x,y:origin.y-4},{x:origin.x,y:origin.y+4}].filter(p=>walkable(p,scene));if(!candidates.length)return [];origin=candidates[0]}
 const queue=[origin],seen=new Map<string,Position|null>([[key(origin),null]])
 for(let i=0;i<queue.length&&i<15000;i++){
  const p=queue[i]
  if(p.x===goal.x&&p.y===goal.y){const result:Position[]=[];let cur:Position|null=p;while(cur){result.unshift(cur);cur=seen.get(key(cur))??null}return result}
  for(const d of [{x:step,y:0},{x:-step,y:0},{x:0,y:step},{x:0,y:-step}]){const n={x:p.x+d.x,y:p.y+d.y};if(walkable(n,scene)&&!seen.has(key(n))){seen.set(key(n),p);queue.push(n)}}
 }
 return []
}
