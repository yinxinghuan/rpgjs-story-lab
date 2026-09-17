import catalog from './roof-catalog.json'
export type RoofMaterialId='roof-zinc-green-01'|'roof-slate-blue-01'|'roof-clay-worn-01'|'roof-asphalt-grey-01'
export function getRoofMaterial(id:RoofMaterialId,{allowCandidate=false}={}){
 const entry=catalog.materials.find(m=>m.id===id)
 if(!entry)throw Error('ROOF_MATERIAL_NOT_FOUND:'+id)
 if(entry.status!=='approved'&&!(allowCandidate&&entry.status==='candidate'))throw Error('ROOF_MATERIAL_NOT_ADMITTED:'+id)
 return entry
}
export function roofMaterialSampling(id:RoofMaterialId){
 const m=getRoofMaterial(id,{allowCandidate:true}),width=Math.round(m.render.worldWidth*m.render.pixelsPerWorldUnit),height=Math.round(width*m.crop.height/m.crop.width)
 return {width,height,worldWidth:m.render.worldWidth,worldHeight:m.render.worldWidth*m.crop.height/m.crop.width}
}
