import type {StorySave} from './vendor/original-train/types'
import {oldStreetDialoguePages} from './old-street-dialogue-pages'
export type EndingBeat={id:string;label:string;text:string;art:'street'|'clock'|'photo'|'journey-photo'}
/** Only the committed ending is staged. No new consequences, model calls or save writes. */
export function oldStreetEndingReel(save:StorySave):EndingBeat[]{
 const ending=save.finale.status==='complete'?save.finale.ending:undefined
 if(!ending||save.facts.departed!==true)return []
 const zh=save.locale==='zh',rows=[
  ...ending.preserved.map(text=>({label:ending.title,text})),
  ...ending.characterEpilogues.filter(e=>save.characters.some(c=>c.id===e.characterId)).map(e=>({label:save.characters.find(c=>c.id===e.characterId)!.name,text:e.text})),
  ...ending.unresolved.map(text=>({label:zh?'尚未落定':'Still unfinished',text})),
 ]
 return rows.flatMap((row,i)=>oldStreetDialoguePages([{id:'ending-'+i,kind:'narration',text:row.text}],save.locale).map(page=>({id:page.id,label:row.label,text:page.text,
  art:((typeof save.facts['darkroom-photo-matched']==='string'&&(row.text===save.facts['darkroom-photo-discovery']||/暗房|darkroom/i.test(row.text)))?'journey-photo':(/钟|clock/i.test(row.text)&&save.facts['clock-returned']===true)?'clock':(/照片|photograph|photo folder/i.test(row.text)&&save.facts['photos-returned']===true&&!/暗房|darkroom/i.test(row.text))?'photo':'street') as EndingBeat['art']})))
}
