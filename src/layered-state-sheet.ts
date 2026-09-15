/** Compose a stateful prop from source-image rectangles without editing its pixels.
 * All layers belong to one renderer event so foot-depth sorting stays atomic.
 */
export type StateLayerFrame={
 crop:{x:number;y:number;width:number;height:number}
 anchor:[number,number]
 scale:[number,number]
}
export function layeredStateSheet(id:string,image:string,imageSize:{width:number;height:number},states:Record<string,StateLayerFrame>,foot={x:16,y:28}){
 return {id,image,...imageSize,framesWidth:1,framesHeight:1,textures:Object.fromEntries(Object.entries(states).map(([state,frame])=>[state,{
  rectWidth:frame.crop.width,rectHeight:frame.crop.height,offset:{x:frame.crop.x,y:frame.crop.y},
  animations:()=>[[{frameX:0,frameY:0,time:0,anchor:frame.anchor,scale:frame.scale,x:foot.x,y:foot.y}]],
 }]))}
}
