import catalog from './door-catalog.json'
export type DoorMaterialId='door-wood-olive-simple-01'|'door-wood-olive-inset-01'|'door-wood-olive-open90-01'|'door-wood-olive-inset-platform-01'|'door-wood-olive-open90-platform-01'|'door-wood-side-sliding-platform-01'|'door-home-teal-platform-01'
export function getDoorMaterial(id:DoorMaterialId,orientation?:'N'|'S'|'W'|'E'){
 const material=catalog.materials.find(m=>m.id===id)
 if(!material||material.status!=='admitted-local'||material.includesWall)throw Error('DOOR_MATERIAL_NOT_ADMITTED:'+id)
 if(orientation&&!material.orientations.includes(orientation))throw Error('DOOR_ORIENTATION_NOT_SUPPORTED:'+orientation)
 return material
}

export type DoorOpeningPose='inset-oblique'|'open-90'
/** Accepted platform results are preferred; original accepted Codex entries remain explicit fallbacks. */
export function getPreferredDoorMaterial(pose:DoorOpeningPose,orientation:'N'|'S'|'W'|'E'){
 return getDoorMaterial(catalog.preferredByPose[pose] as DoorMaterialId,orientation)
}
