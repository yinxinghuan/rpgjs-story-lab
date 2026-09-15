import {oldStreetLetterGuidance} from './old-street-letter-guidance'
import type {StorySave,StoryBlock} from './vendor/original-train/types'
import {oldStreetPerson} from './old-street-characters'

export function oldStreetConversation(save:StorySave,speakerId:string){
 const pairs=new Map<string,{input?:string;reply?:string}>()
 for(const b of save.blocks){const d=b.data;if(b.kind!=='dialogue'||d?.oldStreetSpeakerId!==speakerId||typeof d.oldStreetConversationId!=='string')continue
  const pair=pairs.get(d.oldStreetConversationId)??{}
  if(d.oldStreetRole==='player')pair.input=b.text
  if(d.oldStreetRole==='reply')pair.reply=b.text
  pairs.set(d.oldStreetConversationId,pair)
 }
 return [...pairs.values()].filter((p):p is {input:string;reply:string}=>!!p.input&&!!p.reply).slice(-4)
}
export function oldStreetTalkTopics(save:StorySave,entity:string){
 const p=oldStreetPerson(entity),zh=save.locale==='zh',f=save.facts
 if(!p||!save.characters.some(c=>c.id===p.id))return []
 const topic=(id:string,z:string,e:string,zr:string,er:string)=>({id,text:zh?z:e,reply:zh?zr:er})
 const route=entity==='watchmaker'
  ?{id:'letter',text:zh?'信在哪里？':'Where is the letter?',reply:oldStreetLetterGuidance(save)}
  :entity==='laundry-owner'
  ?topic('steps','院里的台阶怎么过去？','How do I reach the courtyard steps?',f['crates-cleared']?'旧箱已经移到墙边，台阶可以走了。':f['trolley-borrowed']?'你已经借了推车，把台阶前的旧箱搬开就行。':'旁边有推车可以借，把挡路的旧箱搬到墙边就能过去。',f['crates-cleared']?'The crates are by the wall now; the steps are clear.':f['trolley-borrowed']?'Use the trolley you borrowed to move the crates.':'Borrow the trolley beside me and move the crates to the wall.')
  :topic('roof','这座楼梯通到哪里？','Where do these stairs lead?','楼梯通向屋顶。穿过屋顶，从另一头下去就是河边工作棚。','Up to the roof. Cross it and take the far stairs down to the riverside workshop.')
 const personal=entity==='watchmaker'
  ?topic('clock','那口旧钟是谁的？','Whose old clock is that?',f['clock-returned']?'是洗衣店的钟，你已经送还给店主了。':f['clock-taken']?'你带着的就是洗衣店的钟，送回去交给店主就好。':'是洗衣店的钟。修好了，可以替我送还给店主。',f['clock-returned']?'It belongs to the laundry. You have returned it.':f['clock-taken']?'The clock you are carrying belongs to the laundry. Take it to the owner.':'It belongs to the laundry. It is repaired; you can take it back to the owner.')
  :entity==='laundry-owner'
  ?topic('clock','能说说那口旧钟吗？','Could you tell me about the old clock?',f['clock-returned']?'那是母亲留下的钟。谢谢你送回来。要记录它的来历，可以先问我。':'那口钟送去修了，我还在等它回来。',f['clock-returned']?'It was my mother’s clock. Thank you for returning it. Ask me before recording its history.':'It is away for repairs. I am waiting for it to come back.')
  :topic('photos','你在找什么照片？','Which photographs are you looking for?',f['photos-returned']?'你送回来的照片已经收好了。要留下其中一张，可以让我来选。':'我在找一份旧照片夹。上面有照相馆的标记，找到后可以拿到放大台上比对。',f['photos-returned']?'Your returned photographs are safely stored. Let me choose one if you want to share it.':'An old folder marked with this studio’s stamp. Bring it to the viewing table to compare the photographs.')
 const helped=(axis:string)=>save.relationships.some(r=>r.characterId===p.id&&r.axis===axis&&r.delta>0)
 const carrying=(id:string)=>save.inventory.some(i=>i.id===id&&i.count>0)
 const afterHelp=entity==='watchmaker'&&helped('kept-promise')&&!carrying('letter-key')&&!f['key-borrowed']
  ?topic('kept-promise','下次还能来找你吗？','May I come by again?','钥匙说还就还，这点让我放心。下次有东西要修，来叫我就好。','You brought the key back as promised. I appreciate that. If you need something repaired, come and find me.')
  :entity==='laundry-owner'&&helped('returned-family-clock')&&f['clock-returned']
  ?topic('returned-clock','钟摆回来以后呢？','How is it having the clock back?','听见它走，我总算不用老回头看那块空地方了。谢谢你特意跑这一趟。','Hearing it tick, I can stop looking back at that empty spot. Thank you for making the trip.')
  :entity==='photographer'&&helped('returned-photographs')&&f['photos-returned']
  ?topic('returned-photos','照片都收好了吗？','Are the photographs safe now?','都收好了。你肯一张张比对，再把它们送回来，我很感激。','They are safely put away. I appreciate you taking the time to match them and bring them back.')
  :null
 return [route,personal,...(afterHelp?[afterHelp]:[])]
}
const memory=/(?:记得|回忆|我刚才说)|\b(?:remember|recall)\b/i
export function oldStreetAuthoredTalkReply(save:StorySave,entity:string,input:string):string|null{
 const p=oldStreetPerson(entity),zh=save.locale==='zh'
 if(!p||!save.characters.some(c=>c.id===p.id))throw Error('OLD_STREET_DIALOGUE_INTRODUCTION_REQUIRED')
 const topic=oldStreetTalkTopics(save,entity).find(t=>t.text===input.trim());if(topic)return topic.reply
 if(memory.test(input)){const prior=oldStreetConversation(save,p.id).filter(t=>!memory.test(t.input)).at(-1)
  return prior?(zh?`你刚才对我说：“${prior.input}”`:`Earlier you told me: “${prior.input}”`):(zh?'我们还没有聊过别的事。':'We have not talked about anything else yet.')}
 if(/担心|害怕|紧张|\b(?:worried|afraid|nervous)\b/i.test(input))return zh?'我听见你的担心了。这里不催你，慢慢来。':'I hear your concern. There is no need to rush here.'
 return null
}
export function oldStreetTalkReply(save:StorySave,entity:string,input:string){return oldStreetAuthoredTalkReply(save,entity,input)??(save.locale==='zh'?'这件事我不清楚。你可以问问我这里的路，或者手边的东西。':'I do not know about that. You can ask me about the way around here or the things nearby.')}
export function oldStreetTalkBlocks(save:StorySave,entity:string,id:string,input:string,reply:string):StoryBlock[]{
 const p=oldStreetPerson(entity)!,person=save.characters.find(c=>c.id===p.id)!
 const data={oldStreetSpeakerId:p.id,oldStreetConversationId:id}
 return [{id:id+':player',kind:'dialogue',speaker:save.locale==='zh'?'你':'You',text:input,data:{...data,oldStreetRole:'player'}},{id:id+':reply',kind:'dialogue',speaker:person.name,text:reply,data:{...data,oldStreetRole:'reply'}}]
}
