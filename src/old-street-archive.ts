/** A generated investigation uses existing furniture and explicit ordering
 * evidence. The model never supplies executable rules or a trusted answer. */
import {readInquiryFocus,inquiryConclusion,type InquiryFocus} from './old-street-inquiry'
import {archiveRoomLayout,readArchiveRoom} from './old-street-archive-room'
export const archiveCardIds=['a','b','c','d'] as const
export type ArchiveCardId=typeof archiveCardIds[number]
export type ArchiveRelation={before:ArchiveCardId;after:ArchiveCardId}
export type ArchiveContent={title:string;layout:'west-index'|'east-index';room?:string[];denseSource?:'index'|'ledger';ledgerSite?:'photo'|'laundry';cards:Array<{id:ArchiveCardId;label:string}>;sources:{index:ArchiveRelation[];ledger:ArchiveRelation[]};discovery:string}
export type ArchiveSource=keyof ArchiveContent['sources']
export type ArchiveProgress={id:string;content:ArchiveContent;examined:ArchiveSource[];order?:ArchiveCardId[]}
const card=(id:unknown):id is ArchiveCardId=>archiveCardIds.includes(id as ArchiveCardId)
const object=(raw:unknown,keys:string[])=>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!keys.includes(k)))throw Error('ARCHIVE_CONTENT_INVALID')
 return raw as Record<string,unknown>
}
const line=(raw:unknown,max:number)=>{
 if(typeof raw==='string'&&raw.length>max)throw Error(`ARCHIVE_CONTENT_INVALID: text has ${raw.length} characters; maximum ${max}. Shorten this field.`)
 if(typeof raw!=='string'||!raw.trim()||raw.length>max||/[<>\u0000-\u001f]/.test(raw))throw Error('ARCHIVE_CONTENT_INVALID')
 return raw.trim()
}
const permutations=<T>(values:readonly T[]):T[][]=>values.length?values.flatMap((v,i)=>permutations([...values.slice(0,i),...values.slice(i+1)]).map(rest=>[v,...rest])):[[]]
export function archiveOrders(relations:readonly ArchiveRelation[]){
 return permutations(archiveCardIds).filter(order=>relations.every(r=>order.indexOf(r.before)<order.indexOf(r.after)))
}
export function readArchiveContent(raw:unknown):ArchiveContent{
 const r=object(raw,['title','layout','room','denseSource','ledgerSite','cards','sources','discovery']),sources=object(r.sources,['index','ledger'])
 if(!['west-index','east-index'].includes(String(r.layout))||!Array.isArray(r.cards)||r.cards.length!==4)throw Error('ARCHIVE_CONTENT_INVALID')
 const cards=r.cards.map(value=>{const c=object(value,['id','label']);if(!card(c.id))throw Error('ARCHIVE_CONTENT_INVALID');return {id:c.id,label:line(c.label,90)}})
 if(new Set(cards.map(c=>c.id)).size!==4||new Set(cards.map(c=>c.label.normalize('NFKC').toLowerCase())).size!==4)throw Error('ARCHIVE_CONTENT_INVALID')
 const evidence=(raw:unknown)=>{
  if(!Array.isArray(raw)||raw.length<1||raw.length>2)throw Error('ARCHIVE_CONTENT_INVALID')
  return raw.map(value=>{const e=object(value,['before','after']);if(!card(e.before)||!card(e.after)||e.before===e.after)throw Error('ARCHIVE_CONTENT_INVALID');return {before:e.before,after:e.after}})
 }
 if(r.denseSource!==undefined&&!['index','ledger'].includes(String(r.denseSource)))throw Error('ARCHIVE_CONTENT_INVALID')
 if(r.ledgerSite!==undefined&&!['photo','laundry'].includes(String(r.ledgerSite)))throw Error('ARCHIVE_LEDGER_SITE_INVALID')
 if(r.ledgerSite&&r.denseSource==='ledger')throw Error('ARCHIVE_LEDGER_SITE_INVALID: an off-site log is readable directly; choose denseSource index instead.')
 const content:ArchiveContent={...(r.ledgerSite===undefined?{}:{ledgerSite:r.ledgerSite as 'photo'|'laundry'}),...(r.denseSource===undefined?{}:{denseSource:r.denseSource as ArchiveSource}),title:line(r.title,60),layout:r.layout as ArchiveContent['layout'],...(r.room===undefined?{}:{room:readArchiveRoom(r.room)}),cards,sources:{index:evidence(sources.index),ledger:evidence(sources.ledger)},discovery:line(r.discovery,300)}
 const all=[...content.sources.index,...content.sources.ledger]
 if(all.length!==3||new Set(all.map(r=>r.before+':'+r.after)).size!==3||archiveOrders(all).length!==1)throw Error('ARCHIVE_ORDER_AMBIGUOUS')
 if(archiveOrders(content.sources.index).length<=1||archiveOrders(content.sources.ledger).length<=1)throw Error('ARCHIVE_EVIDENCE_REDUNDANT')
 return content
}
export function archiveOrderMatches(content:ArchiveContent,value:unknown):value is ArchiveCardId[]{
 return Array.isArray(value)&&value.length===4&&value.every(card)&&new Set(value).size===4&&[...content.sources.index,...content.sources.ledger].every(r=>value.indexOf(r.before)<value.indexOf(r.after))
}
/** The two question events are immutable endpoints. The model authors only the
 * intermediate events and which endpoint occurred earlier; the game authors
 * the written evidence and derives the conclusion from that same evidence. */
export function compileInquiryArchive(raw:unknown,focus:InquiryFocus,locale:'zh'|'en',variant=Math.floor(Math.random()*24)):ArchiveContent{
 const r=object(raw,['title','layout','room','middleEvents','earlier']),inquiry=readInquiryFocus(focus)
 if(r.layout!=='west-index'&&r.layout!=='east-index')throw Error('ARCHIVE_CONTENT_INVALID: layout must be the string west-index or east-index; the floor grid belongs in room.')
 if(!Array.isArray(r.middleEvents)||r.middleEvents.length!==2||!['first','second'].includes(String(r.earlier))||!Number.isInteger(variant)||variant<0||variant>=24)throw Error('ARCHIVE_CONTENT_INVALID')
 const middle=r.middleEvents.map(v=>line(v,90))
 const order:ArchiveCardId[]=r.earlier==='first'?['a','c','d','b']:['b','c','d','a']
 const byId={a:inquiry.first,b:inquiry.second,c:middle[0],d:middle[1]}
 // A newline grid is an equivalent authoring serialization, not geometry repair.
 // It still passes the same full validator; persisted content always uses rows.
 const room=typeof r.room==='string'?r.room.trim().split(/\r?\n/):r.room
 const content=readArchiveContent({title:r.title,layout:r.layout,...(room===undefined?{}:{room}),cards:permutations(archiveCardIds)[variant].map(id=>({id,label:byId[id]})),sources:{index:[{before:order[0],after:order[1]}],ledger:[{before:order[1],after:order[2]},{before:order[2],after:order[3]}]},discovery:inquiryConclusion(inquiry,r.earlier==='first',locale)})
 assertArchiveInquiry(content,inquiry)
 return content
}
export function assertArchiveInquiry(content:ArchiveContent,focus:InquiryFocus){
 if(content.cards.find(c=>c.id==='a')?.label!==focus.first||content.cards.find(c=>c.id==='b')?.label!==focus.second)throw Error('ARCHIVE_QUESTION_EVENTS_MISSING')
 // Also check cached candidates at admission; checking only fresh compilation
 // would let a previously prepared leaking card bypass the updated contract.
 if(content.cards.filter(c=>c.id==='c'||c.id==='d').some(c=>/\b(?:before|after|prior to|earlier than|later than|preceded|followed)\b|之前|之后|早于|晚于|先于|随后|然后/i.test(c.label)))throw Error('ARCHIVE_EVENT_LEAKS_ORDER: middleEvents must describe standalone events without before/after or any relative-timing clause. The game supplies the ordering evidence separately.')
 const direction=(order:ArchiveCardId[])=>order.indexOf('a')<order.indexOf('b')
 const all=archiveOrders([...content.sources.index,...content.sources.ledger])
 if(all.length!==1)throw Error('ARCHIVE_ORDER_AMBIGUOUS')
 for(const relations of Object.values(content.sources))if(new Set(archiveOrders(relations).map(direction)).size!==2)throw Error('ARCHIVE_QUESTION_EVIDENCE_REDUNDANT')
 if(![inquiryConclusion(focus,direction(all[0]),'zh'),inquiryConclusion(focus,direction(all[0]),'en')].includes(content.discovery))throw Error('ARCHIVE_CONCLUSION_UNSUPPORTED')
}
export function archiveEvidence(content:ArchiveContent,source:ArchiveSource,locale:'zh'|'en'){
 const label=(id:ArchiveCardId)=>content.cards.find(c=>c.id===id)!.label
 return content.sources[source].map(r=>locale==='zh'?`「${label(r.before)}」发生在「${label(r.after)}」之前。`:`“${label(r.before)}” happened before “${label(r.after)}”.`)
}
/** Stable threshold, generated furniture or either legacy arrangement. The same bodies
 * and approaches are consumed by collision, rendering and action validation. */
export function archiveLayout(layout:ArchiveContent['layout'],room?:unknown,shifted=false){
 if(room!==undefined)return archiveRoomLayout(room,shifted)
 const indexX=layout==='west-index'?112:224,ledgerX=layout==='west-index'?224:112
 const shelf=(id:string,x:number,y:number)=>({id,room:'archive' as const,body:{x,y,w:40,h:28},position:{x:x+20,y:y+28},approach:{x:x+12,y:y+44},actions:[] as string[]})
 return {
  floor:{x:88,y:64,w:208,h:448},arrival:{x:184,y:456},
  props:[shelf('archive-index',indexX,132),shelf('archive-ledger',ledgerX,216),{id:'archive-desk',room:'archive' as const,body:{x:156,y:332,w:72,h:32},position:{x:192,y:364},approach:{x:184,y:388},actions:[] as string[]}],
 }
}
export function archiveLayoutFromFacts(facts:Record<string,unknown>){
 return archiveLayout(facts['archive-layout']==='east-index'?'east-index':'west-index',typeof facts['archive-room']==='string'?JSON.parse(facts['archive-room']):undefined,facts['archive-rack-shifted']===true)
}
export function archiveRackState(facts:Record<string,unknown>){return typeof facts['archive-room']==='string'?archiveRoomLayout(JSON.parse(facts['archive-room']),facts['archive-rack-shifted']===true):undefined}
export function archiveRackLabel(facts:Record<string,unknown>,locale:'zh'|'en'){
 const slide=archiveRackState(facts)?.slide
 if(!slide)return ''
 if(facts['archive-rack-shifted']===true)return locale==='zh'?'移回储物架':'Slide the rack back'
 const left=slide.to.x<slide.from.x
 return locale==='zh'?`向${left?'左':'右'}移开储物架`:`Slide the rack ${left?'left':'right'}`
}
/** RPG-JS registers events before generation finishes. Bind stable slots now;
 * onInit places/hides them using the admitted room, never the placeholders. */
export function archiveEventSlots(){
 return [...archiveLayout('west-index').props,...[...Array.from({length:6},(_,i)=>`archive-storage-${i}`),'archive-rack'].map(id=>({id,room:'archive' as const,body:{x:92,y:96,w:40,h:40},position:{x:112,y:136},approach:{x:104,y:140},actions:[] as string[]}))]
}
