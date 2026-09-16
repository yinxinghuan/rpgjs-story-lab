import type {StorySave} from './vendor/original-train/types'
import type {OldStreetCampaign} from './old-street-campaign'
/** The shelf stays solid and visible after the carried folder has been removed. */
export const oldStreetPhotoShelfPose=(save:Pick<StorySave,'facts'>,campaign?:OldStreetCampaign)=>{
 const photo=save.facts['photos-taken']!==true,papers=campaign?.trace?.selected!==undefined&&campaign.parcel?.disposition!=='take'
 return papers?(photo?'both':'papers'):(photo?'stand':'empty')
}
export function oldStreetPhotoShelfSheets(image:string){
 const sheet=(kind:'shelf'|'photo'|'papers')=>{
  const folder=kind!=='shelf'
  const pose=(state:string)=>({animations:()=>[[{frameX:folder?1:0,frameY:0,time:0,anchor:[.5,(folder?310:448)/512],scale:kind==='papers'?[.06,.045]:folder?[.08,.055]:[.125,.125],x:kind==='papers'?24:kind==='photo'&&state==='both'?9:16,y:kind==='papers'?-4:folder?-3:28,opacity:kind==='shelf'||kind==='photo'&&['stand','both'].includes(state)||kind==='papers'&&['papers','both'].includes(state)?1:0}]]})
  return {id:kind==='shelf'?'oldstreet-photo-folder-shelf':kind==='photo'?'oldstreet-photo-folder-top':'oldstreet-archived-papers',image,width:1024,height:512,framesWidth:2,framesHeight:1,textures:Object.fromEntries(['stand','empty','papers','both'].map(state=>[state,pose(state)]))}
 }
 // Reuse the admitted flat folder artwork for a second paper packet. Its own
 // layer follows campaign possession, never the legacy photograph inventory.
 return [sheet('shelf'),sheet('photo'),sheet('papers')]
}
