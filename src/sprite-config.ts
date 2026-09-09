import { Direction } from '@rpgjs/common'
import { isBalancedArt,overheadAsset } from './art-variant'
import {actorArt} from './art-catalog'
// Pixel crop/anchor metadata is renderer configuration; original generated PNGs are unchanged.
const rowFor=(direction:Direction)=>({down:0,left:1,right:2,up:3}[direction])
export function actorSheet(id:string,image:string,width:number,height:number,baselines:number[][],scale=.14,centers:number[][]=[[195,181,167],[195,181,167],[195,181,167],[195,181,167]]){
 const frameW=width/3,frameH=height/4
 const frame=(row:number,col:number,time:number)=>({frameX:col,frameY:row,time,anchor:[centers[row][col]/frameW,baselines[row][col]/frameH],scale:[scale,scale],x:4.5,y:15})
 const pose=(column:number)=>({animations:({direction}:{direction:Direction})=>[[frame(rowFor(direction),column,0)]]})
 return {id,image,width,height,framesWidth:3,framesHeight:4,textures:{
  stand:pose(1),
  'stride-0':pose(0),'stride-1':pose(1),'stride-2':pose(2),
  walk:{animations:({direction}:{direction:Direction})=>[[frame(rowFor(direction),0,0),frame(rowFor(direction),1,10),frame(rowFor(direction),2,20),{time:30}]]}
 }}
}
const actor=(id:'hero'|'mechanic'|'attendant')=>{const a=actorArt[isBalancedArt?'balanced':'baseline'][id];return actorSheet(id,isBalancedArt?overheadAsset(id):a.path,a.width,a.height,a.baselines,a.scale,a.centers)}
export const heroSheet=actor('hero')
export const mechanicSheet=actor('mechanic')
export const attendantSheet=actor('attendant')
