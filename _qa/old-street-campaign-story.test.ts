import test from 'node:test'
import assert from 'node:assert/strict'
import {randomUUID} from 'node:crypto'
import {oldStreetRuntime} from '../server/old-street-runtime'
import {campaignOpening} from '../src/old-street-campaign-story'
import {campaignInputKnowledge} from '../src/old-street-campaign-interaction'
import {oldStreetJournal} from '../src/old-street-journal'
import {readParcelContent} from '../src/old-street-campaign'
import {readPreparedInvestigation,compilePreparedInvestigation} from '../server/old-street-investigation-draft'
import {createOldStreetCampaignPlanner} from '../server/old-street-campaign-planner'

for(const locale of ['zh','en'] as const)test(`new ${locale} commission is visible before input; legacy opening is never retroactively rewritten`,()=>{
 const runtime=oldStreetRuntime(()=>true,undefined,undefined,()=>undefined,()=>undefined,undefined,async()=>({}))
 const original=runtime.initial(locale,randomUUID()),v1=runtime.initial(locale,randomUUID(),{campaign:'letter-trail-v1'}),v2=runtime.initial(locale,randomUUID(),{campaign:'letter-trail-v2'})
 const v3=runtime.initial(locale,randomUUID(),{campaign:'letter-trail-v3'})
 assert.equal(v3.campaign?.version,3)
 assert.match(campaignOpening(v3.save,''),locale==='zh'?/街景/:/glimpse/)
 assert.match(oldStreetJournal(v3.save,v3.campaign).notes[0].text,locale==='zh'?/旧照/:/photograph/)
 assert.notEqual(campaignOpening(v2.save,''),campaignOpening(original.save,''))
 assert.equal(campaignOpening(v1.save,''),campaignOpening(original.save,''))
 assert.deepEqual(campaignInputKnowledge(v2).map(k=>k.id),['learned:campaign-commission'],'goal is known, generated records are not')
 assert.ok(oldStreetJournal(v2.save,v2.campaign).notes.some(n=>n.id==='campaign-commission'))
 const legacy=structuredClone(v2)
 delete legacy.save.facts['campaign-commission'];legacy.save.blocks=structuredClone(original.save.blocks);legacy.save.objective=original.save.objective
 const restored=runtime.upgrade(legacy)
 assert.deepEqual(restored.save.blocks,original.save.blocks)
 assert.equal(restored.save.facts['campaign-commission'],undefined)
 assert.deepEqual(campaignInputKnowledge(restored),[])
})

test('new investigation asks a concrete question; older complete paper instances stay readable',async()=>{
 const previous={label:'Path repairs',mark:'two notches',wrapping:'string'},papers={title:'An undated note',fragment:'The note lists a survey and a delivery without dates.',question:'Did the delivery arrive before or after the survey?'}
 const old={title:papers.title,fragment:papers.fragment}
 assert.deepEqual(readParcelContent(old),old)
 assert.deepEqual(readParcelContent(papers),papers)
 assert.throws(()=>readParcelContent({...papers,question:'x'.repeat(141)}))
 let prompt=''
 const planner=createOldStreetCampaignPlanner(async system=>{prompt=system;return old})
 const signal=new AbortController().signal
 assert.deepEqual(await planner({stage:'parcel',locale:'en',previous},signal),old)
 await assert.rejects(planner({stage:'parcel',locale:'en',previous,investigation:true},signal),/INVESTIGATION_INVALID/)
 assert.match(prompt,/ONE complete coherent historical episode/)
 const draft={...old,recordAt:'end',events:['The damage was surveyed','Materials were ordered','The delivery arrived'],roomPlan:{indexSide:'left',storageShelves:1,rack:'none'}}
 const accepted=createOldStreetCampaignPlanner(async(_system,user)=>'chronologicalEvents' in JSON.parse(user)?{valid:true,issues:[]}:draft)
 const bundle=readPreparedInvestigation(await accepted({stage:'parcel',locale:'en',previous,investigation:true},signal))
 assert.deepEqual(bundle.parcel,compilePreparedInvestigation(draft,previous,'en',42).parcel)
 assert.ok(bundle.archive.room)
})
