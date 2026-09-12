import {assertPublishedActor,type PublishedActor,assertPublishedHero,type PublishedHero} from './actor-publication'
import type {SpriteDraft,SpritePng} from './sprite-draft'
import {verifySpritePng} from './sprite-draft'
import type {PixelRaster} from './sprite-preparation'
// One scale for the entire sheet. Read-only alpha>200 measurement of the locked
// B hero: median 236 source pixels at its existing .14 runtime scale.
export const ACTOR_PREVIEW_HEIGHT=236*.14
export type ActorPreview={id:string;png:SpritePng;width:number;height:number;scale:number;baselines:number[][];centers:number[][];frameBounds:Array<[number,number,number,number]>}
const invalid=()=>{throw Error('SPRITE_MAP_CANDIDATE_INVALID')}
export async function inspectActorMapCandidate(draft:SpriteDraft,id:string,decode:(png:SpritePng)=>Promise<PixelRaster>):Promise<ActorPreview> {
 const s=draft.spec,r=draft.result
 if(draft.version!=='sprite-draft-1'||draft.id!==id||draft.state!=='candidate'||!s||!r||s.kind!=='actor'||s.columns!==3||s.rows!==4||r.algorithm!=='neutral-matte-unmix-1')return invalid()
 if(!Number.isInteger(s.cellWidth)||!Number.isInteger(s.cellHeight)||s.cellWidth<1||s.cellHeight<1||r.png.width!==s.cellWidth*3||r.png.height!==s.cellHeight*4||r.frames.length!==12)return invalid()
 if(!Number.isInteger(s.foot.x)||!Number.isInteger(s.foot.y)||s.foot.x<0||s.foot.x>=s.cellWidth||s.foot.y<=0||s.foot.y>s.cellHeight)return invalid()
 await verifySpritePng(draft.source);await verifySpritePng(r.png)
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  const f=r.frames[row*3+col]
  if(f.column!==col||f.row!==row||f.sourceAnchor.x+f.offset.x!==s.foot.x||f.sourceAnchor.y+f.offset.y!==s.foot.y)return invalid()
 }
 return inspectActorImage(r.png,s,decode,'creator-actor-'+id)
}
export async function inspectActorImage(png:SpritePng,s:{cellWidth:number;cellHeight:number;foot:{x:number;y:number}},decode:(png:SpritePng)=>Promise<PixelRaster>,id:string):Promise<ActorPreview>{
 await verifySpritePng(png)
 const pixels=await decode(png)
 if(pixels.width!==png.width||pixels.height!==png.height||pixels.width!==s.cellWidth*3||pixels.height!==s.cellHeight*4||pixels.rgba.length!==pixels.width*pixels.height*4)return invalid()
 const frameBounds:ActorPreview['frameBounds']=[],heights:number[]=[]
 for(let row=0;row<4;row++)for(let col=0;col<3;col++){
  let left=s.cellWidth,top=s.cellHeight,right=0,bottom=0,clear=0,solid=0
  for(let y=0;y<s.cellHeight;y++)for(let x=0;x<s.cellWidth;x++){
   const alpha=pixels.rgba[((row*s.cellHeight+y)*pixels.width+col*s.cellWidth+x)*4+3]
   if(alpha===0)clear++
   if(alpha>200){solid++;left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x+1);bottom=Math.max(bottom,y+1)}
   if((x===0||y===0||x===s.cellWidth-1||y===s.cellHeight-1)&&alpha!==0)return invalid()
  }
  if(!solid||clear<s.cellWidth*s.cellHeight*.2||Math.abs(bottom-s.foot.y)>2||bottom-top<4)return invalid()
  heights.push(bottom-top);frameBounds.push([left,top,right,bottom])
 }
 const median=[...heights].sort((a,b)=>a-b)[6],scale=ACTOR_PREVIEW_HEIGHT/median
 // Large frame-size changes cannot be corrected by secretly resizing individual frames.
 if(heights.some(h=>h<median*.75||h>median*1.25)||!Number.isFinite(scale))return invalid()
 return {id,png,width:png.width,height:png.height,scale,baselines:Array.from({length:4},()=>[s.foot.y,s.foot.y,s.foot.y]),centers:Array.from({length:4},()=>[s.foot.x,s.foot.x,s.foot.x]),frameBounds}
}

export async function verifyPublishedActorPixels(release:PublishedActor,png:SpritePng,decode:(png:SpritePng)=>Promise<PixelRaster>){
 assertPublishedActor(release)
 if(png.sha256!==release.sha256||png.bytes.length!==release.bytes||png.width!==release.width||png.height!==release.height)return invalid()
 const c=await inspectActorImage(png,{cellWidth:release.width/3,cellHeight:release.height/4,foot:release.foot},decode,'published-actor')
 if(c.scale!==release.review.scale||JSON.stringify(c.frameBounds)!==JSON.stringify(release.review.bounds))throw Error('ACTOR_GEOMETRY_MISMATCH')
 return c
}

export async function verifyPublishedHeroPixels(release:PublishedHero,png:SpritePng,decode:(png:SpritePng)=>Promise<PixelRaster>){
 assertPublishedHero(release)
 if(png.sha256!==release.sha256||png.bytes.length!==release.bytes||png.width!==release.width||png.height!==release.height)return invalid()
 const c=await inspectActorImage(png,{cellWidth:release.width/3,cellHeight:release.height/4,foot:release.foot},decode,'published-actor')
 if(c.scale!==release.review.scale||JSON.stringify(c.frameBounds)!==JSON.stringify(release.review.bounds))throw Error('ACTOR_GEOMETRY_MISMATCH')
 return c
}
