import type {StorySave} from './vendor/original-train/types'
export const oldStreetPhotoTablePose=(save:Pick<StorySave,'facts'>)=>save.facts['photos-returned']===true?'returned':'stand'
/** Closed folder on the work mat: returning it does not disclose or publish its contents. */
export function oldStreetPhotoTableSheets(table:string,folder:string){
 const base=()=>({animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,448/512],scale:[.125,.125],x:16,y:28,opacity:1}]]})
 const top=(opacity:number)=>({animations:()=>[[{frameX:1,frameY:0,time:0,anchor:[.5,310/512],scale:[.045,.025],x:16,y:3,opacity}]]})
 return [
  {id:'oldstreet-viewing-table',image:table,width:512,height:512,framesWidth:1,framesHeight:1,textures:{stand:base(),returned:base()}},
  {id:'oldstreet-returned-photos',image:folder,width:1024,height:512,framesWidth:2,framesHeight:1,textures:{stand:top(0),returned:top(1)}},
  {id:'oldstreet-returned-negative',image:folder,width:1024,height:512,framesWidth:2,framesHeight:1,textures:Object.fromEntries(['stand','returned'].map(pose=>[pose,{animations:()=>[[{frameX:1,frameY:0,time:0,anchor:[.5,310/512],scale:[.035,.025],x:7,y:8,opacity:pose==='returned'?1:0}]]}]))},
 ]
}
