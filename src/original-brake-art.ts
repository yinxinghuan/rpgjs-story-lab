import type {SceneResource} from './scene-readiness'
export const brakeArt={entityId:'brakes',scene:'train-at-dead-station',graphic:'original-brake-v1',
 resource:{kind:'background',path:'./art/brake-parts-v1.png',sha256:'3cf1cc76e152f991babb357477adfa882be734ed97f713e75c4b4b0cb169edf3',bytes:167950,width:912,height:640} satisfies SceneResource,
 cell:{width:304,height:640},foot:{x:152,y:544},scale:.11,hoseScale:.82,attachment:{x:2,y:-53},body:{x:-13,y:-28,w:26,h:30},
} as const
/** Source pixels retain their shape. One fixed tray, two interchangeable hoses. */
export function originalBrakeSheet(image:string){
 const frame=(column:number,hose:boolean)=>({animations:()=>[[{time:0,frameX:column,frameY:0,anchor:[.5,544/640],scale:[brakeArt.scale*(hose?brakeArt.hoseScale:1),brakeArt.scale*(hose?brakeArt.hoseScale:1)],x:hose?brakeArt.attachment.x*brakeArt.scale:0,y:1+(hose?brakeArt.attachment.y*brakeArt.scale:0)}]]})
 return {id:brakeArt.graphic,image,width:912,height:640,framesWidth:3,framesHeight:1,textures:{base:frame(0,false),cracked:frame(1,true),replaced:frame(2,true)}}
}
