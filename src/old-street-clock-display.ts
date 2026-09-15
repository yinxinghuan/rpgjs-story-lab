import type {StorySave} from './vendor/original-train/types'
export const oldStreetClockDisplayPose=(save:Pick<StorySave,'facts'>)=>save.facts['clock-returned']===true?'returned':'stand'
export function oldStreetClockDisplaySheets(counter:string,clock:string){
 const base=()=>({animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,448/512],scale:[.125,.125],x:16,y:28,opacity:1}]]})
 const top=(opacity:number)=>({animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,448/512],scale:[.07,.07],x:16,y:-7,opacity}]]})
 return [
  {id:'oldstreet-clock-counter',image:counter,width:1024,height:512,framesWidth:2,framesHeight:1,textures:{stand:base(),returned:base()}},
  {id:'oldstreet-returned-clock',image:clock,width:512,height:512,framesWidth:1,framesHeight:1,textures:{stand:top(0),returned:top(1)}},
 ]
}
