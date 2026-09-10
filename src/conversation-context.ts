import type {StorySave} from './vendor/story/types'
import type {EntityId} from './contract'
export function speakingCharacter(save:StorySave,target:EntityId):string|null{
 const id=(target==='radio'||target==='callpoint'&&save.facts.access_cleared)&&save.facts.dispatcher_introduced&&save.facts.signal_acknowledged&&save.facts.battery_installed?'xu-lan':target==='lin'&&save.facts.introduced?'lin':target==='zhou-yu'&&save.facts.attendant_introduced?'zhou-yu':null
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
export function tagConversationTurn(base:StorySave,next:StorySave,target:EntityId,meta?:{inputKind:'action'|'free-input';resultKind:string}){
 const speakerId=speakingCharacter(next,target)
 if(!speakerId)return
 for(let i=base.blocks.length;i<next.blocks.length;i++){
  const b=next.blocks[i]
  const role=b.id===`action-${next.scene}`?'player':b.kind==='narration'?'reply':null
  if(role)b.data={...b.data,spatialTarget:target,spatialSpeakerId:speakerId,spatialTurn:next.scene,spatialRole:role,...(meta?{spatialInputKind:meta.inputKind,spatialResultKind:meta.resultKind}:{})}
 }
}

export function isRecollectionRequest(input:string){
 if(/(?:不要|不用|别|不必).{0,4}(?:记得|回忆)|\b(?:don't|do not)\s+(?:remember|recall)/i.test(input))return false
 return /你(?:还)?记得|回忆(?:一下|刚才|之前|最初)|我(?:之前|刚才|最早|最初).{0,12}说过|\b(?:do you (?:still )?remember|can you recall|what (?:did|have) i (?:say|said|tell|told))/i.test(input)
}
function recallTopics(input:string){
 const normalized=input.toLowerCase().replace(/担心|害怕|worried|worries|worry|afraid|fear/g,' concern ')
 const clean=normalized.replace(/你还记得|你记得|回忆一下|回忆|我之前|我刚才|我最早|我最初|之前|刚才|最初|最早|后来|当时|说过|说了|什么|怎么|吗|一下|\b(?:do|you|still|remember|can|recall|what|did|have|i|say|said|tell|told|about|was|the|earlier|first|originally|before|me|my)\b/gi,' ')
 return new Set([...(clean.match(/[a-z]{3,}/g)??[]),...(clean.match(/[\u4e00-\u9fff]+/g)??[]).flatMap(s=>Array.from({length:Math.max(0,s.length-1)},(_,i)=>s.slice(i,i+2)))])
}
/** Extract exact prior player statements. No summary, identity inference or
 * additional model history. Legacy ambiguous tags and mechanical actions stay out. */
export function recalledStatements(save:StorySave,target:EntityId,input:string){
 const speakerId=speakingCharacter(save,target)
 if(!speakerId||!isRecollectionRequest(input))return []
 const topics=recallTopics(input),oldest=/最初|最早|\bfirst\b|originally/i.test(input)
 const replies=new Set(save.blocks.filter(b=>b.kind==='narration'&&b.data?.spatialSpeakerId===speakerId&&b.data?.spatialRole==='reply').map(b=>b.data!.spatialTurn))
 const seen=new Set<number>()
 const candidates=save.blocks.flatMap(b=>{
  const d=b.data,turn=Number(d?.spatialTurn)
  if(d?.spatialSpeakerId!==speakerId||d.spatialRole!=='player'||d.spatialInputKind!=='free-input'||d.spatialResultKind!=='dialogue'||!Number.isSafeInteger(turn)||turn<1||turn>save.scene||!replies.has(turn)||seen.has(turn)||!b.text.trim()||b.text.length>220||isRecollectionRequest(b.text))return []
  seen.add(turn)
  const words=recallTopics(b.text),score=[...topics].filter(t=>words.has(t)).length
  if(topics.size&&score===0)return []
  return [{turn,blockId:b.id,input:b.text,score}]
 }).sort((a,b)=>b.score-a.score||(oldest?a.turn-b.turn:b.turn-a.turn))
 return candidates.slice(0,2).sort((a,b)=>a.turn-b.turn).map(({score,...record})=>record)
}
