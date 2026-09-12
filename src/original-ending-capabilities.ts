import type {StoryCartridge,StorySave} from './vendor/original-train/types'
/** Preserve the frozen original director, adding the irreversible physical
 * outcome of the playable crossing. Legacy saves without this fact retain the
 * original contract; capability eligibility is never fabricated or made easier.
 * An anchored train's ongoing rescue obligation must use the foot crossing,
 * not imply that its carriages can resume service. */
export function originalEndingCartridge(save:Pick<StorySave,'facts'>,cartridge:StoryCartridge):StoryCartridge{
 const fate=save.facts['bridge-train-fate']
 if(!cartridge.endingDirector||!['anchored','preserved'].includes(String(fate)))return cartridge
 const blocked=fate==='anchored'?new Set(['keep-moving','settle-junction','crew-autonomy','sole-command','railway-commons']):new Set(['sacrifice-train'])
 return {...cartridge,endingDirector:{...cartridge.endingDirector,capabilities:cartridge.endingDirector.capabilities.filter(c=>!blocked.has(c.id)).map(c=>fate==='anchored'&&c.id==='rescue-network'?{...c,mandatoryCosts:[cartridge.locale==='zh'?'队伍必须长期维护步行通道，为沿线救援预留人手、物资和剩余燃料':'The crew must permanently maintain the foot crossing and reserve people, supplies and remaining fuel for route rescues']}:c)}}
}
