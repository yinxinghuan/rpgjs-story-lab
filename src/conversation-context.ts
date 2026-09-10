import type {StorySave} from './vendor/story/types'
import type {EntityId} from './contract'
export function speakingCharacter(save:StorySave,target:EntityId):string|null{
 const id=target==='radio'&&save.facts.dispatcher_introduced&&save.facts.signal_acknowledged&&save.facts.battery_installed?'xu-lan':target==='lin'&&save.facts.introduced?'lin':target==='zhou-yu'&&save.facts.attendant_introduced?'zhou-yu':null
 return id&&save.characters.some(person=>person.id===id)?id:null
}
/** Recent dialogue is data, never instructions or a source of mechanical effects.
 * Older untagged logs are not guessed into a speaker's memory. */
export function recentConversation(save:StorySave,target:EntityId,maxTurns=4){
 if(!Number.isSafeInteger(maxTurns)||maxTurns<0||maxTurns>6)throw new Error('INVALID_HISTORY_LIMIT')
 const speakerId=speakingCharacter(save,target)
 if(!speakerId||maxTurns===0)return []
 const turns=new Map<number,{turn:number;input:string;reply:string}>()
 for(const block of save.blocks){
  const d=block.data
  if(d?.spatialSpeakerId!==speakerId||!Number.isSafeInteger(d?.spatialTurn))continue
  const turn=Number(d.spatialTurn)
  const entry=turns.get(turn)??{turn,input:'',reply:''}
  if(d.spatialRole==='player')entry.input=block.text.slice(0,500)
  if(d.spatialRole==='reply'&&block.kind==='narration')entry.reply=(entry.reply+' '+block.text).trim().slice(0,700)
  turns.set(turn,entry)
 }
 return [...turns.values()].filter(t=>t.input&&t.reply).slice(-maxTurns)
}
export function tagConversationTurn(base:StorySave,next:StorySave,target:EntityId){
 const speakerId=speakingCharacter(next,target)
 if(!speakerId)return
 for(let i=base.blocks.length;i<next.blocks.length;i++){
  const b=next.blocks[i]
  const role=b.id===`action-${next.scene}`?'player':b.kind==='narration'?'reply':null
  if(role)b.data={...b.data,spatialTarget:target,spatialSpeakerId:speakerId,spatialTurn:next.scene,spatialRole:role}
 }
}
