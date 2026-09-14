import type {StorySave,StoryBlock} from './vendor/original-train/types'
import {originalCharacterPresent} from './original-character-presence'

export type OriginalConversationTurn={id:string;input:string;reply:string}
/** Only explicitly paired conversations belong to a character's memory.
 * Source actions and legacy untagged prose cannot become private dialogue. */
export function originalConversation(save:StorySave,speakerId:string,limit=4):OriginalConversationTurn[]{
 if(!Number.isSafeInteger(limit)||limit<0||limit>4)throw Error('INVALID_HISTORY_LIMIT')
 if(!limit||!originalCharacterPresent(save,speakerId))return []
 const turns=new Map<string,Partial<OriginalConversationTurn>>()
 for(const b of save.blocks){
  const d=b.data,id=d?.originalConversationId
  if(b.kind!=='dialogue'||d?.originalSpeakerId!==speakerId||typeof id!=='string')continue
  const turn=turns.get(id)??{id}
  if(d.originalRole==='player')turn.input=b.text.slice(0,500)
  if(d.originalRole==='reply')turn.reply=b.text.slice(0,900)
  turns.set(id,turn)
 }
 return [...turns.values()].filter((t):t is OriginalConversationTurn=>Boolean(t.id&&t.input&&t.reply)).slice(-limit)
}
export function originalConversationBlocks(save:StorySave,speakerId:string,id:string,input:string,reply:string):StoryBlock[]{
 const person=save.characters.find(p=>p.id===speakerId)
 if(!person||!originalCharacterPresent(save,speakerId))throw Error('CHARACTER_NOT_PRESENT')
 const data={originalConversationId:id,originalSpeakerId:speakerId}
 return [{id:`conversation-${id}-player`,kind:'dialogue',speaker:save.locale==='zh'?'你':'You',text:input,data:{...data,originalRole:'player'}},
  {id:`conversation-${id}-reply`,kind:'dialogue',speaker:person.name,text:reply,data:{...data,originalRole:'reply'}}]
}

/** A recorded reply is not a fresh statement after a later story action.
 * Keep the pair in history, but do not present it as the current conversation. */
export function originalCurrentConversation(save:StorySave,speakerId:string):OriginalConversationTurn|undefined{
 const last=originalConversation(save,speakerId,1)[0]
 if(!last)return undefined
 let index=-1
 for(let i=save.blocks.length-1;i>=0;i--){const b=save.blocks[i];if(b.kind==='dialogue'&&b.data?.originalConversationId===last.id&&b.data?.originalRole==='reply'){index=i;break}}
 if(index<0||save.blocks.slice(index+1).some(b=>b.kind!=='dialogue'))return undefined
 return last
}
