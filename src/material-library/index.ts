import catalog from './catalog.json'

/** Reuse defaults to admitted art. A specific local experiment must opt into candidates. */
export function getMaterial(id:string, options:{allowCandidate?:boolean}={}){
 const material=catalog.materials.find(m=>m.id===id)
 if(!material)throw Error('MATERIAL_NOT_FOUND:'+id)
 if(material.status!=='approved'&&!(material.status==='candidate'&&options.allowCandidate))throw Error('MATERIAL_NOT_ADMITTED:'+id)
 return material
}
export function reusableMaterials(){return catalog.materials.filter(m=>m.status==='approved')}

export {getRoofMaterial,roofMaterialSampling,type RoofMaterialId} from './roof-materials'
