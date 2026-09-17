import type {OldStreetHead} from './old-street-head'
import type {StorySave} from './vendor/original-train/types'
import {oldStreetPerson} from './old-street-characters'

export type EvidenceKind='photo-shown'|'photo-described'|'archive-account'|'field-note'
export type SharedEvidence={kind:EvidenceKind;text:string}
export function sharedEvidence(save:StorySave,entity:string):SharedEvidence[]{
 const person=oldStreetPerson(entity)
 if(!person||!save.characters.some(c=>c.id===person.id))return []
 return save.blocks.filter(b=>b.data?.evidenceRecipient===person.id&&typeof b.data.evidenceText==='string'&&['photo-shown','photo-described','archive-account','field-note'].includes(String(b.data.evidenceKind)))
  .map(b=>({kind:b.data!.evidenceKind as EvidenceKind,text:String(b.data!.evidenceText)}))
}
export function evidenceChoices(h:OldStreetHead,entity:string){
 const person=oldStreetPerson(entity),t=(zh:string,en:string)=>h.save.locale==='zh'?zh:en
 if(!person||h.sceneId!==person.room||!h.save.characters.some(c=>c.id===person.id)||h.save.facts.departed)return []
 const known=sharedEvidence(h.save,entity),has=(kind:EvidenceKind)=>known.some(e=>e.kind===kind)
 const choices:Array<{id:string;kind:EvidenceKind;label:string;text:string}>=[]
 const photo=h.save.facts['darkroom-photo-discovery']
 if(typeof photo==='string'&&typeof h.save.facts['darkroom-photo-matched']==='string'){
  if(!has('photo-shown')&&h.save.inventory.some(i=>i.id==='darkroom-print'&&i.count>0))choices.push({id:'evidence:show-photo',kind:'photo-shown',label:t('给你看我拼好的旧照','Show the photograph I pieced together'),text:photo})
  if(!has('photo-shown')&&!has('photo-described'))choices.push({id:'evidence:describe-photo',kind:'photo-described',label:t('说说我在旧照里的发现','Describe what I found in the photograph'),text:photo})
 }
 if(h.campaign?.archive?.order&&!has('archive-account'))choices.push({id:'evidence:share-account',kind:'archive-account',label:t('告诉你我查清的记录','Share the account I reconstructed'),text:h.campaign.archive.content.discovery})
 if(h.campaign?.field?.observed&&!has('field-note'))choices.push({id:'evidence:share-note',kind:'field-note',label:t('说说补充便笺里的发现','Share what the supplementary note revealed'),text:h.campaign.field.content.finding})
 return choices
}
export function sharedEvidenceKnowledge(save:StorySave,entity:string){
 const shown=sharedEvidence(save,entity).some(e=>e.kind==='photo-shown'),zh=save.locale==='zh'
 return sharedEvidence(save,entity).filter(e=>!shown||e.kind!=='photo-described').map(e=>({id:'received:'+e.kind,text:
  (e.kind==='photo-shown'?(zh?'玩家曾在你面前出示拼好的照片，你能看见：':'The player showed you the completed photograph. You could see: '):e.kind==='photo-described'?(zh?'玩家曾向你转述照片里的发现；你没有看过照片原图：':'The player described a finding in a photograph; you have not seen the print: '):e.kind==='field-note'?(zh?'玩家曾向你转述补充便笺里的发现，你没有亲眼读过原件：':'The player told you what a supplementary note said; you have not read the original: '):(zh?'玩家曾告诉你以下档案调查结果；这是对方查明后分享的内容，不代表你亲历事件：':'The player shared this reconstructed archive account with you; it does not mean you witnessed the events: '))+e.text}))
}
export function evidenceRecallTopics(save:StorySave,entity:string){
 const zh=save.locale==='zh',entries=sharedEvidence(save,entity),shown=entries.find(e=>e.kind==='photo-shown'),described=entries.find(e=>e.kind==='photo-described'),account=entries.find(e=>e.kind==='archive-account'),note=entries.find(e=>e.kind==='field-note'),photo=shown??described
 return [
  ...(note?[{id:'shared-note',text:zh?'还记得那张补充便笺吗？':'Do you remember the supplementary note?',reply:(zh?'记得，你告诉我便笺里写着：':'Yes. You told me the note said: ')+note.text}]:[]),
  ...(photo?[{id:'shared-photo',text:zh?'还记得我们聊的旧照吗？':'Do you remember the photograph we discussed?',reply:(shown?(zh?'记得，你给我看过那张照片。':'Yes, you showed me the print. '):(zh?'记得，你讲过里面的发现，不过我还没看过原图。':'Yes, you described your discovery, though I have not seen the print. '))+photo.text}]:[]),
  ...(account?[{id:'shared-account',text:zh?'我告诉你的记录，你还记得吗？':'Do you remember the account I shared?',reply:(zh?'记得，你查清后告诉我：':'Yes. After checking the records, you told me: ')+account.text}]:[]),
 ]
}
