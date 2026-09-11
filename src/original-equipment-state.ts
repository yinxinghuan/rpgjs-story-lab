import type {StorySave} from './vendor/original-train/types'
import {LabError} from './journey-runtime'
/** Installation is durable physical history, even when the warning was cleared. */
export const originalBrakeState=(save:StorySave)=>save.facts['brake-hose-replaced']===true||save.facts['pass-method']==='air-brake'?'replaced':'cracked'
export function assertOriginalEquipmentAction(save:StorySave,id:string){
 if(['inspect-brakes','replace-brake-hose'].includes(id)&&originalBrakeState(save)==='replaced')throw new LabError('ORIGINAL_BRAKE_ALREADY_REPAIRED',409)
}
