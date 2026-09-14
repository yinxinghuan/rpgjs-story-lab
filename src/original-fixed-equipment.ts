import {yardPumpArt} from './original-yard-pump-art'
import {fixedEquipmentReleases as fans} from './original-fan-art'
import {brakeArt} from './original-brake-art'
import {dieselReleases,type DieselEntity} from './original-diesel-art'
export const fixedEquipmentReleases={'yard-pump-v1':yardPumpArt,...fans,...dieselReleases,'brake-parts-v1':brakeArt} as const
export type FixedEquipmentBindings=Partial<Record<'yard-pump'|'tunnel-fan'|'brakes'|DieselEntity,keyof typeof fixedEquipmentReleases>>
