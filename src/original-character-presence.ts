import type {StorySave} from './vendor/original-train/types'
/** Knowing a character does not make them travel. Initial visible cast may
 * lack a location in source v8; that exception applies only at the opening. */
export function originalCharacterPresent(save:StorySave,id:string){
 const person=save.characters.find(c=>c.id===id)
 if(!person||person.status==='departed')return false
 if(person.status==='companion'&&save.partyMemberIds.includes(id))return true
 const place=save.map.find(n=>n.current)
 if(person.lastKnownLocation)return [save.location,place?.id,place?.label].includes(person.lastKnownLocation)
 return person.origin==='cartridge'&&!person.hiddenUntilIntroduced&&person.updatedAtScene===0&&place?.id==='dead-station'
}
