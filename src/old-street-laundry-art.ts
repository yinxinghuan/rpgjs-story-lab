import laundryActorUrl from '../doc/oldstreet-laundry-redesign/pose-preserving/actor-atlas.png'
export {laundryActorUrl}
type Facing='up'|'down'|'left'|'right'
const row={down:0,left:1,right:2,up:3}
/** User-accepted platform character; source pixels retained after matte/foot preparation. */
export function laundryActorSheet(image:string){
 const frame=(x:number,y:number)=>({frameX:x,frameY:y,time:0,anchor:[.5,328/352],scale:[.22,.22],x:16,y:28})
 return {id:'oldstreet-lan',image,width:960,height:1408,framesWidth:3,framesHeight:4,textures:{
  stand:{animations:({direction}:{direction:Facing})=>[[frame(1,row[direction])]]},
  ...Object.fromEntries([0,1,2].map(i=>['stride-'+i,{animations:({direction}:{direction:Facing})=>[[frame(i,row[direction])]]}]))
 }}
}
