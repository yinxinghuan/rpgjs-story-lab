import type {PixelRaster} from './sprite-preparation'
export type SpriteFrameSelection={raster:PixelRaster;columns:number;column:number}
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
