import {evidenceChoices} from '../src/old-street-shared-evidence'
import {oldStreetPerson} from '../src/old-street-characters'
import {oldStreetTalkBlocks} from '../src/old-street-conversation'
import {bindOldStreet} from '../src/old-street-space'
import type {OldStreetHead} from '../src/old-street-head'
import {LabError} from '../src/journey-runtime'

export function prepareEvidenceShare(h:OldStreetHead,target:string,id:string,receipt:string,position:OldStreetHead['position']){
 const choice=evidenceChoices(h,target).find(c=>c.id===id)
 if(!choice||!bindOldStreet(h.save.locale,h.save).canInteract(target,h.sceneId,position))throw new LabError('OLD_STREET_ACTION_UNAVAILABLE',409)
 const save=structuredClone(h.save),person=oldStreetPerson(target)!,zh=save.locale==='zh'
 const t=(cn:string,en:string)=>zh?cn:en
 const text=choice.kind==='photo-shown'
  ?target==='photographer'?t('让我看看……这次终于能对着照片聊了。谢谢你特意带来。','Let me see… now we can look at the photograph together. Thank you for bringing it.'):
   t('原来照片里是这个样子。谢谢你带来给我看。','So that is what the photograph looks like. Thank you for showing me.')
  :choice.kind==='photo-described'?t('原来你在照片里发现了这些。我记住了，有机会也想看看。','So that is what you found in the photograph. I will remember it. I would like to see it sometime.'):
   choice.kind==='field-note'?t('这张便笺让那件事有了另一面。谢谢你回来告诉我。','That note adds another side to the story. Thank you for coming back to tell me.'):
   t('原来是这样。你把这些零散的记录串起来了，谢谢你回来告诉我。','I see. You have pieced those scattered records together. Thank you for coming back to tell me.')
 const blocks=oldStreetTalkBlocks(save,target,receipt,choice.label+': '+choice.text,text)
 blocks[0].data={...blocks[0].data,evidenceRecipient:person.id,evidenceKind:choice.kind,evidenceText:choice.text}
 save.blocks.push(...blocks)
 return {head:{...h,version:h.version+1,position,save},kind:'shared-evidence',accepted:true,speakerId:person.id,text}
}
