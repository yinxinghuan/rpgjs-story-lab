/** Bounded geometry only: never serialize engine nodes, texture URLs or IDs. */
type Node={children?:Node[];x?:number;y?:number;visible?:boolean;renderable?:boolean;alpha?:number;worldAlpha?:number;destroyed?:boolean;scale?:{x:number;y:number};worldTransform?:{tx:number;ty:number};texture?:unknown;toWorld?:unknown;moveCorner?:unknown}
const number=(n:unknown)=>typeof n==='number'&&Number.isFinite(n)?Math.round(n*100)/100:null
export function inspectDisplayTree(stage:unknown){
 const seen=new Set<Node>(),rows:unknown[]=[]
 let nodes=0,textures=0,hidden=0,truncated=false
 function visit(n:Node,depth:number){
  if(!n||seen.has(n))return
  if(nodes>=2048||depth>32){truncated=true;return}
  seen.add(n);nodes++
  const invisible=n.visible===false||n.renderable===false||n.worldAlpha===0
  if(invisible)hidden++
  if(n.texture)textures++
  const viewport=typeof n.toWorld==='function'&&typeof n.moveCorner==='function'
  if((viewport||n.texture)&&rows.length<32)rows.push({viewport,texture:Boolean(n.texture),x:number(n.x),y:number(n.y),sx:number(n.scale?.x),sy:number(n.scale?.y),wx:number(n.worldTransform?.tx),wy:number(n.worldTransform?.ty),hidden:invisible,alpha:number(n.worldAlpha??n.alpha),destroyed:n.destroyed===true})
  for(const child of n.children??[])visit(child,depth+1)
 }
 visit(stage as Node,0)
 return{nodes,textures,hidden,truncated,rows}
}
