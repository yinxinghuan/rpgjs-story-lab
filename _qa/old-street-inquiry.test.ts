import test from 'node:test'
import assert from 'node:assert/strict'
import {compileInquiryParcel,compileLinkedParcel,readParcelContent} from '../src/old-street-campaign'
import {compileInquiryArchive,assertArchiveInquiry,archiveOrders} from '../src/old-street-archive'
import {inquiryQuestion,inquiryConclusion} from '../src/old-street-inquiry'
import {readFileSync} from 'node:fs'
const focus={first:'The street market moved',second:'The covered walkway reopened'}
const draft={title:'A shared route',layout:'east-index',middleEvents:['A temporary route was marked','A path inspection was recorded'],earlier:'first'}

test('both directions and every card arrangement answer exactly the two events asked about',()=>{
 for(const locale of ['zh','en'] as const)for(const earlier of ['first','second'] as const)for(let variant=0;variant<24;variant++){
  const c=compileInquiryArchive({...draft,earlier},focus,locale,variant)
  const order=archiveOrders([...c.sources.index,...c.sources.ledger])[0]
  assert.equal(order.indexOf('a')<order.indexOf('b'),earlier==='first')
  assert.equal(c.discovery,inquiryConclusion(focus,earlier==='first',locale))
  for(const source of Object.values(c.sources))assert.equal(new Set(archiveOrders(source).map(o=>o.indexOf('a')<o.indexOf('b'))).size,2,'neither shelf alone answers the actual question')
 }
})

test('missing question events, unsupported conclusions and single-source answers cannot be admitted',()=>{
 const c=compileInquiryArchive(draft,focus,'en')
 assert.throws(()=>assertArchiveInquiry({...c,cards:c.cards.map(card=>card.id==='b'?{...card,label:'A broken shovel was found'}:card)},focus),/EVENTS_MISSING/)
 assert.throws(()=>assertArchiveInquiry({...c,discovery:'The repairs were finished and everyone went home.'},focus),/CONCLUSION_UNSUPPORTED/)
 const direct={...c,sources:{index:[{before:'a' as const,after:'b' as const}],ledger:[{before:'b' as const,after:'c' as const},{before:'c' as const,after:'d' as const}]}}
 assert.throws(()=>assertArchiveInquiry(direct,focus),/EVIDENCE_REDUNDANT/)
})

test('new questions retain event identity through save reload; older prose questions remain untouched',()=>{
 const papers=compileInquiryParcel({title:'The undated note',fragment:'Both events appear without dates.',inquiry:focus},'en')
 assert.equal(papers.question,inquiryQuestion(focus,'en'))
 assert.deepEqual(readParcelContent(JSON.parse(JSON.stringify(papers))),papers)
 assert.throws(()=>readParcelContent({...papers,question:'When did all repairs finish?'}),/QUESTION_MISMATCH/)
 const legacy={title:'Old record',fragment:'A saved earlier record.',question:'When did all repairs finish?'}
 assert.deepEqual(readParcelContent(legacy),legacy)
})

test('linked papers keep the selected subject; real event-label answer leakage is rejected',()=>{
 const previous={label:'Sidewalk crack repairs on Maple Street',mark:'stamp',wrapping:'twine'}
 const papers=compileLinkedParcel({title:'An undated note',fragment:'The two events are listed without dates.',otherEvent:'Power outage affected several blocks'},previous,'en')
 assert.equal(papers.inquiry?.first,previous.label)
 assert.throws(()=>compileLinkedParcel({title:'Wrong topic',fragment:'Different repairs.',inquiry:focus,otherEvent:'Power outage'},previous,'en'),/CONTENT_INVALID/)
 const report=JSON.parse(readFileSync(new URL('../doc/campaign-live-20260917/inquiry-attempt-1.json',import.meta.url),'utf8'))
 const parcel=report.cases.find((c:any)=>c.chain===1&&c.stage==='parcel').accepted
 const archive=report.cases.find((c:any)=>c.chain===1&&c.stage==='archive').raw
 assert.throws(()=>compileInquiryArchive(archive,parcel.inquiry,'en'),/EVENT_LEAKS_ORDER/)
})
