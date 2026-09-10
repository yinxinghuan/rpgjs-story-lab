import type {StoryCartridge,StorySave} from './vendor/original-train/types'
/** Preserve the frozen original director, adding the irreversible physical
 * outcome of the playable crossing. Legacy saves without this fact retain the
 * original contract; capabilities are never fabricated or made easier. */
export function originalEndingCartridge(save:Pick<StorySave,'facts'>,cartridge:StoryCartridge):StoryCartridge{
 const fate=save.facts['bridge-train-fate']
 if(!cartridge.endingDirector||!['anchored','preserved'].includes(String(fate)))return cartridge
 const blocked=fate==='anchored'?new Set(['keep-moving','settle-junction','crew-autonomy','sole-command','railway-commons']):new Set(['sacrifice-train'])
 return {...cartridge,endingDirector:{...cartridge.endingDirector,capabilities:cartridge.endingDirector.capabilities.filter(c=>!blocked.has(c.id))}}
}
