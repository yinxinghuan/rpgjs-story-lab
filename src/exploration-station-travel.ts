import type {StorySave,StoryCartridge} from './vendor/original-train/types'
import {resolveDomainAction,applyDomainResolution} from './vendor/original-train/engine/domainRules'
import {bindStationLayout} from './exploration-station-plan'
import type {SpatialPoint} from './spatial-binding'

/** Spatial travel preparation; the existing Session must commit its returned save
 * and position atomically. This function does not create storage or invoke AI. */
export function prepareStationTravel(save:StorySave,cartridge:StoryCartridge,input:{actionId:string;target:string;scene:string;position:SpatialPoint}){
 const binding=bindStationLayout(cartridge.locale)
 if(save.cartridgeId!==binding.cartridgeId||cartridge.id!==binding.cartridgeId)throw Error('STATION_STORY_MISMATCH')
 binding.locate(save,input.scene)
 if(!binding.admits(input.actionId,input.target,input.scene,input.position))throw Error('STATION_EXIT_UNREACHABLE')
 const rule=cartridge.domainRules?.rules.find(r=>r.id===input.actionId)
 if(!rule||rule.effects.length!==1||rule.effects[0].type!=='map')throw Error('STATION_TRAVEL_MUST_ONLY_MOVE')
 const resolution=resolveDomainAction(save,{...cartridge,domainRules:{rules:[{...rule,match:[input.actionId]}]}},input.actionId)
 if(!resolution||resolution.status!=='accepted')throw Error('STATION_EXIT_CLOSED')
 const next=structuredClone(save)
 applyDomainResolution(next,cartridge,resolution)
 // Ordinary walking through a door must not replace the current puzzle choices
 // with empty chapter choices or append another narrative arrival paragraph.
 next.choices=structuredClone(save.choices)
 const arrival=binding.assertTransition(save,next,input.actionId,input.scene)
 if(!arrival)throw Error('STATION_EXIT_HAS_NO_ARRIVAL')
 return {save:next,scene:arrival.scene,position:arrival.position}
}
