import type {PixelRaster} from './sprite-preparation'
/** Calibrated to the locked B hero only. Below row 266 the source contains
 * trousers and boots; the satchel, coat and upper legs remain pixel-identical.
 * This is not a general way to repair arbitrary character animation. */
export function repairHeroBackStride(source:PixelRaster):PixelRaster{
 if(source.width!==1086||source.height!==1448||source.rgba.length!==1086*1448*4)throw Error('HERO_GAIT_SOURCE_SIZE')
 const rgba=new Uint8ClampedArray(source.rgba),cell=362,row=3,column=2
 for(let y=266;y<cell;y++)for(let x=0;x<cell;x++){
  const from=((row*cell+y)*source.width+column*cell+cell-1-x)*4
  const to=((row*cell+y)*source.width+column*cell+x)*4
  rgba.set(source.rgba.subarray(from,from+4),to)
 }
 return {width:source.width,height:source.height,rgba}
}
