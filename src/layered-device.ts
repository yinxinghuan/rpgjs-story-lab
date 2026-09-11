import {prepareSpritePixels,type PixelRaster} from './sprite-preparation'
export const FAN_PARTS_SOURCE='8fdd576bd4bc1982436e99a93c04ef1e545ec890d046a75cb5a99e05304dc16a'
export type LayeredSpec={housingFoot:{x:number;y:number};rotorCenter:{x:number;y:number};housingCenter:{x:number;y:number};housingScale:number;rotorScale:number;periodMs:number;body:{width:number;depth:number;front:number};reviewedFanAperture:boolean}
export const fanPartsSpec:LayeredSpec={housingFoot:{x:160,y:486},rotorCenter:{x:153,y:340},housingCenter:{x:160,y:353},housingScale:.11,rotorScale:.046,periodMs:1200,body:{width:26,depth:12,front:3},reviewedFanAperture:true}
const invalid=()=>{throw Error('LAYER_SPEC_INVALID')}
export function validateLayeredSpec(s:LayeredSpec,width:number,height:number,sourceSha:string){
 if(!s||Object.keys(s).sort().join(',')!=='body,housingCenter,housingFoot,housingScale,periodMs,reviewedFanAperture,rotorCenter,rotorScale'||!Number.isInteger(width)||width<32||width>1536||width%2||!Number.isInteger(height)||height<32||height>1536||width*height>1572864)invalid()
 for(const p of [s.housingFoot,s.rotorCenter,s.housingCenter])if(!p||Object.keys(p).sort().join(',')!=='x,y'||!Number.isInteger(p.x)||!Number.isInteger(p.y)||p.x<1||p.x>=width/2-1||p.y<1||p.y>=height-1)invalid()
 for(const n of [s.housingScale,s.rotorScale])if(!Number.isFinite(n)||n<.01||n>.5)invalid()
 if(!Number.isInteger(s.periodMs)||s.periodMs<400||s.periodMs>10000||typeof s.reviewedFanAperture!=='boolean')invalid()
 if(!s.body||Object.keys(s.body).sort().join(',')!=='depth,front,width'||!Number.isFinite(s.body.width)||s.body.width<8||s.body.width>64||!Number.isFinite(s.body.depth)||s.body.depth<4||s.body.depth>32||!Number.isFinite(s.body.front)||s.body.front<0||s.body.front>8)invalid()
 if(s.reviewedFanAperture&&(sourceSha!==FAN_PARTS_SOURCE||width!==640||height!==640))throw Error('LAYER_APERTURE_SOURCE_MISMATCH')
}
/** Pixel-only preparation. No resampling, painting or replacement of the retained source. */
export function prepareLayeredPixels(input:PixelRaster,s:LayeredSpec,sourceSha:string){
 validateLayeredSpec(s,input.width,input.height,sourceSha)
 if(input.rgba.length!==input.width*input.height*4)invalid()
 const w=input.width/2,h=input.height
 return ([0,1] as const).map(col=>{
  const rgba=new Uint8ClampedArray(w*h*4)
  for(let y=0;y<h;y++)rgba.set(input.rgba.subarray((y*input.width+col*w)*4,(y*input.width+(col+1)*w)*4),y*w*4)
  if(col===1&&s.reviewedFanAperture){
   // Only the reviewed original's white shaft aperture. This is not a global white deletion.
   const stack=[340*w+153],seen=new Set<number>();let removed=0
   while(stack.length){const p=stack.pop()!;if(seen.has(p))continue;seen.add(p);const x=p%w,y=Math.floor(p/w),i=p*4;if(x<134||x>173||y<316||y>365)continue;const rgb=[rgba[i],rgba[i+1],rgba[i+2]];if(Math.min(...rgb)<200||Math.max(...rgb)-Math.min(...rgb)>20)continue;rgba.fill(0,i,i+4);removed++;stack.push(p-1,p+1,p-w,p+w)}
   if(removed<400||removed>1500)throw Error('LAYER_APERTURE_CHANGED')
  }
  const foot=col?{x:Math.floor(w/2),y:Math.floor(h/2)}:{x:Math.floor(w/2),y:Math.floor(h*.85)}
  return prepareSpritePixels({width:w,height:h,rgba},{columns:1,rows:1,cellWidth:w,cellHeight:h,foot,kind:'states',backgroundMode:'pale-neutral',neutralMin:200,chromaMax:20,sourceAnchors:[col?s.rotorCenter:s.housingFoot]})
 })
}
export const layerPose=(elapsed:number,periodMs:number)=>'spin-'+Math.floor(((Math.max(0,elapsed)%periodMs)/periodMs)*36)
export function layeredSheets(id:string,housing:string,rotor:string,w:number,h:number,s:LayeredSpec){
 const foot={x:Math.floor(w/2),y:Math.floor(h*.85)},center={x:Math.floor(w/2),y:Math.floor(h/2)}
 const frame=(rotation:number)=>({time:0,frameX:0,frameY:0,anchor:[center.x/w,center.y/h],scale:[s.rotorScale,s.rotorScale],x:(s.housingCenter.x-s.housingFoot.x)*s.housingScale,y:1+(s.housingCenter.y-s.housingFoot.y)*s.housingScale,rotation})
 return [{id:id+'-housing',image:housing,width:w,height:h,framesWidth:1,framesHeight:1,textures:{stand:{animations:()=>[[{time:0,frameX:0,frameY:0,anchor:[foot.x/w,foot.y/h],scale:[s.housingScale,s.housingScale],x:0,y:1}]]}}},
 {id:id+'-rotor',image:rotor,width:w,height:h,framesWidth:1,framesHeight:1,textures:{stopped:{animations:()=>[[frame(0)]]},...Object.fromEntries(Array.from({length:36},(_,i)=>['spin-'+i,{animations:()=>[[frame(i*Math.PI*2/36)]]}]))}}]
}
export function layerBlocks(s:LayeredSpec,at:{x:number;y:number},p:{x:number;y:number}){return p.x+9>at.x-s.body.width/2&&p.x<at.x+s.body.width/2&&p.y+15>at.y-s.body.depth&&p.y<at.y+s.body.front}
export const LAYER_CHECKS=['stopped','running','front','back','collision'] as const
