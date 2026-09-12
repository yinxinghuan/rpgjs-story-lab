import type {PixelRaster} from './sprite-preparation'
export type SpriteFrameSelection={raster:PixelRaster;columns:number;column:number}
/** Replace one already prepared actor cell. Preparation/scale review stays an
 * explicit prior step; this function cannot silently resize or mirror a pose. */
export function replaceActorFrame(sheet:PixelRaster,frame:PixelRaster,row:number,column:number):PixelRaster{
 const valid=(r:PixelRaster)=>Number.isInteger(r.width)&&Number.isInteger(r.height)&&r.width>0&&r.height>0&&r.width<=1536&&r.height<=1536&&r.width*r.height<=1572864&&r.rgba instanceof Uint8ClampedArray&&r.rgba.length===r.width*r.height*4
 if(!valid(sheet)||!valid(frame)||sheet.width%3||sheet.height%4)throw Error('ACTOR_FRAME_GRID')
 if(!Number.isInteger(row)||row<0||row>=4||!Number.isInteger(column)||column<0||column>=3)throw Error('ACTOR_FRAME_SELECTION')
 const width=sheet.width/3,height=sheet.height/4
 if(frame.width!==width||frame.height!==height)throw Error('ACTOR_FRAME_SIZE_MISMATCH')
 const rgba=new Uint8ClampedArray(sheet.rgba)
 for(let y=0;y<height;y++)rgba.set(frame.rgba.subarray(y*width*4,(y+1)*width*4),((row*height+y)*sheet.width+column*width)*4)
 return {width:sheet.width,height:sheet.height,rgba}
}
/** Lossless selection only; no inferred state, resizing, mirroring or repainting. */
export function composeRepairFrames(inputs:SpriteFrameSelection[]):PixelRaster{
 if(inputs.length!==2)throw Error('SPRITE_COMPOSITION_INPUTS')
 const sizes=inputs.map(({raster:r,columns,column})=>{
  if(!Number.isInteger(columns)||columns<1||columns>12||!Number.isInteger(column)||column<0||column>=columns||!Number.isInteger(r.width)||!Number.isInteger(r.height)||r.width<1||r.height<1||r.width>1536||r.height>1536||r.width*r.height>1572864||r.width%columns||r.rgba.length!==r.width*r.height*4)throw Error('SPRITE_COMPOSITION_GRID')
  return {width:r.width/columns,height:r.height}
 })
 const {width:cell,height}=sizes[0],width=cell*2
 if(sizes[1].width!==cell||sizes[1].height!==height)throw Error('SPRITE_COMPOSITION_SIZE_MISMATCH')
 if(width>1536||width*height>1572864)throw Error('SPRITE_COMPOSITION_SIZE')
 const rgba=new Uint8ClampedArray(width*height*4)
 inputs.forEach(({raster:r,column},i)=>{for(let y=0;y<height;y++)rgba.set(r.rgba.subarray((y*r.width+column*cell)*4,(y*r.width+(column+1)*cell)*4),(y*width+i*cell)*4)})
 return {width,height,rgba}
}
