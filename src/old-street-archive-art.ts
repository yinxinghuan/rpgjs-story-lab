/** Reuse admitted flat work-table and shelf sprites at their existing overhead
 * angle. Furniture poses never claim generated marks are painted in the art. */
export function archiveFurnitureSheets(table:string,shelf:string){
 return ['archive-index','archive-ledger','archive-desk'].flatMap(id=>{
  const desk=id==='archive-desk',w=desk?72:40,h=desk?32:28
  return [{id:'oldstreet-'+id,image:desk?table:shelf,width:desk?512:1024,height:512,framesWidth:desk?1:2,framesHeight:1,textures:{stand:{animations:()=>[[{frameX:0,frameY:0,time:0,anchor:[.5,448/512],scale:desk?[.16,.16]:[.1,.1],x:w/2,y:h,opacity:1}]]}}},
   {id:'oldstreet-'+id+'-papers',image:shelf,width:1024,height:512,framesWidth:2,framesHeight:1,textures:{stand:{animations:()=>[[{frameX:1,frameY:0,time:0,anchor:[.5,310/512],scale:[.055,.035],x:w/2,y:desk?4:-2,opacity:1}]]}}}]
 })
}
