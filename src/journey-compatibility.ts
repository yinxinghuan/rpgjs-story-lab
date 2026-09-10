import {MAP_VERSION} from './contract'
import {LabError,type Head} from './journey-runtime'

// Explicit migration sources; an unknown version may be a newer deployment.
const readableMaps=new Set(['carriage-1','carriage-ortho-1','carriage-ortho-2','carriage-narrow-1','train-scenes-1','train-scenes-2',MAP_VERSION])
export const supportsJourneyMap=(version:unknown):version is string=>typeof version==='string'&&readableMaps.has(version)
export function assertReadableJourney(h:Head):void{
 if(!h||!supportsJourneyMap(h.mapVersion)||h.save?.version!==10||h.save?.cartridgeId!=='carriage-07')throw new LabError('JOURNEY_VERSION_UNSUPPORTED',409)
}
