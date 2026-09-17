import type {StorySave} from './vendor/original-train/types'
import {oldStreetPixelPropSheet} from './old-street-prop-art'

/** The public record is separate from possession and the owner's permission. */
export function oldStreetRecordBookPose(save:Pick<StorySave,'facts'>){
 const photo=save.facts['photo-recorded']===true&&save.facts['photo-consent']===true
 const clock=save.facts['clock-recorded']===true&&save.facts['clock-consent']===true
 const base=photo&&clock?'both':photo?'photo':clock?'clock':'stand'
 return save.facts['archive-published']===true?`${base}-summary`:base
}
const baseStates=['stand','photo','clock','both'] as const
const states=[...baseStates,...baseStates.map(state=>`${state}-summary`)]
/** Both flat illustrations belong to the book event, retaining its foot-depth.
 * Measured paper interiors in the source: left x660..754, right x778..870,
 * y648..772; source foot 765,934 at .125. No pixels are rewritten. */
export function oldStreetRecordBookSheets(book:string,photo:string,clock:string,papers?:string|null){
 const base=oldStreetPixelPropSheet(book,'record-book')
 const overlay=(id:string,image:string,width:number,height:number,x:number,scale:number,kind:'photo'|'clock')=>({
  id,image,width,height,framesWidth:1,framesHeight:1,
  textures:Object.fromEntries(states.map(state=>[state,{animations:()=>[[{
   frameX:0,frameY:0,time:0,anchor:[.5,.5],scale:[scale,scale],x,y:0,
   opacity:state.replace('-summary','')===kind||state.replace('-summary','')==='both'?1:0,
  }]]}])),
 })
 return [
  {...base,textures:Object.fromEntries(states.map(state=>[state,base.textures.stand!]))},
  overlay('oldstreet-record-photo',photo,1024,768,8.75,10/1024,'photo'),
  overlay('oldstreet-record-clock',clock,512,512,23.25,12/512,'clock'),
  ...(papers?[{id:'oldstreet-record-summary',image:papers,width:1024,height:512,framesWidth:2,framesHeight:1,
   textures:Object.fromEntries(states.map(state=>[state,{animations:()=>[[{frameX:1,frameY:0,time:0,anchor:[.5,310/512],scale:[.035,.025],x:16,y:-3,opacity:state.endsWith('-summary')?1:0}]]}]))}]:[]),
 ] as const
}
