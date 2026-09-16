import {readArchiveContent,archiveOrderMatches,assertArchiveInquiry,type ArchiveProgress} from './old-street-archive'
import {readInquiryFocus,inquiryQuestion,type InquiryFocus} from './old-street-inquiry'
/** Journey-local generated content. No executable model rules or media promises. */
export type TraceRecord={label:string;mark:string;wrapping:string}
export type TraceContent={title:string;clue:{mark:string;wrapping:string};records:TraceRecord[]}
export type ParcelContent={title:string;fragment:string;question?:string;inquiry?:InquiryFocus}
export type CampaignContext={locale:'zh'|'en';stage:'trace';previous?:never}|{locale:'zh'|'en';stage:'parcel';previous:TraceRecord;investigation?:true}|{locale:'zh'|'en';stage:'archive';previous:TraceRecord;papers:ParcelContent}
export type CampaignInstance<T>={id:string;content:T;observed:boolean}
export type OldStreetCampaign={
 version:1|2;
 trace?:CampaignInstance<TraceContent>&{selected?:number};
 parcel?:CampaignInstance<ParcelContent>&{disposition?:'take'|'leave'};
 archive?:ArchiveProgress;
}
const object=(raw:unknown,keys:string[])=>{
 if(!raw||typeof raw!=='object'||Array.isArray(raw)||Object.keys(raw).some(k=>!keys.includes(k)))throw Error('CAMPAIGN_CONTENT_INVALID')
 return raw as Record<string,unknown>
}
const line=(value:unknown,max:number)=>{
 if(typeof value!=='string'||!value.trim()||value.length>max||/[<>\u0000-\u001f]/.test(value))throw Error('CAMPAIGN_CONTENT_INVALID')
 return value.trim()
}
const signature=(record:Pick<TraceRecord,'mark'|'wrapping'>)=>[record.mark,record.wrapping].map(s=>s.normalize('NFKC').toLowerCase()).join('\u0000')
export function readTraceContent(raw:unknown):TraceContent{
 const r=object(raw,['title','clue','records']),clue=object(r.clue,['mark','wrapping'])
 if(!Array.isArray(r.records)||r.records.length!==3)throw Error('CAMPAIGN_CONTENT_INVALID')
 const content={title:line(r.title,60),clue:{mark:line(clue.mark,60),wrapping:line(clue.wrapping,60)},records:r.records.map(raw=>{
  const row=object(raw,['label','mark','wrapping']);return {label:line(row.label,70),mark:line(row.mark,60),wrapping:line(row.wrapping,60)}
 })}
 if(new Set(content.records.map(r=>r.label.normalize('NFKC').toLowerCase())).size!==3||new Set(content.records.map(signature)).size!==3||content.records.filter(r=>signature(r)===signature(content.clue)).length!==1)throw Error('CAMPAIGN_PUZZLE_AMBIGUOUS')
 // Both clues must matter: each has a plausible distractor, their intersection is unique.
 for(const key of ['mark','wrapping'] as const)if(content.records.filter(r=>r[key].normalize('NFKC').toLowerCase()===content.clue[key].normalize('NFKC').toLowerCase()).length<2)throw Error('CAMPAIGN_PUZZLE_TRIVIAL')
 return content
}
/** Model authors vocabulary; the engine constructs the solvable conjunction.
 * The accepted result is stored as ordinary TraceContent, never re-shuffled. */
export function compileTraceDraft(raw:unknown,variant=Math.floor(Math.random()*6)):TraceContent{
 const r=object(raw,['title','marks','wrappings','subjects'])
 const pair=(value:unknown)=>{
  if(!Array.isArray(value)||value.length!==2)throw Error('CAMPAIGN_CONTENT_INVALID')
  const values=value.map(v=>line(v,60))
  if(values[0].normalize('NFKC').toLowerCase()===values[1].normalize('NFKC').toLowerCase())throw Error('CAMPAIGN_CONTENT_INVALID')
  return values
 }
 if(!Array.isArray(r.subjects)||r.subjects.length!==3||!Number.isInteger(variant)||variant<0||variant>5)throw Error('CAMPAIGN_CONTENT_INVALID')
 const marks=pair(r.marks),wrappings=pair(r.wrappings),subjects=r.subjects.map(v=>line(v,70))
 const records=[{label:subjects[0],mark:marks[0],wrapping:wrappings[0]},{label:subjects[1],mark:marks[0],wrapping:wrappings[1]},{label:subjects[2],mark:marks[1],wrapping:wrappings[0]}]
 const order=[[0,1,2],[0,2,1],[1,0,2],[2,0,1],[1,2,0],[2,1,0]][variant]
 return readTraceContent({title:line(r.title,60),clue:{mark:marks[0],wrapping:wrappings[0]},records:order.map(i=>records[i])})
}
export function readParcelContent(raw:unknown):ParcelContent{
 const r=object(raw,['title','fragment','question','inquiry']),inquiry=r.inquiry===undefined?undefined:readInquiryFocus(r.inquiry)
 if(inquiry&&![inquiryQuestion(inquiry,'zh'),inquiryQuestion(inquiry,'en')].includes(String(r.question)))throw Error('CAMPAIGN_INQUIRY_QUESTION_MISMATCH')
 return {title:line(r.title,60),fragment:line(r.fragment,420),...(r.question===undefined?{}:{question:line(r.question,inquiry?180:140)}),...(inquiry?{inquiry}:{})}
}
export function compileInquiryParcel(raw:unknown,locale:'zh'|'en'):ParcelContent{
 const r=object(raw,['title','fragment','inquiry']),inquiry=readInquiryFocus(r.inquiry)
 return readParcelContent({title:r.title,fragment:line(r.fragment,240),inquiry,question:inquiryQuestion(inquiry,locale)})
}
/** The selected record is always one endpoint, not a suggestion to the model. */
export function compileLinkedParcel(raw:unknown,record:TraceRecord,locale:'zh'|'en'):ParcelContent{
 const r=object(raw,['title','fragment','otherEvent'])
 return compileInquiryParcel({title:r.title,fragment:r.fragment,inquiry:{first:record.label,second:line(r.otherEvent,50)}},locale)
}
export function campaignRecordMatches(content:TraceContent,index:number){return Number.isInteger(index)&&!!content.records[index]&&signature(content.records[index])===signature(content.clue)}
export function campaignComplete(c:OldStreetCampaign){return c.trace?.observed===true&&c.trace.selected!==undefined&&campaignRecordMatches(c.trace.content,c.trace.selected)&&c.parcel?.observed===true&&['take','leave'].includes(c.parcel.disposition??'')&&(c.version===1||!!c.archive?.order)}
export function assertOldStreetCampaign(raw:unknown):asserts raw is OldStreetCampaign|undefined{
 if(raw===undefined)return
 const c=object(raw,['version','trace','parcel','archive']);if(c.version!==1&&c.version!==2)throw Error('CAMPAIGN_SAVE_INVALID')
 if(c.trace!==undefined){
  const trace=object(c.trace,['id','content','observed','selected']);instance(trace);const content=readTraceContent(trace.content)
  if(trace.selected!==undefined&&(!trace.observed||!campaignRecordMatches(content,trace.selected as number)))throw Error('CAMPAIGN_SAVE_INVALID')
 }
 if(c.parcel!==undefined){
  const trace=c.trace as OldStreetCampaign['trace'],parcel=object(c.parcel,['id','content','observed','disposition']);instance(parcel);readParcelContent(parcel.content)
  if(!trace||trace.selected===undefined)throw Error('CAMPAIGN_SAVE_INVALID')
  if(parcel.disposition!==undefined&&(!parcel.observed||!['take','leave'].includes(parcel.disposition as string)))throw Error('CAMPAIGN_SAVE_INVALID')
 }
 if(c.archive!==undefined){
  if(c.version!==2||!(c.parcel as OldStreetCampaign['parcel'])?.observed)throw Error('CAMPAIGN_SAVE_INVALID')
  const a=object(c.archive,['id','content','examined','order']);instance({id:a.id,observed:true})
  const content=readArchiveContent(a.content)
  const inquiry=(c.parcel as OldStreetCampaign['parcel'])?.content.inquiry
  if(inquiry)assertArchiveInquiry(content,inquiry)
  if(!Array.isArray(a.examined)||new Set(a.examined).size!==a.examined.length||a.examined.some(v=>v!=='index'&&v!=='ledger'))throw Error('CAMPAIGN_SAVE_INVALID')
  if(a.order!==undefined&&(a.examined.length!==2||!archiveOrderMatches(content,a.order)))throw Error('CAMPAIGN_SAVE_INVALID')
 }
}
function instance(r:Record<string,unknown>){if(typeof r.id!=='string'||!/^[a-zA-Z0-9-]{16,80}$/.test(r.id)||typeof r.observed!=='boolean')throw Error('CAMPAIGN_SAVE_INVALID')}
export const campaignAnchor={trace:{scene:'shop',target:'record-book'},parcel:{scene:'cellar',target:'photo-folder'}} as const
