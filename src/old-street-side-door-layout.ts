import {oldStreetDoors} from './old-street-space'
import {isSidePassage} from './old-street-side-door-config'
import type {OldStreetRoom} from './old-street-cartridge'
import type {StorySave} from './vendor/original-train/types'
export * from './old-street-side-door-config'
export function roomSidePassages(room:OldStreetRoom,facts:StorySave['facts']){return oldStreetDoors().filter(d=>d.room===room&&isSidePassage(d)&&(!['darkroom-ready','archive-ready'].includes(d.gate??'')||facts[d.gate!]))}
