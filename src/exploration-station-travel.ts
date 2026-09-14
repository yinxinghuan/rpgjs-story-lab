import type {StorySave,StoryCartridge} from './vendor/original-train/types'
import {bindStationLayout} from './exploration-station-plan'
import {prepareDoorTravel,type DoorTravelInput} from './spatial-door-travel'

/** Spatial travel preparation; the existing Session must commit its returned save
 * and position atomically. This function does not create storage or invoke AI. */
export function prepareStationTravel(save:StorySave,cartridge:StoryCartridge,input:DoorTravelInput){
 return prepareDoorTravel(save,cartridge,bindStationLayout(cartridge.locale),input)
}
