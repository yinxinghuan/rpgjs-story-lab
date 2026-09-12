import type {PixelRaster} from './sprite-preparation'
import {ACTOR_DIRECTIONS,type ActorDirection} from './actor-sheet-review'
export type StrideComparison={top:number;height:number;overlap:number;difference:number;similar:boolean}
/** Read-only lower-body comparison. Similar pixels can flag a repeated pose;
 * dissimilar pixels never prove opposite anatomical legs. Ignore clear RGB. */
export function compareActorStrides(r:PixelRaster):Record<ActorDirection,StrideComparison>{
 if(!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.width<12||r.height<16||r.width>1536||r.height>1536||r.width*r.height>1572864||r.width%3||r.height%4||r.rgba.length!==r.width*r.height*4)throw Error('ACTOR_STRIDE_RASTER_INVALID')
 const w=r.width/3,h=r.height/4,rows={}as Record<ActorDirection,StrideComparison>
 for(const [row,direction]of ACTOR_DIRECTIONS.entries()){
  let top=h,bottom=0
  const alpha=(column:number,x:number,y:number)=>x<0||x>=w||y<0||y>=h?0:r.rgba[((row*h+y)*r.width+column*w+x)*4+3]
  for(const column of [0,2])for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(alpha(column,x,y)>200){top=Math.min(top,y);bottom=Math.max(bottom,y+1)}
  if(bottom-top<4)throw Error('ACTOR_STRIDE_EMPTY')
  top=Math.floor(top+(bottom-top)*.64)
  let overlap=0,difference=1
  // At most two source pixels; compensate alignment jitter, never rescale limbs.
  const tolerance=Math.min(2,Math.floor(w/24))
  for(let dy=-tolerance;dy<=tolerance;dy++)for(let dx=-tolerance;dx<=tolerance;dx++){
   let union=0,both=0,delta=0
   for(let y=top;y<bottom;y++)for(let x=0;x<w;x++){
    const a=alpha(0,x,y)>200,b=alpha(2,x+dx,y+dy)>200
    if(!a&&!b)continue;union++
    if(a&&b){both++;const i=((row*h+y)*r.width+x)*4,j=((row*h+y+dy)*r.width+2*w+x+dx)*4;delta+=(Math.abs(r.rgba[i]-r.rgba[j])+Math.abs(r.rgba[i+1]-r.rgba[j+1])+Math.abs(r.rgba[i+2]-r.rgba[j+2]))/(3*255)}else delta++
   }
   if(union&&delta/union<difference){overlap=both/union;difference=delta/union}
  }
  rows[direction]={top,height:bottom-top,overlap,difference,similar:overlap>=.9&&difference<=.15}
 }
 return rows
}
