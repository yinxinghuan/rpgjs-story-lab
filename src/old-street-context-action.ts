import type {StorySave} from './vendor/original-train/types'
import {oldStreetCartridge} from './old-street-cartridge'
import {oldStreetPerson} from './old-street-characters'
import {resolveDomainAction} from './vendor/original-train/engine/domainRules'
type Entity={id:string;actions:readonly string[]}
export function oldStreetContextAction(save:StorySave,entity:Entity){
 const person=oldStreetPerson(entity.id),known=Boolean(person&&save.characters.some(c=>c.id===person.id))
 const cartridge=oldStreetCartridge(save.locale)
 const results=entity.actions.map(id=>({id,result:resolveDomainAction(save,cartridge,id)}))
 const actions=results.filter(({id,result})=>result?.status==='accepted'&&!(known&&id.startsWith('oldstreet:greet-'))).map(r=>r.id)
 // Returning a borrowed key before opening the letter remains possible, but is
 // not the suggested first action. Do not immediately offer to borrow it again.
 const offered=actions.filter(id=>!(id==='oldstreet:borrow-key'&&save.facts['letter-unlocked']))
 const priority=(id:string)=>id.startsWith('oldstreet:greet-')?0:['oldstreet:return-clock','oldstreet:return-photos','oldstreet:return-trolley','oldstreet:return-roof-negative','oldstreet:read-photo-index','oldstreet:lay-roof-plank'].includes(id)?1:id==='oldstreet:return-key'?(save.facts['letter-unlocked']?1:5):2
 offered.sort((a,b)=>priority(a)-priority(b))
 const next=offered[0]
 const reasons=[...new Set(results.filter(r=>r.result?.status!=='accepted').flatMap(r=>r.result?.reasons??[]))]
 // An exhausted pickup is still a visible object. Keep its observation useful
 // without inventing receipt contents or implying another item can be taken.
 const observation=!next&&entity.id==='drawer'&&save.facts['lens-taken']===true
  ?(save.locale==='zh'?'抽屉里还留着收据，放大镜已经拿走了。':'The receipt remains in the drawer; the magnifying glass has been taken.')
  :!next&&entity.id==='letter-compartment'&&save.facts['letter-taken']===true
   ?(save.locale==='zh'?'小格敞开着，密封信已经收进了你的行囊。':'The compartment is open; the sealed letter is already in your bag.')
   :undefined
 return {actions:offered,primary:next?{kind:'action' as const,id:next}:known?{kind:'talk' as const}:{kind:'inspect' as const},reason:observation??reasons[0]??(save.locale==='zh'?'这里暂时没有别的可做的事。':'There is nothing else to do here for now.')}
}
