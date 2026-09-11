import {chatModel,type ModelRequest} from './model'
import {createOriginalActionInterpreter} from './original-action-interpreter'
import {createOriginalDialogueGenerator} from './original-dialogue'
import {LabError} from '../src/journey-runtime'
/** Explicit per-process synthetic trial budget. Only the loopback plugin imports
 * this adapter; production does not acquire an original provider by default. */
export function originalPreflightModels(raw:string|undefined,request:ModelRequest=chatModel,usedAtStart=0){
 if(raw===undefined||raw===''||raw==='0')return undefined
 if(!/^(?:[2-9]|1[0-2])$/.test(raw))throw Error('INVALID_ORIGINAL_PREFLIGHT_MODEL_BUDGET')
 const limit=Number(raw);if(!Number.isSafeInteger(usedAtStart)||usedAtStart<0||usedAtStart>limit)throw Error('INVALID_ORIGINAL_PREFLIGHT_MODEL_USAGE');let used=usedAtStart
 const bounded:ModelRequest=async(system,user,options)=>{
  if(used>=limit)throw new LabError('ORIGINAL_MODEL_TEST_BUDGET_EXHAUSTED',409)
  if(options?.signal.aborted)throw Error('ORIGINAL_MODEL_ABORTED')
  used++
  return request(system,user,options)
 }
 return {interpreter:createOriginalActionInterpreter(bounded),dialogue:createOriginalDialogueGenerator(bounded),available:()=>used+2<=limit,usage:()=>({used,limit})}
}
