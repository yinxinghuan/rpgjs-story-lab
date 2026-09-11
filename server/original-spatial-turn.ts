import type {AdapterResult,StoryCartridge,StorySave} from '../src/vendor/original-train/types'
import type {ExecutedStoryTurn,StoryTurnGenerator} from '../src/vendor/original-train/engine/executeTurn'
import {resolveDomainAction,domainDemoContent} from '../src/vendor/original-train/engine/domainRules'
import {parseStoryProtocol} from '../src/vendor/original-train/engine/protocol'
import {applyParsedScene} from '../src/vendor/original-train/engine/reducer'

/** Spatial chapters own the encounter schedule. The text cartridge's automatic
 * danger director has no entity/map binding, so it must not inject unrelated
 * threats or fallback costs into a registered maintenance/route action.
 * Keep the full cartridge for explicit encounter commands and domain danger
 * effects (including the switch key); the frozen reducer remains authoritative.
 */
export async function executeOriginalSpatialTurn(options:{save:StorySave;cartridge:StoryCartridge;action:string;generator:StoryTurnGenerator}):Promise<ExecutedStoryTurn>{
 const {save,cartridge,generator}=options,action=options.action.trim()
 const domainResolution=resolveDomainAction(save,cartridge,action)
 if(!domainResolution)throw Error('ORIGINAL_SPATIAL_ACTION_UNBOUND')
 let result:AdapterResult
 try{result=await generator.send(action,{cartridge,save,actionId:action,locale:cartridge.locale,domainResolution,dangerDirective:undefined})}
 catch{result={content:domainDemoContent(domainResolution)}}
 return {save:applyParsedScene(save,parseStoryProtocol(result.content,cartridge.locale),cartridge,action,result.imagePrompt,result.imageSubject,undefined,domainResolution),source:'domain'}
}
