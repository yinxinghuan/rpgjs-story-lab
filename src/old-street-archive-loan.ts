import type {ArchiveContent,ArchiveProgress} from './old-street-archive'
/** One admitted location drives the source, map paper and player-facing lead.
 * Undefined preserves the exact old journey; this is never rerolled on load. */
export const archiveLoanSites={photo:{target:'viewing-table',labels:['照相馆放大台','the photo studio viewing table']},laundry:{target:'clock-display',labels:['洗衣店柜台','the laundry counter']}} as const
export function archiveLoanLocation(content:Pick<ArchiveContent,'ledgerSite'>){return content.ledgerSite?archiveLoanSites[content.ledgerSite]:undefined}
export function archiveLoanAt(content:Pick<ArchiveContent,'ledgerSite'>,target:string){return archiveLoanLocation(content)?.target===target}
export function archiveLoanLead(content:Pick<ArchiveContent,'ledgerSite'>,locale:'zh'|'en'){
 const site=archiveLoanLocation(content);if(!site)return ''
 return locale==='zh'?`借阅条：工作日志暂放在${site.labels[0]}。可以在那里查阅，再带着笔记回来核对。`:`Loan slip: the work log is at ${site.labels[1]}. Read it there, then bring your notes back to compare.`
}
export function archiveLoanKnown(archive:ArchiveProgress|undefined,facts:Record<string,unknown>){return !!archive?.content.ledgerSite&&(facts['archive-loan-read']===true||archive.examined.includes('ledger'))}
export function archiveLoanPaperSheet(image:string){return {id:'oldstreet-loaned-log',image,width:1024,height:512,framesWidth:2,framesHeight:1,textures:Object.fromEntries(['stand','returned'].map(state=>[state,{animations:()=>[[{frameX:1,frameY:0,time:0,anchor:[.5,310/512],scale:[.05,.033],x:30,y:6,opacity:1}]]}]))}}
