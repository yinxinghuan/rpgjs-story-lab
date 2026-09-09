import type {Locale} from './story'
import {attendantIntro} from './attendant'
import {dispatcherIntro} from './contacts'

export function dialoguePages(text:string,locale:Locale):string[]{
 const intro=[dispatcherIntro(locale),attendantIntro(locale)].find(value=>text.startsWith(value))
 const split=(value:string)=>value.match(locale==='zh'?/.{1,44}(?:[，。！？][”」]?|$)|.{1,44}/gs:/.{1,110}(?:[ .!?][”"]?|$)|.{1,110}/gs)??[]
 // A short first introduction is one reading beat, before contact actions appear.
 const pages=intro?[intro,...split(text.slice(intro.length).trim())]:split(text)
 return pages.length?pages:['']
}
