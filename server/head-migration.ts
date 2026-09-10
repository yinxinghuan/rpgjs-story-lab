import {cartridge,upgradePowerFacts,journeyObjective} from '../src/story'
import {upgradeAttendantFacts} from '../src/attendant'
import {upgradeContactFacts} from '../src/contacts'
import {MAP_VERSION,currentScene,safePosition} from '../src/contract'
import type {Head} from '../src/journey-runtime'
// Shared by local SQLite and production authority; preserves narrative and inventory.
export function upgradeHead(h:Head):Head{
 if(h.mapVersion!==MAP_VERSION){
  for(const node of cartridge(h.save.locale).initialMap??[])if(!h.save.map.some(m=>m.id===node.id))h.save.map.push({...node,current:false})
  for(const key of ['supply_open','battery_taken','record_read','battery_installed','rescue_sent'])h.save.facts[key]??=false
  h.position=safePosition(['carriage-ortho-1','carriage-ortho-2','carriage-narrow-1','train-scenes-1','train-scenes-2'].includes(h.mapVersion)?h.position:null,currentScene(h.save))
  h.mapVersion=MAP_VERSION
  if(h.save.facts.finished)h.save.objective=journeyObjective(h.save)
 }
 if(upgradePowerFacts(h.save)&&h.save.facts.finished&&!h.save.facts.rescue_sent)h.save.objective=journeyObjective(h.save)
 upgradeContactFacts(h.save);upgradeAttendantFacts(h.save)
 return h
}
