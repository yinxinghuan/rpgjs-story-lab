import type {StorySave} from './vendor/original-train/types'
/** The shelf stays solid and visible after the carried folder has been removed. */
export const oldStreetPhotoShelfPose=(save:Pick<StorySave,'facts'>)=>save.facts['photos-taken']===true?'empty':'stand'
export function oldStreetPhotoShelfSheets(image:string){
 const sheet=(folder:boolean)=>{
  const pose=(opacity:number)=>({animations:()=>[[{frameX:folder?1:0,frameY:0,time:0,anchor:[.5,(folder?310:448)/512],scale:folder?[.08,.055]:[.125,.125],x:16,y:folder?-3:28,opacity}]]})
  return {id:folder?'oldstreet-photo-folder-top':'oldstreet-photo-folder-shelf',image,width:1024,height:512,framesWidth:2,framesHeight:1,textures:{stand:pose(1),empty:pose(folder?0:1)}}
 }
 return [sheet(false),sheet(true)]
}
