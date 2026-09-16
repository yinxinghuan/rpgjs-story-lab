import {oldStreetCrateFootprint as body,oldStreetCrateSprite as art,oldStreetCrateScale as scale} from './old-street-crate-layout'
/** Single object group, with visible width aligned to the blocking footprint. */
export function oldStreetCratesSheet(image:string){
 return {id:'oldstreet-crates',image,width:art.width,height:art.height,framesWidth:1,framesHeight:1,textures:{stand:{animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[art.foot.x/art.width,art.foot.y/art.height],scale:[scale,scale],x:body.width/2,y:body.depth}]]}}}
}
