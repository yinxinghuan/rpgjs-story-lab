import {readFileSync} from 'node:fs'
import {isDeepStrictEqual} from 'node:util'
import type {OldStreetCampaignGenerator} from '../server/old-street-campaign-planner'
import {compileExpansionPlan} from '../src/old-street-expansion-plan'
import type {OldStreetExpansionRequest} from '../src/old-street-expansion'
const sample=JSON.parse(readFileSync('doc/campaign-live-20260917/archive-photo-2.json','utf8')).runs[0]
/** Synthetic archive uses the exact history sent in the recorded real model probe. */
export const photoCampaignFixture:OldStreetCampaignGenerator=async context=>{
 if(context.locale!=='en')throw Error('ENGLISH_QA_FIXTURE_ONLY')
 if(context.stage==='trace')return {title:'Filing records',clue:{mark:'two notches',wrapping:'linen cord'},records:[{label:sample.source.title,mark:'two notches',wrapping:'linen cord'},{label:'Roof repairs',mark:'one notch',wrapping:'linen cord'},{label:'Workshop repairs',mark:'two notches',wrapping:'folded flap'}]}
 if(context.stage==='parcel')return {title:'A note from the footbridge',fragment:'The packet mentions three replacement boards on the footbridge. The two work records contain the order of events.'}
 return {title:sample.source.title,layout:'east-index',cards:sample.source.events.map((label:string,i:number)=>({id:['a','b','c','d'][i],label})),sources:{index:[{before:'a',after:'b'},{before:'c',after:'d'}],ledger:[{before:'b',after:'c'}]},discovery:sample.source.account}
}
export async function photoPlanReplay(intent:OldStreetExpansionRequest,locale:'zh'|'en',signal:AbortSignal){
 signal.throwIfAborted()
 const source=intent.archiveSource
 if(!source||locale!=='en'||!isDeepStrictEqual({...source,archiveId:sample.source.archiveId},sample.source))throw Error('PHOTO_REPLAY_CONTEXT_MISMATCH')
 const {title,discovery,photograph}=sample.plan.content
 return compileExpansionPlan(intent,{title,discovery,photograph},locale)
}
