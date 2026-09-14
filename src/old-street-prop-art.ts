import type {StorySave} from './vendor/original-train/types'
/** Fixed renderer event: both states restore opacity explicitly after recovery. */
export const oldStreetTrolleyPose=(save:Pick<StorySave,'facts'>)=>save.facts['trolley-borrowed']===true?'hidden':'stand'
export function oldStreetTrolleySheet(image:string){
 const pose=(opacity:number)=>({animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,580/640],scale:[.13,.13],x:16,y:28,opacity}]]})
 return {id:'oldstreet-trolley',image,width:512,height:640,framesWidth:1,framesHeight:1,textures:{stand:pose(1),hidden:pose(0)}}
}
