import type {StorySave} from './vendor/original-train/types'
/** Fixed renderer event: both states restore opacity explicitly after recovery. */
export const oldStreetTrolleyPose=(save:Pick<StorySave,'facts'>)=>save.facts['trolley-borrowed']===true?'hidden':'stand'
export function oldStreetTrolleySheet(image:string){
 const pose=(opacity:number)=>({animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,580/640],scale:[.13,.13],x:16,y:28,opacity}]]})
 return {id:'oldstreet-trolley',image,width:512,height:640,framesWidth:1,framesHeight:1,textures:{stand:pose(1),hidden:pose(0)}}
}
export const oldStreetDrawerPose=(save:Pick<StorySave,'facts'>)=>save.facts['lens-taken']===true?'empty':save.facts['drawer-open']===true?'open':'closed'
export function oldStreetDrawerSheet(image:string){
 const pose=(frameX:number)=>({animations:()=>[[{frameX,frameY:0,time:0,anchor:[(frameX===0?243:252)/512,494/768],scale:[.16,.16],x:16,y:28}]]})
 return {id:'oldstreet-drawer',image,width:1536,height:768,framesWidth:3,framesHeight:1,textures:{closed:pose(0),open:pose(1),empty:pose(2)}}
}

/** Pixel-study objects share the same authority, feet and collision positions. */
export const oldStreetCompartmentPose=(save:Pick<StorySave,'facts'>)=>save.facts['letter-taken']===true?'empty':save.facts['letter-unlocked']===true?'open':'closed'
export function oldStreetPixelPropSheet(image:string,id:'letter-compartment'|'record-book'){
 const pose=(frameX:number,frameY:number)=>({animations:()=>[[{frameX,frameY,time:0,anchor:[.51,432/512],scale:[.125,.125],x:16,y:28}]]})
 return {id:'oldstreet-'+id,image,width:1024,height:1024,framesWidth:2,framesHeight:2,textures:id==='record-book'?{stand:pose(1,1)}:{closed:pose(0,0),open:pose(1,0),empty:pose(0,1)}}
}
