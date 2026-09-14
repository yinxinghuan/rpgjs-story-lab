import type {Direction} from '@rpgjs/common'
// Pure sheet construction: no window, URL parameters or global art selection.
const rowFor=(direction:Direction)=>({down:0,left:1,right:2,up:3}[direction])
export function actorSheet(id:string,image:string,width:number,height:number,baselines:number[][],scale=.14,centers:number[][]=[[195,181,167],[195,181,167],[195,181,167],[195,181,167]],foot={x:4.5,y:15}){
 const frameW=width/3,frameH=height/4
 const frame=(row:number,col:number,time:number)=>({frameX:col,frameY:row,time,anchor:[centers[row][col]/frameW,baselines[row][col]/frameH],scale:[scale,scale],x:foot.x,y:foot.y})
 const pose=(column:number)=>({animations:({direction}:{direction:Direction})=>[[frame(rowFor(direction),column,0)]]})
 return {id,image,width,height,framesWidth:3,framesHeight:4,textures:{stand:pose(1),'stride-0':pose(0),'stride-1':pose(1),'stride-2':pose(2),walk:{animations:({direction}:{direction:Direction})=>[[frame(rowFor(direction),0,0),frame(rowFor(direction),1,10),frame(rowFor(direction),2,20),{time:30}]]}}}
}

/** Four reviewed static directions in one row; never masquerades as a walk cycle. */
export function standingActorSheet(id:string,image:string,cellWidth:number,cellHeight:number,sourceFoot:{x:number;y:number},scale:number,foot:{x:number;y:number}){
 return {id,image,width:cellWidth*4,height:cellHeight,framesWidth:4,framesHeight:1,textures:{stand:{animations:({direction}:{direction:Direction})=>[[{frameX:rowFor(direction),frameY:0,time:0,anchor:[sourceFoot.x/cellWidth,sourceFoot.y/cellHeight],scale:[scale,scale],x:foot.x,y:foot.y}]]}}}
}
