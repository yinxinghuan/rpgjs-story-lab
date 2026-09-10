// Explicit loopback fixture: execute authored actions, never edit completion facts.
import {randomUUID} from 'node:crypto'
import {actionTarget,currentScene} from '../src/contract'
import {approachPoints} from '../src/scene-layout'
import type {Head} from '../src/journey-runtime'
import {RUNTIME_HEADER,RUNTIME_CONTRACT} from '../src/runtime-contract'
export async function completePreflightJourney(object:{fetch(request:Request):Promise<Response>},owner:string,head:Head){
 const actions=['open-cabinet','take-fuse','meet-lin','repair','leave','open-supply','take-battery','read-record','enter-cab','install-battery','route-radio','send-signal','begin-reception','back-baggage','meet-attendant','check-aisle','read-arrival-code','back-carriage','check-circuit','go-baggage','enter-cab','confirm-arrival','back-baggage','back-carriage','complete-handover','go-baggage','enter-cab','receive-clearance','back-baggage','back-carriage','release-guidance','enter-walkway','report-safe-arrival']
 for(const action of actions){
  const target=actionTarget[action]
  const r=await object.fetch(new Request('http://localhost/api/lab/sessions/'+head.id+'/actions',{method:'POST',headers:{'Content-Type':'application/json','X-Authority-Owner':owner,[RUNTIME_HEADER]:RUNTIME_CONTRACT},body:JSON.stringify({action_id:randomUUID(),expected_version:head.version,sceneId:currentScene(head.save),position:approachPoints[target],target,type:'action',action})}))
  const value=await r.json() as any
  if(!r.ok||!value.accepted)throw Error('PREFLIGHT_FIXTURE_ACTION_FAILED: '+action)
  head=value.head
 }
 if(!head.save.facts.journey_complete)throw Error('PREFLIGHT_FIXTURE_INCOMPLETE')
 return head
}
