import {isRelayOffer} from './relay-content'
import {entities,type EntityId} from './contract'
import {portalArrivals} from './scene-layout'
import {cartridge,type StorySave} from './story'
import {resolveStoryActionById} from './story-domain-action'
import type {SceneReadiness} from './scene-readiness'

/** Prepare possible admitted destinations before SessionClient creates a pending
 * envelope. This is a client availability gate, never action authorization. */
export async function prepareSceneAction(readiness:SceneReadiness,save:StorySave,target:EntityId,action?:string,retry=false){
 const candidates=action?[action]:entities[target].actions
 const destinations=new Set<string>()
 for(const id of candidates){
  if(isRelayOffer(id)&&(entities[target].actions as readonly string[]).includes(id)&&resolveStoryActionById(save,cartridge(save.locale,save),id).status==='accepted'){destinations.add('carriage');destinations.add('baggage')}
  const portal=portalArrivals[id]
  if(portal&&(entities[target].actions as readonly string[]).includes(id)&&resolveStoryActionById(save,cartridge(save.locale,save),id).status==='accepted')destinations.add(portal.scene)
 }
 for(const id of destinations)await readiness.prepare(id,retry)
}
