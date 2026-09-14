import type {StorySave} from './vendor/original-train/types'
import {oldStreetCartridge} from './old-street-cartridge'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
/** A recovered/latest head may differ from the attempted action. Recheck before opening art. */
export function oldStreetRequiredInspection(save:StorySave,scene:string,target:string,code:unknown):'clock'|'photo'|null{
 const kind=code==='OLD_STREET_CLOCK_INSPECTION_REQUIRED'?'clock':code==='OLD_STREET_PHOTO_ALIGNMENT_REQUIRED'?'photo':null
 if(!kind)return null
 const contract=kind==='clock'?{room:'shop',target:'drawer',action:'oldstreet:inspect-clock'}:{room:'photo',target:'viewing-table',action:'oldstreet:match-photos'}
 if(scene!==contract.room||target!==contract.target)return null
 return resolveDomainAction(save,oldStreetCartridge(save.locale),contract.action)?.status==='accepted'?kind:null
}
