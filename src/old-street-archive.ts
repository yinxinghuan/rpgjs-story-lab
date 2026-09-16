/** A generated investigation uses existing furniture and explicit ordering
 * evidence. The model never supplies executable rules or a trusted answer. */
export const archiveCardIds=['a','b','c','d'] as const
export type ArchiveCardId=typeof archiveCardIds[number]
export type ArchiveRelation={before:ArchiveCardId;after:ArchiveCardId}
export type ArchiveContent={title:string;layout:'west-index'|'east-index';cards:Array<{id:ArchiveCardId;label:string}>;sources:{index:ArchiveRelation[];ledger:ArchiveRelation[]};discovery:string}
export type ArchiveSource=keyof ArchiveContent['sources']
export type ArchiveProgress={id:string;content:ArchiveContent;examined:ArchiveSource[];order?:ArchiveCardId[]}
const card=(id:unknown):id is ArchiveCardId=>archiveCardIds.includes(id as ArchiveCardId)
const object=(raw:unknown,keys:string[])=>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!keys.includes(k)))throw Error('ARCHIVE_CONTENT_INVALID')
 return raw as Record<string,unknown>
}
const line=(raw:unknown,max:number)=>{
 if(typeof raw!=='string'||!raw.trim()||raw.length>max||/[<>\u0000-\u001f]/.test(raw))throw Error('ARCHIVE_CONTENT_INVALID')
 return raw.trim()
}
const permutations=<T>(values:readonly T[]):T[][]=>values.length?values.flatMap((v,i)=>permutations([...values.slice(0,i),...values.slice(i+1)]).map(rest=>[v,...rest])):[[]]
export function archiveOrders(relations:readonly ArchiveRelation[]){
 return permutations(archiveCardIds).filter(order=>relations.every(r=>order.indexOf(r.before)<order.indexOf(r.after)))
}
export function readArchiveContent(raw:unknown):ArchiveContent{
 const r=object(raw,['title','layout','cards','sources','discovery']),sources=object(r.sources,['index','ledger'])
 if(!['west-index','east-index'].includes(String(r.layout))||!Array.isArray(r.cards)||r.cards.length!==4)throw Error('ARCHIVE_CONTENT_INVALID')
 const cards=r.cards.map(value=>{const c=object(value,['id','label']);if(!card(c.id))throw Error('ARCHIVE_CONTENT_INVALID');return {id:c.id,label:line(c.label,90)}})
 if(new Set(cards.map(c=>c.id)).size!==4||new Set(cards.map(c=>c.label.normalize('NFKC').toLowerCase())).size!==4)throw Error('ARCHIVE_CONTENT_INVALID')
 const evidence=(raw:unknown)=>{
  if(!Array.isArray(raw)||raw.length<1||raw.length>2)throw Error('ARCHIVE_CONTENT_INVALID')
  return raw.map(value=>{const e=object(value,['before','after']);if(!card(e.before)||!card(e.after)||e.before===e.after)throw Error('ARCHIVE_CONTENT_INVALID');return {before:e.before,after:e.after}})
 }
 const content:ArchiveContent={title:line(r.title,60),layout:r.layout as ArchiveContent['layout'],cards,sources:{index:evidence(sources.index),ledger:evidence(sources.ledger)},discovery:line(r.discovery,300)}
 const all=[...content.sources.index,...content.sources.ledger]
 if(all.length!==3||new Set(all.map(r=>r.before+':'+r.after)).size!==3||archiveOrders(all).length!==1)throw Error('ARCHIVE_ORDER_AMBIGUOUS')
 if(archiveOrders(content.sources.index).length<=1||archiveOrders(content.sources.ledger).length<=1)throw Error('ARCHIVE_EVIDENCE_REDUNDANT')
 return content
}
export function archiveOrderMatches(content:ArchiveContent,value:unknown):value is ArchiveCardId[]{
 return Array.isArray(value)&&value.length===4&&value.every(card)&&new Set(value).size===4&&[...content.sources.index,...content.sources.ledger].every(r=>value.indexOf(r.before)<value.indexOf(r.after))
}
export function archiveEvidence(content:ArchiveContent,source:ArchiveSource,locale:'zh'|'en'){
 const label=(id:ArchiveCardId)=>content.cards.find(c=>c.id===id)!.label
 return content.sources[source].map(r=>locale==='zh'?`「${label(r.before)}」发生在「${label(r.after)}」之前。`:`“${label(r.before)}” happened before “${label(r.after)}”.`)
}
/** Stable threshold and two bounded furniture arrangements. The same bodies
 * and approaches are consumed by collision, rendering and action validation. */
export function archiveLayout(layout:ArchiveContent['layout']){
 const indexX=layout==='west-index'?112:224,ledgerX=layout==='west-index'?224:112
 const shelf=(id:string,x:number,y:number)=>({id,room:'archive' as const,body:{x,y,w:40,h:28},position:{x:x+20,y:y+28},approach:{x:x+12,y:y+44},actions:[] as string[]})
 return {
  floor:{x:88,y:64,w:208,h:448},arrival:{x:184,y:456},
  props:[shelf('archive-index',indexX,132),shelf('archive-ledger',ledgerX,216),{id:'archive-desk',room:'archive' as const,body:{x:156,y:332,w:72,h:32},position:{x:192,y:364},approach:{x:184,y:388},actions:[] as string[]}],
 }
}
