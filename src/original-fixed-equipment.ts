import {fixedEquipmentReleases as fans} from './original-fan-art'
import {brakeArt} from './original-brake-art'
import {dieselReleases,type DieselEntity} from './original-diesel-art'
export const fixedEquipmentReleases={...fans,...dieselReleases,'brake-parts-v1':brakeArt} as const
export type FixedEquipmentBindings=Partial<Record<'tunnel-fan'|'brakes'|DieselEntity,keyof typeof fixedEquipmentReleases>>
