import {layeredStateSheet,type StateLayerFrame} from './layered-state-sheet'
import type {StorySave} from './vendor/original-train/types'
/** Fixed renderer event: both states restore opacity explicitly after recovery. */
export const oldStreetTrolleyPose=(save:Pick<StorySave,'facts'>)=>save.facts['trolley-borrowed']===true?'hidden':'stand'
export function oldStreetTrolleySheet(image:string){
 const pose=(opacity:number)=>({animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,580/640],scale:[.13,.13],x:16,y:28,opacity}]]})
 return {id:'oldstreet-trolley',image,width:512,height:640,framesWidth:1,framesHeight:1,textures:{stand:pose(1),hidden:pose(0)}}
}
export const oldStreetDrawerPose=(save:Pick<StorySave,'facts'>)=>save.facts['lens-taken']===true?'empty':save.facts['drawer-open']===true?'open':'closed'
// Measured on the retained pixel candidate, not inferred from the generation prompt.
export const oldStreetPixelDrawerFrames=[
 {center:241,foot:498,width:253}, {center:248.5,foot:498,width:252}, {center:261,foot:498,width:261},
] as const
export function oldStreetDrawerSheet(image:string){
 const pose=(frameX:number)=>({animations:()=>[[{frameX,frameY:0,time:0,anchor:[(frameX===0?243:252)/512,494/768],scale:[.16,.16],x:16,y:28}]]})
 return {id:'oldstreet-drawer',image,width:1536,height:768,framesWidth:3,framesHeight:1,textures:{closed:pose(0),open:pose(1),empty:pose(2)}}
}

/** Pixel-study objects share the same authority, feet and collision positions. */
export const oldStreetCompartmentPose=(save:Pick<StorySave,'facts'>)=>save.facts['letter-taken']===true?'empty':save.facts['letter-unlocked']===true?'open':'closed'
export const oldStreetPixelCabinetFrames=[{center:261.5,foot:428,top:96},{center:250.5,foot:428,top:96},{center:265,foot:420,top:94},{center:253,foot:422,top:101}] as const
export function oldStreetPixelPropSheet(image:string,id:'letter-compartment'|'record-book'){
 const pose=(frameX:number,frameY:number)=>{const f=oldStreetPixelCabinetFrames[frameY*2+frameX];return {animations:()=>[[{frameX,frameY,time:0,anchor:[f.center/512,f.foot/512],scale:[.125,id==='record-book' ? .125 : .125*332/(f.foot-f.top)],x:16,y:28}]]}}
 return {id:'oldstreet-'+id,image,width:1024,height:1024,framesWidth:2,framesHeight:2,textures:id==='record-book'?{stand:pose(1,1)}:{closed:pose(0,0),open:pose(1,0),empty:pose(0,1)}}
}

/** Reuse the same tabletop/cabinet top in every state; only the front changes. */
export function oldStreetPixelLayeredSheets(image:string,kind:'drawer'|'letter-compartment'){
 const drawer=kind==='drawer',size=drawer?{width:1536,height:768}:{width:1024,height:1024}
 const common:StateLayerFrame=drawer
  ?{crop:{x:0,y:190,width:512,height:166},anchor:[241/512,308/166],scale:[.16,.16]}
  :{crop:{x:0,y:96,width:512,height:179},anchor:[261.5/512,332/179],scale:[.125,.125]}
 const fronts=Object.fromEntries(['closed','open','empty'].map((state,i)=>{
  const f=drawer?oldStreetPixelDrawerFrames[i]:oldStreetPixelCabinetFrames[i]
  const top=drawer?356:275,height=drawer?147:237
  const frame:StateLayerFrame={crop:{x:drawer?i*512:(i%2)*512,y:drawer?top:Math.floor(i/2)*512+top,width:512,height},
   anchor:[f.center/512,(f.foot-top)/height],
   scale:drawer?[.16*253/oldStreetPixelDrawerFrames[i].width,.16]:[.125,.125*153/(f.foot-top)]}
  return [state,frame]
 }))
 return [layeredStateSheet('oldstreet-'+kind+'-top',image,size,{closed:common,open:common,empty:common}),
  layeredStateSheet('oldstreet-'+kind+'-front',image,size,fronts)]
}
