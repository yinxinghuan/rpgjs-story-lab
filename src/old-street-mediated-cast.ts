import type {StorySave,StoryCharacter} from './vendor/original-train/types'
export type JournalCastSnapshot=Pick<StorySave,'facts'>&Partial<Pick<StorySave,'characters'|'blocks'>>
const media=new Set(['record-book','photo-folder','archive-index','archive-ledger'])
/** A generated portrait is not a physical NPC. Its visible introduction must have
 * a persisted link to an existing letter/record surface before spatial admission. */
export function oldStreetMediatedCast(save:JournalCastSnapshot){
 return (save.characters??[]).filter(c=>c.origin==='generated').map(c=>{
  let link:{entity?:string;introduction?:string}
  try{link=JSON.parse(String(save.facts['journal-person:'+c.id]??''))}catch{throw Error('JOURNAL_PERSON_NOT_INTRODUCED')}
  const intro=save.blocks?.find(b=>b.id===link.introduction&&b.data?.characterId===c.id&&b.kind==='narration')
  if(!link.entity||!media.has(link.entity)||!intro||!intro.text.includes(c.name)||!c.detail?.trim())throw Error('JOURNAL_PERSON_NOT_INTRODUCED')
  return {character:c,entity:link.entity}
 })
}
/** Called only by a trusted content adapter in its authoritative story commit. */
export function introduceJournalPerson(save:StorySave,person:StoryCharacter,entity:string,introduction:{id:string;text:string}){
 if(person.origin!=='generated'||person.status!=='known'||!person.detail?.trim()||!media.has(entity)||!introduction.text.includes(person.name)||save.characters.some(c=>c.id===person.id)||save.blocks.some(b=>b.id===introduction.id))throw Error('JOURNAL_PERSON_NOT_ELIGIBLE')
 save.blocks.push({id:introduction.id,kind:'narration',text:introduction.text,data:{characterId:person.id}})
 save.characters.push(structuredClone(person))
 save.facts['journal-person:'+person.id]=JSON.stringify({entity,introduction:introduction.id})
}
