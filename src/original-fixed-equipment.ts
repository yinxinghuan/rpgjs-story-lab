import {fixedEquipmentReleases as fans} from './original-fan-art'
import {brakeArt} from './original-brake-art'
export const fixedEquipmentReleases={...fans,'brake-parts-v1':brakeArt} as const
export type FixedEquipmentBindings=Partial<Record<'tunnel-fan'|'brakes',keyof typeof fixedEquipmentReleases>>
