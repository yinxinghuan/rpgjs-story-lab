import {compileLinkedParcel,readParcelContent,type ParcelContent,type TraceRecord} from '../src/old-street-campaign'
import {compileInquiryArchive,readArchiveContent,assertArchiveInquiry,type ArchiveContent} from '../src/old-street-archive'
import {composeArchiveRoom} from './old-street-room-composer'

/** Server-only preparation result. Jobs expose the parcel alone and retain
 * its matching archive separately until the ordinary archive admission step. */
export type PreparedInvestigation={kind:'prepared-investigation';parcel:ParcelContent;archive:ArchiveContent}
export function isPreparedInvestigation(raw:unknown):raw is PreparedInvestigation{return !!raw&&typeof raw==='object'&&'kind' in raw&&raw.kind==='prepared-investigation'}
export function readPreparedInvestigation(raw:unknown):PreparedInvestigation{
 if(!isPreparedInvestigation(raw)||Object.keys(raw).some(k=>!['kind','parcel','archive'].includes(k)))throw Error('CAMPAIGN_INVESTIGATION_INVALID')
 const parcel=readParcelContent(raw.parcel),archive=readArchiveContent(raw.archive)
 if(!parcel.inquiry||!archive.room)throw Error('CAMPAIGN_INVESTIGATION_INVALID')
 assertArchiveInquiry(archive,parcel.inquiry)
 return {kind:'prepared-investigation',parcel,archive}
}
export function compilePreparedInvestigation(raw:unknown,record:TraceRecord,locale:'zh'|'en',seed?:number):PreparedInvestigation{
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw Error('CAMPAIGN_INVESTIGATION_INVALID')
 const r=raw as Record<string,unknown>
 if(Object.keys(r).some(k=>!['title','fragment','recordAt','events','roomPlan','denseSource','ledgerSite'].includes(k))||!['start','end'].includes(String(r.recordAt))||!Array.isArray(r.events)||![3,4].includes(r.events.length)||r.events.some(e=>typeof e!=='string'||!e.trim()||e.length>70))throw Error('CAMPAIGN_INVESTIGATION_INVALID: return title, recordAt=start|end, four short chronological events including the exact fixed event at that endpoint, and roomPlan.')
 const atStart=r.recordAt==='start',all=r.events as string[]
 // Accept the earlier three-other-events author format as well. A full account
 // is valid only when the supplied fixed event is retained verbatim at its end.
 if(all.length===4&&all[atStart?0:3]!==record.label)throw Error(`CAMPAIGN_INVESTIGATION_INVALID: recordAt=${r.recordAt} requires events[${atStart?0:3}] to equal ${JSON.stringify(record.label)}. Alternatively return exactly three OTHER events; the engine inserts the fixed event.`)
 const events=all.length===4?(atStart?all.slice(1):all.slice(0,3)):all
 if(events.includes(record.label))throw Error(`CAMPAIGN_INVESTIGATION_INVALID: remove the duplicate ${JSON.stringify(record.label)} from the three OTHER events; it is inserted by the engine at recordAt.`)
 const otherEvent=atStart?events[2]:events[0]
 // The opening is an undated pair of actual entries, not a model-written
 // synopsis that can accidentally disclose the solution of its own puzzle.
 const fragment=locale==='zh'?`同一纸袋里有两条记录：「${record.label}」和「${otherEvent}」。这张寄存条没有说明它们的先后。`:`Two entries were filed together: “${record.label}” and “${otherEvent}”. This filing slip does not explain their order.`
 const parcel=compileLinkedParcel({title:r.title,fragment,otherEvent},record,locale)
 const chronology=atStart?[record.label,...events]:[...events,record.label]
 const compiled=compileInquiryArchive({title:r.title,...composeArchiveRoom(r.roomPlan,seed),middleEvents:chronology.slice(1,3),earlier:atStart?'first':'second'},parcel.inquiry!,locale)
 if(r.ledgerSite!==undefined&&!['archive','photo','laundry'].includes(String(r.ledgerSite)))throw Error('ARCHIVE_LEDGER_SITE_INVALID')
 const archive=readArchiveContent({...compiled,...(r.ledgerSite&&r.ledgerSite!=='archive'?{ledgerSite:r.ledgerSite}:{}),...(r.denseSource===undefined?{}:{denseSource:r.denseSource})})
 return readPreparedInvestigation({kind:'prepared-investigation',parcel,archive})
}
