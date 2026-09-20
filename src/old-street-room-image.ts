import type {DarkroomSlot} from './old-street-room-media'
export type RoomImage={url:string;width:number;height:number;bounds:{x:number;y:number;width:number;height:number}}
/** Pixel processing only; no rescale, warp or invented geometry. */
export function inspectRoomPixels(id:DarkroomSlot,data:Uint8ClampedArray,width:number,height:number){
 if(width!==512||height!==512||data.length!==width*height*4)throw Error('ROOM_IMAGE_DIMENSIONS')
 let minX=width,minY=height,maxX=-1,maxY=-1,opaque=0
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const i=(y*width+x)*4
  if(id==='bench'&&data[i]-data[i+1]>35&&data[i+2]-data[i+1]>35)data[i+3]=0
  if(data[i+3]>24){opaque++;minX=Math.min(x,minX);maxX=Math.max(x,maxX);minY=Math.min(y,minY);maxY=Math.max(y,maxY)}
 }
 const bounds={x:minX,y:minY,width:maxX-minX+1,height:maxY-minY+1}
 if(id==='floor'){if(opaque<width*height*.98)throw Error('ROOM_FLOOR_TRANSPARENCY');return {x:0,y:0,width,height}}
 if(opaque<width*height*.08||opaque>width*height*.8||minX<2||minY<2||maxX>width-3||maxY>height-3||bounds.width/bounds.height<1.2||bounds.width/bounds.height>3)throw Error('ROOM_BENCH_SILHOUETTE')
 return bounds
}
export async function prepareRoomImage(id:DarkroomSlot,bytes:Uint8Array):Promise<RoomImage>{
 const source=URL.createObjectURL(new Blob([new Uint8Array(bytes)],{type:'image/png'})),image=new Image()
 try{
  image.src=source;await image.decode()
  const canvas=document.createElement('canvas');canvas.width=image.naturalWidth;canvas.height=image.naturalHeight
  if(canvas.width!==512||canvas.height!==512)throw Error('ROOM_IMAGE_DIMENSIONS')
  const ctx=canvas.getContext('2d');if(!ctx)throw Error('ROOM_IMAGE_CONTEXT')
  ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,512,512),bounds=inspectRoomPixels(id,pixels.data,512,512)
  ctx.putImageData(pixels,0,0)
  const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(value=>value?resolve(value):reject(Error('ROOM_IMAGE_ENCODE')),'image/png'))
  return {url:URL.createObjectURL(blob),width:512,height:512,bounds}
 }finally{URL.revokeObjectURL(source)}
}
