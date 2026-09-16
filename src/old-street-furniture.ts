/** Fixed furniture shares one footprint across authority collision and renderer.
 * It is not a quest target and never introduces a second story state. */
export const oldStreetFurniture = [{id:'shed-bench',room:'shed',description:['沿东侧摆着固定维修工作台，台面有固定台钳、零件盘和工作垫。','A fixed repair bench stands along the east side, with a mounted vise, a parts tray and a work mat.'],body:{x:230,y:350,w:64,h:40}}] as const
export function oldStreetFurnitureSheet(image:string){return {id:'oldstreet-shed-bench',image,width:512,height:512,framesWidth:1,framesHeight:1,textures:{stand:{animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,448/512],scale:[.18,.18],x:32,y:40,opacity:1}]]}}}}
